import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('http://localhost:8000/health', {
      cache: 'no-store',
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ status: 'offline', active_streams: 0 }, { status: 502 })
  }
}
