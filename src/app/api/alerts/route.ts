import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the user's organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', session.user.id)
      .single();

    if (orgError || !org) {
      console.warn('Organization fetch failed for alerts:', orgError);
      // We'll continue anyway, but the query might fail if RLS is strict
    }
    
    // 3. Fetch detections
    let query = supabase.from('detections').select('*');
    
    if (org) {
      query = query.eq('organization_id', org.id);
    }

    const { data, error } = await query
      .order('detection_time', { ascending: false });

    if (error) {
      // Specifically handle the "app.current_org_id" error to provide guidance
      if (error.message.includes('app.current_org_id')) {
        throw new Error(
          'Database RLS policy error: The "detections" table expects "app.current_org_id" to be set in the Postgres session. ' +
          'Please ensure your RLS policy handles missing session variables or use "auth.uid()" for filtering.'
        );
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
