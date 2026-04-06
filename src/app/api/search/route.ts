export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all' // all, member, alert
    const organization_id = searchParams.get('org') || '4f5a3104-f5ea-44e5-88be-0ebe205b0a37'

    const supabase = createClient()
    let results: any[] = []

    // 1. Search Members
    if (type === 'all' || type === 'member') {
      const { data: members, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('organization_id', organization_id)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,card_id.ilike.%${query}%`)

      if (memberError) throw memberError

      if (members) {
        results.push(
          ...members.map((m) => ({
            id: m.id,
            type: 'member',
            name: m.name,
            email: m.email,
            card_id: m.card_id,
            membership_status: m.membership_status,
            photo_url: m.photo_url
          }))
        )
      }
    }

    // 2. Search Security Alerts (Detections)
    if (type === 'all' || type === 'alert') {
      const { data: alerts, error: alertError } = await supabase
        .from('detections')
        .select('*')
        .eq('organization_id', organization_id)
        .or(`person_name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
        .order('detection_time', { ascending: false })
        .limit(30)

      if (alertError) throw alertError

      if (alerts) {
        results.push(
          ...alerts.map((a) => ({
            id: a.id,
            type: 'alert',
            person_name: a.person_name,
            alert_type: a.alert_type,
            location: a.location,
            confidence: a.confidence,
            detection_time: a.detection_time,
            resolved: a.resolved,
            description: a.description
          }))
        )
      }
    }

    return NextResponse.json({
      success: true,
      query,
      results,
      count: results.length
    })
  } catch (error: any) {
    console.error('Unified Search Error:', error)
    return NextResponse.json({ error: 'Search failed to respond' }, { status: 500 })
  }
}
