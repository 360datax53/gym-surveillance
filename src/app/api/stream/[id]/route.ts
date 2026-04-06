import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// Proxy the MJPEG stream from the Python AI service through Next.js
// This bypasses the browser's 6-connection-per-domain limit entirely
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cameraId = params.id
  const aiServiceUrl = `http://localhost:8000/api/stream/${cameraId}`

  try {
    const response = await fetch(aiServiceUrl, {
      // @ts-ignore - Next.js specific
      cache: 'no-store',
    })

    if (!response.ok) {
      return new Response('Stream not available', { status: response.status })
    }

    // Forward the MJPEG stream directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error(`Stream proxy error for ${cameraId}:`, error)
    return new Response('AI service unavailable', { status: 502 })
  }
}
