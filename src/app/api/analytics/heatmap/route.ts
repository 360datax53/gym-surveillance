import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organization_id = searchParams.get('orgId') || searchParams.get('org') || '4f5a3104-f5ea-44e5-88be-0ebe205b0a37'
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const supabase = createClient()

    // 1. Fetch temporal heatmap buckets — supports single-day or multi-day range
    const rangeStart = startDate ? `${startDate}T00:00:00` : `${date}T00:00:00`
    const rangeEnd   = endDate   ? `${endDate}T23:59:59`   : `${date}T23:59:59`

    const { data: heatmapData, error } = await supabase
      .from('heatmap_data')
      .select('*')
      .eq('organization_id', organization_id)
      .gte('time_bucket', rangeStart)
      .lte('time_bucket', rangeEnd)
      .order('time_bucket', { ascending: true })

    if (error) throw error

    // 2. Perform business intelligence aggregation
    const zoneStats: Record<string, any> = {}
    const timelineData: any[] = []

    heatmapData?.forEach((item) => {
      const zone = item.zone || 'unknown'
      // Aggregating by zone
      if (!zoneStats[zone]) {
        zoneStats[zone] = { total: 0, peak: 0, average: 0, count: 0 }
      }
      // total is a proxy for all detected people over time
      zoneStats[zone].total += item.person_count
      zoneStats[zone].peak = Math.max(zoneStats[zone].peak, item.person_count)
      zoneStats[zone].count += 1

      // Flattened timeline data for charting
      timelineData.push({
        time: item.time_bucket,
        zone: zone,
        people: item.person_count
      })
    })

    // 3. Finalize analytics metrics
    Object.keys(zoneStats).forEach((zone) => {
      zoneStats[zone].average = zoneStats[zone].count > 0 
        ? Math.round(zoneStats[zone].total / zoneStats[zone].count)
        : 0
    })

    return NextResponse.json({
      success: true,
      date,
      zoneStats,
      timeline: timelineData,
      totalVisitors: Object.values(zoneStats).reduce(
        (sum: number, zone: any) => sum + (zone.peak || 0), // Use peak as a better proxy for total unique per zone
        0
      )
    })
  } catch (error: any) {
    console.error('Heatmap analysis error:', error)
    return NextResponse.json({ error: 'Heatmap data aggregation failed' }, { status: 500 })
  }
}
