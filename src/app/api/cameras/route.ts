import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

    const { data: { session } } = await supabase.auth.getSession();
    let orgId = null;
    if (session) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', session.user.id)
        .maybeSingle();
      orgId = org?.id;
    }

    if (orgId) {
      await supabase.rpc('set_app_org_id', { org_id: orgId });
    }

    const { data, error } = await supabase
      .from('cameras')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ cameras: data });
  } catch (error: any) {
    console.error('GET /api/cameras error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cameras' },
      { status: 500 }
    );
  }
}

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
    
    // Auto-detect organization if missing
    let orgId = body.organization_id;
    if (!orgId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('created_by', session.user.id)
          .maybeSingle();
        orgId = org?.id;
      }
    }

    if (orgId) {
      await supabase.rpc('set_app_org_id', { org_id: orgId });
    }

    const { data, error } = await supabase
      .from('cameras')
      .insert({
        organization_id: orgId,
        camera_id: body.camera_id,
        name: body.name,
        rtsp_url: body.rtsp_url,
        camera_type: body.camera_type || 'hikvision',
        zone: body.zone || 'gym',
        status: body.status || 'online'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/cameras error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create camera' },
      { status: 500 }
    );
  }
}
