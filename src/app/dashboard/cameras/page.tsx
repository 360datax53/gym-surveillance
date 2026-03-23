'use client'

import { useEffect, useState } from 'react'
import CameraFeed from '@/components/CameraFeed'

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
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
      
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Cameras & Hardware</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Monitor and manage your surveillance network in real-time.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {/* ... stats cards ... */}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {cameras.map((camera) => (
          <div key={camera.id} style={{
            backgroundColor: 'var(--color-background-primary)',
            border: '1px solid var(--color-border-secondary)',
            borderRadius: 'var(--border-radius-lg)',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            transition: 'transform 0.2s ease-in-out',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Camera Preview / Placeholder */}
            <div style={{
              width: '100%',
              height: '180px',
              backgroundColor: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              backgroundImage: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)',
              borderBottom: '1px solid var(--color-border-tertiary)'
            }}>
            <CameraFeed camera={camera} />
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {camera.name}
                  </h3>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'var(--color-background-secondary)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--border-radius-md)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em'
                  }}>
                    {camera.zone ? camera.zone : 'GENERAL ZONE'}
                  </span>
                </div>
                <span style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '10px',
                  fontWeight: 800,
                  backgroundColor: camera.status === 'online' ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 82, 82, 0.1)',
                  color: camera.status === 'online' ? '#00c853' : '#ff5252',
                  border: camera.status === 'online' ? '1px solid rgba(0, 200, 83, 0.2)' : '1px solid rgba(255, 82, 82, 0.2)',
                  letterSpacing: '0.05em'
                }}>
                  {camera.status === 'online' ? '● ONLINE' : '● OFFLINE'}
                </span>
              </div>

              <div style={{ 
                display: 'grid', 
                gap: '0.6rem', 
                padding: '1rem 0', 
                borderTop: '1px solid var(--color-border-tertiary)',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Device ID</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{camera.camera_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Model</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500, textTransform: 'capitalize' }}>{camera.camera_type}</span>
                </div>
              </div>

              {camera.status === 'online' && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border-tertiary)' }}>
                  <h4 style={{ 
                    margin: '0 0 1rem', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    color: 'var(--color-text-tertiary)',
                    letterSpacing: '0.05em'
                  }}>
                    Hardware Health
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ backgroundColor: 'var(--color-background-secondary)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)' }}>
                      <p style={{ margin: 0, fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>CONNECTION</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '13px', fontWeight: 700, color: '#00c853' }}>✓ Stable</p>
                    </div>
                    <div style={{ backgroundColor: 'var(--color-background-secondary)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)' }}>
                      <p style={{ margin: 0, fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>UPTIME</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>99.8%</p>
                    </div>
                    <div style={{ backgroundColor: 'var(--color-background-secondary)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)' }}>
                      <p style={{ margin: 0, fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>CPU LOAD</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>42%</p>
                    </div>
                    <div style={{ backgroundColor: 'var(--color-background-secondary)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)' }}>
                      <p style={{ margin: 0, fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>STORAGE</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>256GB</p>
                    </div>
                  </div>
                </div>
              )}

              {camera.status === 'online' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--color-text-info)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    📺 Live View
                  </button>
                  <a 
                    href="http://192.168.1.1:8081"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'var(--color-background-secondary)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border-secondary)',
                      borderRadius: 'var(--border-radius-md)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    🖥️ NVR Panel
                  </a>
                </div>
              ) : (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                  borderRadius: 'var(--border-radius-md)',
                  color: '#856404'
                }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⚠️ CAMERA OFFLINE
                  </p>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '11px', opacity: 0.9, lineHeight: '1.4' }}>
                    Connection lost. Please check power supply and local network connectivity.
                  </p>
                </div>
              )}
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
