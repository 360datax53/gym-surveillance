import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase'

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
    
    // 1. Fetch the user's authorized organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', session?.user.id);
    
    const orgIds = userOrgs?.map(uo => uo.organization_id) || [];

    // 2. Fetch members filtered by authorized gyms
    let query = supabase.from('members').select('*');
    
    if (orgIds.length > 0) {
      query = query.in('organization_id', orgIds);
    } else if (session) {
      // If logged in but no orgs assigned, show nothing
      query = query.eq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { data, error } = await query
      .order('registered_at', { ascending: false });

    if (error) throw error
 
    return NextResponse.json({ members: data })
  } catch (error: any) {
    console.error('GET /api/members error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch members' },
      { status: 500 }
    )
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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch the user's authorized organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', session.user.id);
    
    const authorizedOrgIds = userOrgs?.map(uo => uo.organization_id) || [];

    const body = await request.json();
    const { name, email, phone, card_id, organization_id, membership_type = 'annual' } = body;

    // 2. Determine and validate organization_id
    let targetOrgId = organization_id;
    if (!targetOrgId) {
      targetOrgId = authorizedOrgIds[0];
    } else if (!authorizedOrgIds.includes(targetOrgId)) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this gym.' },
        { status: 403 }
      );
    }

    if (!targetOrgId) {
      return NextResponse.json(
        { error: 'No authorized gym found for this user.' },
        { status: 400 }
      );
    }

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 3. Check for existing member in this specific gym
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('organization_id', targetOrgId)
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Member with this email already exists in this gym.' },
        { status: 400 }
      );
    }

    const start = new Date();
    const end = new Date(start);
    
    if (membership_type === 'monthly') {
      end.setMonth(end.getMonth() + 1);
    } else if (membership_type === 'quarterly') {
      end.setMonth(end.getMonth() + 3);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }

    const { data: member, error } = await supabase
      .from('members')
      .insert({
        organization_id: targetOrgId,
        name,
        email,
        phone,
        card_id,
        membership_status: 'active',
        membership_start: start.toISOString(),
        membership_end: end.toISOString(),
      })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('POST /api/members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
