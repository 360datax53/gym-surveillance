import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

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

    const supabase = createClient()

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

    // 2. Broadcast real-time alert event
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
