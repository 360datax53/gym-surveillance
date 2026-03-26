import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save directly to the public directory
    const filepath = path.join(process.cwd(), 'public', 'floorplan-custom.png')
    await writeFile(filepath, buffer)

    return NextResponse.json({ success: true, path: '/floorplan-custom.png' })
  } catch (e) {
    console.error('Map upload error:', e)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
