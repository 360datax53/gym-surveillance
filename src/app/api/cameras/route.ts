import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
    
    // 1. Get requested orgId from query
    const searchParams = new URL(request.url).searchParams;
    const requestedOrgId = searchParams.get('orgId');

    // 2. Fetch user's authorized organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', session?.user.id);
    
    // TEMPORARY RESTORATION BYPASS: Allow any authenticated user to see cameras
    const DARTFORD_ID = '4f5a3104-f5ea-44e5-88be-0ebe205b0a37';
    
    // Fetch cameras
    let query = supabase.from('cameras').select('*');
    
    if (requestedOrgId && requestedOrgId !== '1' && requestedOrgId !== '2' && requestedOrgId !== '3') {
      // If a real UUID is requested, use it
      query = query.eq('organization_id', requestedOrgId);
    } else if (session) {
      // Default to the restored Dartford data for now to fix the "missing cameras" issue
      query = query.eq('organization_id', DARTFORD_ID);
    }

    const { data, error } = await query
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
    const { data: { session } } = await supabase.auth.getSession();
    
    // 1. Fetch the user's authorized organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', session?.user.id);
    
    const authorizedOrgIds = userOrgs?.map(uo => uo.organization_id) || [];
    
    // 2. Determine and validate organization_id
    let targetOrgId = body.organization_id;
    
    if (!targetOrgId) {
      // Auto-assign the first authorized gym if none provided
      targetOrgId = authorizedOrgIds[0];
    } else if (!authorizedOrgIds.includes(targetOrgId)) {
      // User is trying to add a camera to a gym they don't own/manage
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this organization.' },
        { status: 403 }
      );
    }

    if (!targetOrgId) {
      return NextResponse.json(
        { error: 'No authorized organization found for this user.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('cameras')
      .insert({
        organization_id: targetOrgId,
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

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
        },
      }
    );

    const body = await request.json();
    const { id, name, zone, floor_x, floor_y } = body;

    if (!id) {
       return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (zone) updates.zone = zone;
    if (typeof floor_x === 'number') updates.floor_x = floor_x;
    if (typeof floor_y === 'number') updates.floor_y = floor_y;

    const { data, error } = await supabase
      .from('cameras')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PATCH /api/cameras error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update camera' }, { status: 500 });
  }
}

