import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET /api/cameras/[id]/zones — list all zones for a camera
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('camera_zones')
      .select('*')
      .eq('camera_id', params.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ zones: data || [] })
  } catch (error: any) {
    console.error('GET zones error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/cameras/[id]/zones — create a new zone
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { zone_name, polygon_coords, color, organization_id } = body

    if (!zone_name || !polygon_coords || !organization_id) {
      return NextResponse.json(
        { error: 'Missing required fields: zone_name, polygon_coords, organization_id' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('camera_zones')
      .insert({
        camera_id: params.id,
        organization_id,
        zone_name,
        polygon_coords,
        color: color || '#3b82f6',
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('POST zones error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
