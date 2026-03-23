import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Behavioral Alerts Management API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organization_id = searchParams.get('org') || '4f5a3104-f5ea-44e5-88be-0ebe205b0a37'
    const severity = searchParams.get('severity')
    const resolved = searchParams.get('resolved')

    const supabase = createClient()

    let query = supabase
      .from('behavioral_alerts')
      .select('*, members(name, email, membership_status)')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false })

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (resolved !== undefined) {
      query = query.eq('resolved', resolved === 'true')
    }

    const { data: alerts, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Behavioral alerts retrieval error:', error)
    return NextResponse.json({ error: 'Failed to access security alerts' }, { status: 500 })
  }
}

/**
 * Incident Resolution API
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { alert_id, resolved, notes } = body

    const supabase = createClient()

    const { data, error } = await supabase
      .from('behavioral_alerts')
      .update({ 
        resolved,
        description: notes ? `RESOLUTION: ${notes}` : undefined 
      })
      .eq('id', alert_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      alert: data,
      status: resolved ? 'RESOLVED' : 'PENDING'
    })
  } catch (error: any) {
    console.error('Alert resolution error:', error)
    return NextResponse.json({ error: 'Failed to synchronize alert status' }, { status: 500 })
  }
}
