import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch user's organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', session.user.id);
    
    const orgIds = userOrgs?.map(uo => uo.organization_id) || [];
    
    if (orgIds.length === 0) {
      return NextResponse.json({ error: 'No organizations found' }, { status: 404 });
    }

    // 2. Clear floor_x and floor_y for all cameras in these organizations
    const { error } = await supabase
      .from('cameras')
      .update({ floor_x: null, floor_y: null })
      .in('organization_id', orgIds);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'All camera positions have been reset.' });
  } catch (error: any) {
    console.error('POST /api/cameras/reset-positions error:', error);
    return NextResponse.json({ error: error.message || 'Failed to reset positions' }, { status: 500 });
  }
}
