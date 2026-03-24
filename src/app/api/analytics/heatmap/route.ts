import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organization_id = searchParams.get('org') || '4f5a3104-f5ea-44e5-88be-0ebe205b0a37'
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const supabase = createClient()

    // 1. Fetch temporal heatmap buckets for the specific day
    const { data: heatmapData, error } = await supabase
      .from('heatmap_data')
      .select('*')
      .eq('organization_id', organization_id)
      .gte('time_bucket', `${date}T00:00:00`)
      .lte('time_bucket', `${date}T23:59:59`)
      .order('time_bucket', { ascending: true })

    if (error) throw error

    // 2. Perform business intelligence aggregation
    const zoneStats: Record<string, any> = {}
    const timelineData: any[] = []

    heatmapData?.forEach((item) => {
      // Aggregating by zone
      if (!zoneStats[item.zone]) {
        zoneStats[item.zone] = { total: 0, peak: 0, average: 0, count: 0 }
      }
      zoneStats[item.zone].total += item.person_count
      zoneStats[item.zone].peak = Math.max(zoneStats[item.zone].peak, item.person_count)
      zoneStats[item.zone].count += 1

      // Flattened timeline data for charting
      timelineData.push({
        time: item.time_bucket,
        zone: item.zone,
        people: item.person_count
      })
    })

    // 3. Finalize analytics metrics
    Object.keys(zoneStats).forEach((zone) => {
      zoneStats[zone].average = Math.round(
        zoneStats[zone].total / zoneStats[zone].count
      )
    })

    return NextResponse.json({
      success: true,
      date,
      zoneStats,
      timeline: timelineData,
      totalVisitors: Object.values(zoneStats).reduce(
        (sum: number, zone: any) => sum + zone.total,
        0
      )
    })
  } catch (error: any) {
    console.error('Heatmap analysis error:', error)
    return NextResponse.json({ error: 'Heatmap data aggregation failed' }, { status: 500 })
  }
}
