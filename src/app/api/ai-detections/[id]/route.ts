import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Proxy detection data from the Python AI service through Next.js
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cameraId = params.id

  try {
    const response = await fetch(`http://localhost:8000/api/detections/${cameraId}`, {
      cache: 'no-store',
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ detections: [], error: 'AI service unavailable' }, { status: 502 })
  }
}
