import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use service role key so inserts bypass RLS (this is a server-to-server call from the AI service)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organization_id,
      camera_id,
      person_name,
      member_id,
      is_member,
      alert_type,
      confidence,
      location
    } = body

    const supabase = supabaseAdmin

    // 1. Log the detection record for historical auditing
    const { data: detection, error } = await supabase
      .from('detections')
      .insert({
        organization_id,
        camera_id,
        person_name: person_name || 'Unauthorized Subject',
        member_id: member_id || null,
        is_member: is_member || false,
        alert_type: alert_type || 'unknown_detection',
        confidence: confidence || 0.0,
        location: location || 'Entry Point',
        detection_time: new Date().toISOString(),
        resolved: false,
        description: is_member
          ? `Member ${person_name} verified at ${location}`
          : `SECURITY: Unknown person detected at ${location} - Confidence: ${(confidence * 100).toFixed(1)}%`,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // 2. Write to entries / alerts tables so occupancy analytics can read this data
    if (is_member && member_id) {
      await supabase.from('entries').insert({
        organization_id,
        camera_id,
        member_id,
        entry_time: new Date().toISOString(),
        is_member: true,
        confidence_score: confidence || 0,
      }).then(({ error: e }) => { if (e) console.error('Failed to log entry:', e) })
    } else if (!is_member) {
      await supabase.from('alerts').insert({
        organization_id,
        camera_id,
        alert_type: 'unrecognised_entry',
        confidence: confidence || 0,
        metadata: { zone_name: location || null },
        status: 'active',
        created_at: new Date().toISOString(),
      }).then(({ error: e }) => { if (e) console.error('Failed to log alert:', e) })
    }

    // 3. Broadcast real-time alert event
    // This allows the dashboard to react instantly without polling
    const channel = supabase.channel(`alerts:${organization_id}`)
    
    await channel.send({
      type: 'broadcast',
      event: 'new_detection',
      payload: {
        id: detection.id,
        person_name,
        is_member,
        alert_type,
        confidence,
        location,
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      detection_id: detection.id,
      broadcast: true,
      alert_triggered: !is_member || alert_type === 'card_sharing'
    })
  } catch (error: any) {
    console.error('Auto-alert system error:', error)
    return NextResponse.json({ error: 'Alert propagation failed' }, { status: 500 })
  }
}
