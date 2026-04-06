import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map alerts table fields to what the UI expects
    const mapped = (data || []).map((a: any) => ({
      ...a,
      alert_type: a.alert_type,
      person_name: a.member_name || 'Unknown Person',
      location: a.metadata?.camera_name || 'Entrance',
      description: `SECURITY: ${a.alert_type?.replace(/_/g, ' ')} detected at ${a.metadata?.camera_name || 'entrance'} - Confidence: ${((a.confidence || 0) * 100).toFixed(1)}%`,
      detection_time: a.timestamp || a.created_at,
      resolved: a.status === 'resolved',
      resolution_notes: a.metadata?.resolution_notes || null,
      snapshot_url: a.snapshot_url,
    }));

    return NextResponse.json({ alerts: mapped })
  } catch (error: any) {
    console.error('GET /api/alerts error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const body = await request.json();
    const { organization_id, camera_id, type, image_url, metadata } = body;

    if (!organization_id || !camera_id) {
      return NextResponse.json({ error: 'Missing organization_id or camera_id' }, { status: 400 });
    }

    // 1. Send image to AI Service for face detection
    let aiMetadata = { ...metadata };
    if (image_url && image_url.startsWith('data:')) {
      try {
        const aiResponse = await fetch('http://localhost:8000/api/detect-face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: image_url })
        });
        
        const aiResult = await aiResponse.json();
        if (aiResult.success) {
          aiMetadata = {
            ...aiMetadata,
            face_detected: aiResult.face_count > 0,
            face_count: aiResult.face_count,
            detections: aiResult.detections,
            analyzed_by: 'ai-service-v1',
            status: aiResult.face_count > 0 ? 'human_detected' : 'motion_only'
          };
        }
      } catch (aiError) {
        console.error('AI Service call failed:', aiError);
        aiMetadata.ai_error = 'AI service unreachable';
      }
    }

    // 2. Insert detection record
    const { data, error } = await supabase
      .from('detections')
      .insert({
        organization_id,
        camera_id,
        detection_type: type || (aiMetadata.face_detected ? 'human' : 'motion'),
        image_url,
        metadata: aiMetadata,
        detection_time: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, detection: data });

  } catch (error: any) {
    console.error('POST /api/alerts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process alert' },
      { status: 500 }
    );
  }
}
