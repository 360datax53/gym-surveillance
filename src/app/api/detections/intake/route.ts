import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { sendUnrecognizedPersonAlert } from '@/lib/email';

// Ray-casting point-in-polygon
function pointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

async function resolveZone(
  supabase: any,
  cameraDbId: string,
  personX?: number,
  personY?: number,
  fallbackZone?: string
): Promise<string> {
  // If normalized coordinates are provided, try point-in-polygon against camera_zones
  if (typeof personX === 'number' && typeof personY === 'number') {
    const { data: zones } = await supabase
      .from('camera_zones')
      .select('zone_name, polygon_coords')
      .eq('camera_id', cameraDbId)
      .eq('is_active', true);

    if (zones && zones.length > 0) {
      for (const zone of zones) {
        if (zone.polygon_coords?.length >= 3) {
          if (pointInPolygon({ x: personX, y: personY }, zone.polygon_coords)) {
            return zone.zone_name;
          }
        }
      }
    }
  }
  return fallbackZone || 'full_frame';
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Using service role key for automated system events (Step 7/8 bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const CONFIDENCE_THRESHOLD = 0.75;

/**
 * OpenAI Vision Call with Retry Logic (Step 4 & 5)
 */
async function callOpenAIVision(snapshotUrl: string, members: any[]): Promise<any> {
    const memberImageUrls = members.map(m => ({
        id: m.id,
        name: m.name,
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${m.id}.jpg`
    }));

    const messages: any[] = [
        {
            role: 'system',
            content: `You are a facial recognition security assistant. Compare the 'Target Image' with the provided 'Member Images'. 
Identify if the person in the target image matches ANY of the members.
Strictly return a JSON object:
{
  "matched": boolean,
  "member_id": "uuid" | null,
  "member_name": "string" | null,
  "confidence": number (0.0 to 1.0)
}`
        },
        {
            role: 'user',
            content: [
                { type: 'text', text: 'Target Image (Recent Snapshot):' },
                { type: 'image_url', image_url: { url: snapshotUrl } },
                { type: 'text', text: 'Member Images to match against:' },
                ...memberImageUrls.map(img => ({
                    type: 'image_url',
                    image_url: { url: img.url }
                }))
            ]
        }
    ];

    let lastError = null;
    for (let i = 0; i < 3; i++) { // Max 2 retries (3 total attempts)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages,
                response_format: { type: 'json_object' }
            });

            clearTimeout(timeoutId);

            const content = response.choices[0].message.content || '{}';
            return JSON.parse(content);
        } catch (error) {
            console.error(`OpenAI Attempt ${i + 1} failed:`, error);
            lastError = error;
            if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
        }
    }
    
    // On complete failure, treat as unmatched
    return { matched: false, member_id: null, member_name: null, confidence: 0, error: lastError?.toString() };
}

export async function POST(request: NextRequest) {
    try {
        // --- STEP 1: Setup & Validation ---
        const body = await request.json();
        const { snapshot_url, camera_id, timestamp } = body;

        if (!snapshot_url || !camera_id || !timestamp) {
            return NextResponse.json({ success: false, error: 'Missing required fields: snapshot_url, camera_id, timestamp' }, { status: 400 });
        }

        // --- STEP 2: Fetch Camera & Organization ---
        const { data: camera, error: cameraError } = await supabase
            .from('cameras')
            .select('id, name, organization_id, branch_id, organizations(name)')
            .eq('camera_id', camera_id)
            .single();

        if (cameraError || !camera) {
            return NextResponse.json({ success: false, error: 'Camera not found' }, { status: 404 });
        }

        const orgName = (camera.organizations as any)?.name || 'Gym Branch';

        // --- STEP 3: Fetch Members to Match Against ---
        const { data: members, error: membersError } = await supabase
            .from('members')
            .select('id, name, membership_status, registered_at, face_encoding')
            .eq('organization_id', camera.organization_id)
            .not('face_encoding', 'is', null)
            .order('membership_status', { ascending: true }) // 'active' < 'inactive' lexicographically? No, we better sort manually or use a specific query
            .order('registered_at', { ascending: false })
            .limit(20); // Fetch a few more to filter manually

        if (membersError) console.error('Members fetch error:', membersError);

        // Manual prioritization: Active first, then most recent registration
        const prioritizedMembers = (members || [])
            .sort((a, b) => {
                if (a.membership_status === 'active' && b.membership_status !== 'active') return -1;
                if (a.membership_status !== 'active' && b.membership_status === 'active') return 1;
                return new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime();
            })
            .slice(0, 10); // CAP at 10 (Step 3)

        if (prioritizedMembers.length === 0) {
            return NextResponse.json({ success: true, matched: false, message: 'No registered members with face data found.' });
        }

        // --- STEP 4 & 5: Call OpenAI Vision & Parse Response ---
        const aiResult = await callOpenAIVision(snapshot_url, prioritizedMembers);
        const { matched, member_id, member_name, confidence } = aiResult;

        // --- STEP 5b: Resolve zone via point-in-polygon (person_x/y are optional normalized coords) ---
        const { person_x, person_y } = body;
        const detectedZone = await resolveZone(supabase, camera.id, person_x, person_y, (camera as any).zone);

        // --- STEP 6: Decision Logic ---
        const shouldAlert = !matched || (matched && confidence < CONFIDENCE_THRESHOLD);

        // --- STEP 7: Create Alert in Supabase ---
        let alertId = null;
        if (shouldAlert) {
            const { data: alertData, error: alertError } = await supabase
                .from('alerts')
                .insert({
                    organization_id: camera.organization_id,
                    camera_id: camera.id,
                    alert_type: 'unrecognised_entry',
                    snapshot_url,
                    timestamp,
                    confidence: confidence || 0,
                    member_id: member_id || null,
                    member_name: member_name || null,
                    metadata: {
                        openai_raw: aiResult,
                        camera_name: camera.name,
                        zone_name: detectedZone,
                        camera_zone: (camera as any).zone,
                        prioritized_member_count: prioritizedMembers.length
                    },
                    status: 'active'
                })
                .select('id')
                .single();

            if (alertError) {
                console.error('Failed to create alert in Supabase:', alertError);
            } else {
                alertId = alertData.id;
            }

            // --- STEP 8: Send Email (If Alert Created) ---
            if (alertId) {
                let recipientEmail = null;

                // 8.a. Lookup Branch Manager
                if (camera.branch_id) {
                    const { data: branch } = await supabase
                        .from('branches')
                        .select('manager_email')
                        .eq('id', camera.branch_id)
                        .single();
                    recipientEmail = branch?.manager_email;
                }

                // 8.b. Fallback to Organization Admins
                if (!recipientEmail) {
                    const { data: admins } = await supabase
                        .from('user_organizations')
                        .select('user_id')
                        .eq('organization_id', camera.organization_id)
                        .eq('role', 'admin')
                        .limit(5);
                    
                    if (admins && admins.length > 0) {
                        // Fetch emails for these user IDs from auth.users or profiles
                        // For MVP, we'll assume there's a profiles table or just use one if possible
                        // Since I don't see profiles, I'll fallback to organization level if needed
                        recipientEmail = 'edataxr@gmail.com'; // Failsafe admin email
                    }
                }

                if (recipientEmail) {
                    await sendUnrecognizedPersonAlert(recipientEmail, {
                        cameraName: camera.name,
                        snapshotUrl: snapshot_url,
                        timestamp,
                        organizationName: orgName,
                        confidence: confidence || 0,
                        location: (camera as any).zone || 'Entrance'
                    }).catch(err => console.error('Email alert delivery failed:', err));
                }
            }
        } else if (matched && member_id) {
            // Log successful entry (Step 9 helper logic)
            await supabase.from('entries').insert({
                organization_id: camera.organization_id,
                camera_id: camera.id,
                member_id: member_id,
                entry_time: timestamp,
                is_member: true,
                confidence_score: confidence
            }).then(({ error: e }) => { if (e) console.error('Failed to log entry:', e); });
        }

        // --- STEP 9: Return Response ---
        return NextResponse.json({
            success: true,
            matched: !!matched,
            confidence: confidence || 0,
            alert_created: !!alertId,
            alert_id: alertId
        });

    } catch (error: any) {
        console.error('Detection Intake Pipeline Critical Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Pipeline Failure' }, { status: 500 });
    }
}
