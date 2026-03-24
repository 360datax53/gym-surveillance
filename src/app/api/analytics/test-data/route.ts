import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    console.log('API Auth User ID:', user?.id)
    
    const org_id = '4f5a3104-f5ea-44e5-88be-0ebe205b0a37'
    console.log('Target Org ID:', org_id)

    // Generate test heatmap data for today
    const today = new Date()
    const baseTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 0, 0)

    const zones = ['entrance', 'gym_floor', 'locker_room', 'weights']
    const testData = []

    for (let hour = 6; hour < 22; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const time = new Date(baseTime.getTime() + hour * 3600000 + min * 60000)
        
        zones.forEach((zone) => {
          // Peak at 6:30 PM (18:30)
          let peakMultiplier = 1
          if (hour === 18 && min === 30) peakMultiplier = 3
          if (hour >= 17 && hour <= 19) peakMultiplier = 2

          const baseCount = Math.floor(Math.random() * 5 + 2)
          const count = Math.floor(baseCount * peakMultiplier)

          testData.push({
            organization_id: org_id,
            zone,
            time_bucket: time.toISOString(),
            person_count: count,
            camera_id: `cam-00${zones.indexOf(zone) + 1}`
          })
        })
      }
    }

    // Insert test data (upsert to handle re-runs)
    const { error } = await supabase
      .from('heatmap_data')
      .upsert(testData, { onConflict: 'organization_id,zone,time_bucket' })

    if (error) throw error

    // Also insert test person tracks
    const { data: members } = await supabase
      .from('members')
      .select('id')
      .limit(3)

    if (members) {
      const trackData: any[] = []
      members.forEach((member, idx) => {
        trackData.push(
          {
            organization_id: org_id,
            member_id: member.id,
            camera_id: 'cam-001',
            zone: 'entrance',
            entered_at: new Date(baseTime.getTime() + 18 * 3600000).toISOString(),
            exited_at: new Date(baseTime.getTime() + 18.1 * 3600000).toISOString(),
            duration_seconds: 360
          },
          {
            organization_id: org_id,
            member_id: member.id,
            camera_id: 'cam-002',
            zone: 'gym_floor',
            entered_at: new Date(baseTime.getTime() + 18.15 * 3600000).toISOString(),
            exited_at: new Date(baseTime.getTime() + 18.5 * 3600000).toISOString(),
            duration_seconds: 2100
          },
          {
            organization_id: org_id,
            member_id: member.id,
            camera_id: 'cam-003',
            zone: 'locker_room',
            entered_at: new Date(baseTime.getTime() + 18.55 * 3600000).toISOString(),
            exited_at: new Date(baseTime.getTime() + 19.2 * 3600000).toISOString(),
            duration_seconds: 1560
          }
        )
      })

      await supabase.from('person_tracks').insert(trackData)
    }

    return NextResponse.json({
      success: true,
      message: 'Test data generated',
      records_created: testData.length
    })
  } catch (error: any) {
    console.error('Test data error:', error)
    return NextResponse.json({ error: 'Failed to generate test data', message: error.message }, { status: 500 })
  }
}
