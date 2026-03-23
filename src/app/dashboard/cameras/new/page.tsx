'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCameraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const payload = {
      camera_id: formData.get('camera_id'),
      name: formData.get('name'),
      rtsp_url: formData.get('rtsp_url'),
      camera_type: formData.get('camera_type'),
      zone: formData.get('zone'),
      status: 'online'
    }

    try {
      const response = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create camera')
      }

      router.push('/dashboard/cameras')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Add New Camera</h1>
        <p style={{ color: '#666' }}>Register a new hardware device in your network.</p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem', backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', border: '1px solid #ddd' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Camera Brand Name</label>
          <input name="name" required placeholder="e.g. Foyer Entrance" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Hardware Serial/ID</label>
          <input name="camera_id" required placeholder="e.g. HIK-9920" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>RTSP Stream URL</label>
          <input name="rtsp_url" placeholder="rtsp://admin:password@192.168.1.10..." style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Zone / Location</label>
          <input name="zone" placeholder="e.g. Main Desk" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Hardware Type</label>
          <select name="camera_type" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="hikvision">Hikvision NVR</option>
            <option value="dahua">Dahua</option>
            <option value="reolink">Reolink</option>
            <option value="generic">Generic IP Camera</option>
          </select>
        </div>

        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '0.75rem', borderRadius: '4px', border: 'none', backgroundColor: '#28a745', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {loading ? 'Adding...' : 'Add Camera'}
          </button>
        </div>
      </form>
    </div>
  )
}
