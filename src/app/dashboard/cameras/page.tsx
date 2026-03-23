'use client'

import { useEffect, useState } from 'react'

interface Camera {
  id: string
  camera_id: string
  name: string
  rtsp_url?: string
  camera_type: string
  zone: string
  status: 'online' | 'offline'
  latitude?: number
  longitude?: number
  created_at: string
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCameras = async () => {
    try {
      const response = await fetch('/api/cameras')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch cameras')
      }
      const data = await response.json()
      setCameras(data.cameras || [])
    } catch (err: any) {
      console.error('Error fetching cameras:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCameras()
  }, [])

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading cameras...</div>
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-danger)', textAlign: 'center' }}>
        <h2>Error Loading Cameras</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            marginTop: '1rem', 
            padding: '0.6rem 1.2rem',
            cursor: 'pointer',
            backgroundColor: 'var(--color-background-primary)',
            border: '1px solid var(--color-border-primary)',
            borderRadius: 'var(--border-radius-md)',
            color: 'var(--color-text-primary)'
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  const onlineCount = cameras.filter(c => c.status === 'online').length
  const offlineCount = cameras.filter(c => c.status === 'offline').length

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Cameras & Hardware</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Monitor and manage your surveillance network in real-time.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{
          backgroundColor: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-secondary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <p style={{ margin: '0 0 0.75rem', fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Total Cameras</p>
          <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{cameras.length}</h2>
        </div>
        <div style={{
          backgroundColor: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-secondary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <p style={{ margin: '0 0 0.75rem', fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Online</p>
          <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700, color: '#00c853' }}>{onlineCount}</h2>
        </div>
        <div style={{
          backgroundColor: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-secondary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <p style={{ margin: '0 0 0.75rem', fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Offline</p>
          <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700, color: '#ff5252' }}>{offlineCount}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {cameras.map((camera) => (
          <div key={camera.id} style={{
            backgroundColor: 'var(--color-background-primary)',
            border: '1px solid var(--color-border-secondary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1.75rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            transition: 'transform 0.2s ease-in-out',
            cursor: 'default'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  📹 {camera.name}
                </h3>
                <span style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-background-secondary)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--border-radius-md)',
                  fontWeight: 500
                }}>
                  {camera.zone ? camera.zone.toUpperCase() : 'GENERAL ZONE'}
                </span>
              </div>
              <span style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: camera.status === 'online' ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 82, 82, 0.1)',
                color: camera.status === 'online' ? '#00c853' : '#ff5252',
                border: camera.status === 'online' ? '1px solid rgba(0, 200, 83, 0.2)' : '1px solid rgba(255, 82, 82, 0.2)'
              }}>
                {camera.status === 'online' ? '● ONLINE' : '● OFFLINE'}
              </span>
            </div>

            <div style={{ 
              display: 'grid', 
              gap: '0.75rem', 
              paddingTop: '1.25rem', 
              borderTop: '1px solid var(--color-border-tertiary)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-tertiary)' }}>Device ID</span>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{camera.camera_id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-tertiary)' }}>Model Type</span>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500, textTransform: 'capitalize' }}>{camera.camera_type}</span>
              </div>
              {camera.rtsp_url && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Stream URL</p>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '11px', 
                    color: 'var(--color-text-info)', 
                    wordBreak: 'break-all',
                    backgroundColor: 'rgba(0, 120, 212, 0.05)',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}>
                    {camera.rtsp_url}
                  </p>
                </div>
              )}
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: 'var(--color-text-tertiary)' }}>Geolocation</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {camera.latitude ? `${camera.latitude.toFixed(4)}, ${camera.longitude?.toFixed(4)}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cameras.length === 0 && (
        <div style={{ 
          padding: '5rem', 
          textAlign: 'center', 
          backgroundColor: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px dashed var(--color-border-secondary)'
        }}>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '1.1rem' }}>No cameras found in your network.</p>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Add your first device via the API or Hardware integration.</p>
        </div>
      )}
    </div>
  )
}
