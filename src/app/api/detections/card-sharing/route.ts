import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { card_id, detected_member_id, actual_member_id, camera_id, organization_id } = body

    if (!detected_member_id || !actual_member_id || !organization_id) {
       return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = createClient()

    // Logic: If the face detected DOES NOT match the person who owns the card
    if (detected_member_id !== actual_member_id) {
      // Fetch names for alert context
      const { data: detectedMember } = await supabase
        .from('members')
        .select('name')
        .eq('id', detected_member_id)
        .single()

      const { data: actualMember } = await supabase
        .from('members')
        .select('name')
        .eq('id', actual_member_id)
        .single()

      // Create a high-priority fraud alert
      const { error: alertError } = await supabase.from('detections').insert({
        organization_id,
        camera_id,
        detection_time: new Date().toISOString(),
        person_name: detectedMember?.name || 'Unauthorized Person',
        member_id: detected_member_id,
        confidence: 0.99,
        is_member: true,
        alert_type: 'card_sharing',
        location: 'Access Control Point',
        description: `CRITICAL: Card sharing detected. ${actualMember?.name}'s card (#${card_id}) was used by ${detectedMember?.name || 'an unrecognized person'}.`,
        created_at: new Date().toISOString()
      })

      if (alertError) throw alertError

      return NextResponse.json({
        success: true,
        alert_created: true,
        message: 'Security Alert: Card sharing detected and logged',
        details: {
          real_owner: actualMember?.name,
          impostor: detectedMember?.name
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      alert_created: false,
      message: 'Identity verified. Access matches card ownership.' 
    })
  } catch (error: any) {
    console.error('Card sharing detection error:', error)
    return NextResponse.json({ error: 'Fraud detection pipeline failed' }, { status: 500 })
  }
}
