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
    
    const { data, error } = await supabase
      .from('members')
      .select('*')

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
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', session.user.id)
      .single();
    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const { name, email, phone, card_id, membership_type = 'annual', membership_start } = body;
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('organization_id', org.id)
      .eq('email', email)
      .single();
    if (existing) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }
    const start = new Date(membership_start || new Date());
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
        organization_id: org.id,
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
