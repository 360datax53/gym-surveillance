import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId') || '4f5a3104-f5ea-44e5-88be-0ebe205b0a37'

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const since30min = new Date(Date.now() - 30 * 60 * 1000).toISOString()

    // 1. Fetch ALL known zones for this org from cameras table (source of truth)
    const { data: cameras } = await supabase
      .from('cameras')
      .select('zone')
      .eq('organization_id', orgId)
      .eq('status', 'online')

    // 2. Recognized people from entries table — join camera to get zone
    const { data: entries } = await supabase
      .from('entries')
      .select('camera_id, cameras(zone)')
      .eq('organization_id', orgId)
      .gte('entry_time', since30min)

    // 3. Unrecognized people from alerts table
    const { data: alerts } = await supabase
      .from('alerts')
      .select('camera_id, metadata, cameras(zone)')
      .eq('organization_id', orgId)
      .eq('alert_type', 'unrecognised_entry')
      .gte('created_at', since30min)

    // 4. Fetch zone colors from camera_zones
    const { data: cameraZones } = await supabase
      .from('camera_zones')
      .select('zone_name, color')
      .eq('organization_id', orgId)
      .eq('is_active', true)

    const zoneColors: Record<string, string> = {}
    for (const cz of cameraZones || []) {
      zoneColors[cz.zone_name] = cz.color
    }

    // 5. Aggregate recognized per zone
    const recognized: Record<string, number> = {}
    for (const entry of entries || []) {
      const zone = (entry.cameras as any)?.zone || 'unknown'
      recognized[zone] = (recognized[zone] || 0) + 1
    }

    // 6. Aggregate unrecognized per zone
    const unrecognized: Record<string, number> = {}
    for (const alert of alerts || []) {
      const zone =
        alert.metadata?.zone_name ||
        (alert.cameras as any)?.zone ||
        'unknown'
      unrecognized[zone] = (unrecognized[zone] || 0) + 1
    }

    // 7. Build full zone list — ALL known zones, defaulting to 0 if no activity
    const allZones = new Set([
      ...(cameras || []).map(c => c.zone).filter(Boolean),
      ...Object.keys(recognized),
      ...Object.keys(unrecognized),
    ])

    const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    let colorIdx = 0

    const zones = Array.from(allZones).map(zone => ({
      zone,
      person_count: (recognized[zone] || 0) + (unrecognized[zone] || 0),
      recognized: recognized[zone] || 0,
      unrecognized: unrecognized[zone] || 0,
      color: zoneColors[zone] || defaultColors[colorIdx++ % defaultColors.length],
    })).sort((a, b) => b.person_count - a.person_count)

    return NextResponse.json({ zones, updated_at: new Date().toISOString() })
  } catch (error: any) {
    console.error('GET /api/analytics/occupancy error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
