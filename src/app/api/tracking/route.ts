import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organization_id,
      member_id,
      camera_id,
      zone,
      entered_at
    } = body

    const supabase = createClient()

    // 1. Check if person already tracked in another zone (close previous track)
    const { data: existingTrack } = await supabase
      .from('person_tracks')
      .select('*')
      .eq('member_id', member_id)
      .eq('organization_id', organization_id)
      .is('exited_at', null)
      .single()

    if (existingTrack) {
      const exitTime = new Date()
      const duration = Math.floor(
        (exitTime.getTime() - new Date(existingTrack.entered_at).getTime()) / 1000
      )

      await supabase
        .from('person_tracks')
        .update({
          exited_at: exitTime.toISOString(),
          duration_seconds: duration
        })
        .eq('id', existingTrack.id)

      // 2. Anomaly Detection: Check for behavioral alerts
      await checkBehavioralPatterns(
        supabase,
        organization_id,
        member_id,
        existingTrack.zone,
        duration
      )
    }

    // 3. Create new track entry for current zone
    const { data: newTrack, error } = await supabase
      .from('person_tracks')
      .insert({
        organization_id,
        member_id,
        camera_id,
        zone,
        entered_at: entered_at || new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // 4. Update spatial heatmap aggregation
    await updateHeatmap(supabase, organization_id, zone, camera_id)

    return NextResponse.json({
      success: true,
      track_id: newTrack.id,
      zone,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Tracking system error:', error)
    return NextResponse.json({ error: 'Tracking synchronization failed' }, { status: 500 })
  }
}

/**
 * Anomaly Detection Engine
 */
async function checkBehavioralPatterns(
  supabase: any,
  organization_id: string,
  member_id: string,
  zone: string,
  duration_seconds: number
) {
  // Pattern A: LOITERING DETECTION
  // Trigger if subject remains in a non-active zone for > 20 minutes
  if (duration_seconds > 1200) {
    await supabase.from('behavioral_alerts').insert({
      organization_id,
      member_id,
      pattern_type: 'loitering',
      severity: 'medium',
      location: zone,
      description: `SECURITY: Subject loitering in ${zone} for ${Math.floor(duration_seconds / 60)} minutes. Potential surveillance or unauthorized rest.`,
      duration_seconds
    })
  }

  // Pattern B: UNUSUAL FREQUENCY (Locker Room Theft Prevention)
  if (zone === 'locker_room') {
    const { data: lockerVisits } = await supabase
      .from('person_tracks')
      .select('id')
      .eq('member_id', member_id)
      .eq('organization_id', organization_id)
      .eq('zone', 'locker_room')

    if (lockerVisits && lockerVisits.length > 3) {
      await supabase.from('behavioral_alerts').insert({
        organization_id,
        member_id,
        pattern_type: 'theft_attempt',
        severity: 'high',
        location: zone,
        description: `CRITICAL: Extremely high frequency of locker room access (${lockerVisits.length} visits). Suspicious behavior indicative of theft attempt.`,
        duration_seconds
      })
    }
  }
}

/**
 * Spatial Aggregation Engine
 */
async function updateHeatmap(
  supabase: any,
  organization_id: string,
  zone: string,
  camera_id: string
) {
  const now = new Date()
  // Round to nearest 15-minute bucket for consistent aggregation
  const time_bucket = new Date(
    Math.floor(now.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000)
  )

  const { data: existing } = await supabase
    .from('heatmap_data')
    .select('id, person_count')
    .eq('organization_id', organization_id)
    .eq('zone', zone)
    .eq('time_bucket', time_bucket.toISOString())
    .maybeSingle()

  if (existing) {
    await supabase
      .from('heatmap_data')
      .update({ person_count: (existing.person_count || 0) + 1 })
      .eq('id', existing.id)
  } else {
    await supabase.from('heatmap_data').insert({
      organization_id,
      zone,
      time_bucket: time_bucket.toISOString(),
      person_count: 1,
      camera_id
    })
  }
}

/**
 * Audit Trail Fetcher
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const member_id = searchParams.get('member_id')
    const organization_id = searchParams.get('org') || '4f5a3104-f5ea-44e5-88be-0ebe205b0a37'

    const supabase = createClient()

    const { data: tracks, error } = await supabase
      .from('person_tracks')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('member_id', member_id)
      .order('entered_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({
      success: true,
      tracks
    })
  } catch (error) {
    console.error('Tracking retrieval error:', error)
    return NextResponse.json({ error: 'Audit trail lookup failed' }, { status: 500 })
  }
}
