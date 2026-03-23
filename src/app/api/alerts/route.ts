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
    let orgId = null;
    if (session) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', session.user.id)
        .single();
      orgId = org?.id;
    }
    
    // 3. Fetch alerts
    let query = supabase.from('alerts').select('*');
    
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false }); // Using created_at as a fallback

    if (error) {
      // Provide more helpful context for the common RLS parameter error
      if (error.message.includes('app.current_org_id')) {
        return NextResponse.json({ 
          error: `Database RLS policy error on table "alerts": ${error.message}. Please update your RLS policy as instructed.` 
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
