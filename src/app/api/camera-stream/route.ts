import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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
    const { camera_id, image_base64, organization_id, location } = body;

    // Call AI service for face detection on port 5005
    const aiResponse = await fetch('http://localhost:5005/api/detect-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: image_base64 })
    });

    const detection = await aiResponse.json();

    if (detection.success && detection.face_count > 0) {
      // Create detection record in Supabase
      await supabase.from('detections').insert({
        organization_id: organization_id,
        camera_id: camera_id,
        detection_time: new Date().toISOString(),
        person_name: 'Detected Person',
        confidence: detection.detections[0].confidence,
        is_member: false,
        alert_type: 'detection',
        location: location,
        metadata: {
            face_count: detection.face_count,
            detections: detection.detections,
            source: 'live-stream'
        }
      });
    }

    return NextResponse.json({
      success: true,
      detections: detection.detections
    });
  } catch (error) {
    console.error('Stream processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process stream' },
      { status: 500 }
    );
  }
}
