'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CameraFeed from '@/components/CameraFeed'
import { useAiHost } from '@/hooks/useAiHost'

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
  enable_face_recognition?: boolean
  organization_id: string
  is_processing?: boolean
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settingsOpenId, setSettingsOpenId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({ name: '', zone: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { aiHost } = useAiHost()
  const [processingStatus, setProcessingStatus] = useState<{[key: string]: boolean}>({})
  const router = useRouter()

  const fetchCameras = async () => {
    try {
      const response = await fetch('/api/cameras')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch cameras')
      }
      const data = await response.json()
      // Sort and set cameras - ensure no accidental filtering here
      const sortedCameras = (data.cameras || []).sort((a: any, b: any) => 
        (a.camera_id || '').localeCompare(b.camera_id || '')
      )
      setCameras(sortedCameras)
    } catch (err: any) {
      console.error('Error fetching cameras:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleProcessing = async (camera: Camera) => {
    const isProcessing = processingStatus[camera.id]
    const aiServiceUrl = `http://${aiHost}:5005`;
    const endpoint = isProcessing ? `${aiServiceUrl}/api/stop-rtsp` : `${aiServiceUrl}/api/process-rtsp`
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_id: camera.id,
          rtsp_url: camera.rtsp_url
        })
      })

      if (!response.ok) throw new Error('Failed to toggle processing')
      
      setProcessingStatus(prev => ({
        ...prev,
        [camera.id]: !isProcessing
      }))
    } catch (err) {
      console.error('Error toggling processing:', err)
      alert('AI Service Error: Ensure the background AI service is running on port 5005.')
    }
  }

  const handleToggleFaceRecognition = async (cameraId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/cameras/${cameraId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable_face_recognition: enabled })
      })
      
      if (!response.ok) throw new Error('Failed to update')
      
      // Refresh local state to avoid full re-fetch
      setCameras(prev => prev.map(cam => 
        cam.id === cameraId ? { ...cam, enable_face_recognition: enabled } : cam
      ));
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to update face recognition settings.')
    }
  }

  const handleDeleteCamera = async (cameraId: string, cameraName: string) => {
    const confirmation = window.prompt(`To delete camera "${cameraName}", please type its name exactly:`)
    
    if (confirmation !== cameraName) {
      if (confirmation !== null) alert('Names do not match. Deletion cancelled.')
      return
    }

    try {
      const response = await fetch(`/api/cameras/${cameraId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) throw new Error('Failed to delete')
      
      // Update local state
      setCameras(prev => prev.filter(cam => cam.id !== cameraId));
      
      alert('Camera deleted successfully')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete camera')
    }
  }

  const handleOpenSettings = (camera: Camera) => {
    if (settingsOpenId !== camera.id) {
      setEditFormData({ name: camera.name, zone: camera.zone || '' })
      setSettingsOpenId(camera.id)
    } else {
      setSettingsOpenId(null)
    }
  }

  const handleUpdateCamera = async (cameraId: string) => {
    if (!editFormData.name.trim()) return
    setIsSaving(true)
    try {
      const response = await fetch('/api/cameras', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cameraId, name: editFormData.name, zone: editFormData.zone })
      })
      if (!response.ok) throw new Error('Failed to update')
      
      setCameras(prev => prev.map(cam => 
        cam.id === cameraId ? { ...cam, name: editFormData.name, zone: editFormData.zone } : cam
      ))
      setSettingsOpenId(null)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to update camera settings.')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    fetchCameras()
    // Poll AI service health to get active streams
    const checkAIHealth = async () => {
      try {
        const res = await fetch(`http://${aiHost}:5005/health`)
        await res.json()
        // In a real app, we'd sync active_streams with our cameras list
      } catch (e) {}
    }
    const interval = setInterval(checkAIHealth, 5000)
    return () => clearInterval(interval)
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
      
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Cameras & Hardware</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Monitor and manage your surveillance network in real-time.</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/cameras/new')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#da291c',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(218, 41, 28, 0.2)'
          }}
        >
          + Add Camera
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
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
              height: '320px',
              backgroundColor: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              backgroundImage: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)',
              borderBottom: '1px solid var(--color-border-tertiary)'
            }}>
              <CameraFeed camera={camera as any} organizationId={camera.organization_id} />
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {camera.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                    <button 
                      onClick={() => handleOpenSettings(camera)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        borderRadius: '4px',
                        backgroundColor: settingsOpenId === camera.id ? 'var(--color-background-secondary)' : 'transparent',
                        transition: 'all 0.2s ease'
                      }}
                      title="Camera Settings"
                    >
                      ⚙️
                    </button>
                  </div>
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

              {camera.status === 'online' && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border-tertiary)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="checkbox"
                        checked={camera.enable_face_recognition !== false}
                        onChange={(e) => handleToggleFaceRecognition(camera.id, e.target.checked)}
                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                      />
                    </div>
                    <span>🔍 AI Face Recognition: {(camera as any).enable_face_recognition !== false ? 'ACTIVE' : 'DISABLED'}</span>
                  </label>
                </div>
              )}

              {settingsOpenId === camera.id && (
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '1.5rem', 
                  backgroundColor: 'var(--color-background-secondary)', 
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--color-border-tertiary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  {/* Edit Form */}
                  <div>
                    <h4 style={{ margin: '0 0 1rem', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
                      Edit Camera Info
                    </h4>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Camera Name (matches video feed)</label>
                        <input 
                          value={editFormData.name}
                          onChange={e => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border-secondary)', backgroundColor: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Zone Tag</label>
                        <input 
                          value={editFormData.zone}
                          onChange={e => setEditFormData(prev => ({ ...prev, zone: e.target.value }))}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border-secondary)', backgroundColor: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}
                        />
                      </div>
                      <button
                        onClick={() => handleUpdateCamera(camera.id)}
                        disabled={isSaving}
                        style={{
                          width: '100%',
                          padding: '0.6rem',
                          backgroundColor: '#da291c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: isSaving ? 'wait' : 'pointer',
                          marginTop: '0.5rem'
                        }}
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-tertiary)', margin: '0.5rem 0' }} />

                  {/* Danger Zone */}
                  <div>
                    <p style={{ margin: '0 0 1rem', fontSize: '11px', fontWeight: 800, color: '#ff5252', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ⚠️ Danger Zone
                    </p>
                  <button
                    onClick={() => handleDeleteCamera(camera.id, camera.name)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#ff5252',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--border-radius-md)',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(255, 82, 82, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    🗑️ Permanently Delete Camera
                  </button>
                  <p style={{ margin: '0.75rem 0 0', fontSize: '10px', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
                    This action requires typing the camera name to confirm.
                  </p>
                 </div>
                </div>
              )}

              {camera.status === 'online' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button 
                    onClick={() => toggleProcessing(camera)}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: processingStatus[camera.id] ? '#ff5252' : '#00c853',
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
                    {processingStatus[camera.id] ? '⏹️ Stop AI' : '▶️ Start AI'}
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
