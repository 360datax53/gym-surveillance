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
      // Try fetching by created_by first, fallback to any organization if none found
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', session.user.id)
        .limit(1)
        .maybeSingle();
      
      orgId = org?.id;
    }
    
    // 3. Fetch detections (using the table name provided by user)
    let query = supabase.from('detections').select('*');
    
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }

    const { data, error } = await query
      .order('detection_time', { ascending: false });

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
