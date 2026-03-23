import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image_base64, member_id } = body

    if (!image_base64 || !member_id) {
      return NextResponse.json({ error: 'Missing image_base64 or member_id' }, { status: 400 })
    }

    // Call AI service to extract face encoding
    // Note: We use a full-frame detection for initial enrollment if coordinates aren't provided
    const aiResponse = await fetch('http://localhost:5005/api/extract-encoding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: image_base64,
        detection: { x: 0, y: 0, width: 2000, height: 2000 } // Large box to cover the face in enrollment photo
      })
    })

    const result = await aiResponse.json()
    
    if (!result.success || !result.encoding) {
      throw new Error(result.error || 'Face extraction failed')
    }

    // Store encoding in database (stored as stringified JSON or text)
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('members')
      .update({ face_encoding: JSON.stringify(result.encoding) })
      .eq('id', member_id)

    if (updateError) throw updateError

    return NextResponse.json({ 
      success: true, 
      encoding_extracted: true,
      message: 'Face signature generated and stored successfully'
    })
  } catch (error: any) {
    console.error('Extract face error:', error)
    return NextResponse.json({ error: error.message || 'Failed to extract face' }, { status: 500 })
  }
}
