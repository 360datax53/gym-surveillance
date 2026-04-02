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

// PUT /api/cameras/[id]/zones/[zoneId] — update a zone
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; zoneId: string } }
) {
  try {
    const body = await request.json()
    const { zone_name, polygon_coords, color } = body

    const updates: Record<string, any> = {}
    if (zone_name !== undefined) updates.zone_name = zone_name
    if (polygon_coords !== undefined) updates.polygon_coords = polygon_coords
    if (color !== undefined) updates.color = color

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('camera_zones')
      .update(updates)
      .eq('id', params.zoneId)
      .eq('camera_id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('PUT zone error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/cameras/[id]/zones/[zoneId] — soft delete (set is_active=false)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; zoneId: string } }
) {
  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('camera_zones')
      .update({ is_active: false })
      .eq('id', params.zoneId)
      .eq('camera_id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE zone error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
