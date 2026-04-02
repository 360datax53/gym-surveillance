import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function runAggregate(request: NextRequest) {
  // Verify CRON_SECRET — Vercel sends it as Authorization: Bearer <secret>
  const authHeader = request.headers.get('authorization')
  const providedSecret =
    authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : request.headers.get('x-cron-secret')

  if (!process.env.CRON_SECRET || providedSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const now = new Date()
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)

  // Round down to nearest 10-minute interval for the time_bucket
  const timeBucket = new Date(now)
  timeBucket.setMinutes(Math.floor(timeBucket.getMinutes() / 10) * 10)
  timeBucket.setSeconds(0)
  timeBucket.setMilliseconds(0)

  // Fetch entries recorded in the last 10 minutes
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('organization_id, camera_id')
    .gte('entry_time', tenMinutesAgo.toISOString())
    .lte('entry_time', now.toISOString())

  if (entriesError) {
    console.error('[heatmap-aggregate] entries fetch error:', entriesError)
    return NextResponse.json({ error: entriesError.message }, { status: 500 })
  }

  if (!entries || entries.length === 0) {
    return NextResponse.json({ success: true, aggregated_rows: 0 })
  }

  // Resolve zone for each camera from the cameras table
  const cameraIds = [...new Set(entries.map(e => e.camera_id).filter(Boolean))]
  const { data: cameras } = await supabase
    .from('cameras')
    .select('id, zone')
    .in('id', cameraIds)

  const cameraZoneMap: Record<string, string> = {}
  cameras?.forEach(c => {
    cameraZoneMap[c.id] = c.zone || 'full_frame'
  })

  // Aggregate: person_count and peak_count per org + camera + zone
  const agg: Record<string, {
    organization_id: string
    camera_id: string
    zone: string
    person_count: number
    peak_count: number
  }> = {}

  for (const entry of entries) {
    if (!entry.camera_id || !entry.organization_id) continue
    const zone = cameraZoneMap[entry.camera_id] || 'full_frame'
    const key = `${entry.organization_id}::${entry.camera_id}::${zone}`

    if (!agg[key]) {
      agg[key] = {
        organization_id: entry.organization_id,
        camera_id: entry.camera_id,
        zone,
        person_count: 0,
        peak_count: 0,
      }
    }

    agg[key].person_count += 1
    agg[key].peak_count = Math.max(agg[key].peak_count, 1)
  }

  const rows = Object.values(agg).map(a => ({
    organization_id: a.organization_id,
    camera_id: a.camera_id,
    zone: a.zone,
    time_bucket: timeBucket.toISOString(),
    person_count: a.person_count,
    peak_count: a.peak_count,
    avg_confidence: 0,
  }))

  const { error: insertError } = await supabase.from('heatmap_data').insert(rows)

  if (insertError) {
    console.error('[heatmap-aggregate] insert error:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, aggregated_rows: rows.length })
}

// Vercel cron jobs issue GET requests — both methods are supported
export async function GET(request: NextRequest) {
  return runAggregate(request)
}

export async function POST(request: NextRequest) {
  return runAggregate(request)
}
