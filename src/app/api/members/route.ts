import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', session.user.id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, phone, card_id, membership_type = 'annual', membership_start } = body;

    // Validation
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone' },
        { status: 400 }
      );
    }

    // Check duplicate email
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

    // Calculate membership end date
    const start = new Date(membership_start || new Date());
    const end = new Date(start);
    
    if (membership_type === 'monthly') {
      end.setMonth(end.getMonth() + 1);
    } else if (membership_type === 'quarterly') {
      end.setMonth(end.getMonth() + 3);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }

    // Insert member
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
