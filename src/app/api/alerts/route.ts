import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // 1. Get the current session
    const { data: { session } } = await supabase.auth.getSession();

    // 2. Fetch the user's organization
    // 2. Fetch the user's authorized organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', session?.user.id);
    
    const orgIds = userOrgs?.map(uo => uo.organization_id) || [];
    
    // 3. Fetch detections (using the table name provided by user)
    let query = supabase.from('detections').select('*');
    
    if (orgIds.length > 0) {
      query = query.in('organization_id', orgIds);
    } else if (session) {
      // If user is logged in but has no assigned orgs, they shouldn't see anything
      // RLS will also handle this, but we'll be explicit.
      query = query.eq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { data, error } = await query
      .order('detection_time', { ascending: false });

    if (error) {
      // Provide more helpful context for the common RLS parameter error
      if (error.message.includes('app.current_org_id')) {
        return NextResponse.json({ 
          error: `Database RLS policy error: The "detections" table expects "app.current_org_id" to be set. Please run the SQL fix from the implementation plan in your Supabase SQL Editor.` 
        }, { status: 500 });
      }
      throw error;
    }

    return NextResponse.json({ alerts: data })
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
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
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
        const aiResponse = await fetch('http://localhost:5001/detect', {
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
