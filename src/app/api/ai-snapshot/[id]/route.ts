import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cameraId = params.id
  try {
    const response = await fetch(`http://localhost:8000/api/snapshot/${cameraId}`, {
      cache: 'no-store',
    })
    if (!response.ok || response.status === 204) {
      return new NextResponse(null, { status: response.status })
    }
    const buffer = await response.arrayBuffer()
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache, no-store',
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
