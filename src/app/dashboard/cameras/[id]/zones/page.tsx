'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ZoneEditor, { CameraZone } from '@/components/ZoneEditor'
import { useOrganization } from '@/context/OrganizationContext'

interface Camera {
  id: string
  name: string
  zone: string
  organization_id: string
  status: string
}

export default function CameraZonesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { selectedOrgId } = useOrganization()
  const [camera, setCamera] = useState<Camera | null>(null)
  const [zones, setZones] = useState<CameraZone[]>([])
  const [loading, setLoading] = useState(true)
  const [snapshotUrl, setSnapshotUrl] = useState<string | undefined>()
  const [snapshotStatus, setSnapshotStatus] = useState<'loading' | 'live' | 'none'>('loading')

  const fetchLiveSnapshot = useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/ai-snapshot/${id}`, { signal: AbortSignal.timeout(3000) })
      if (res.ok && res.status !== 204) {
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        setSnapshotUrl(objectUrl)
        setSnapshotStatus('live')
        return
      }
    } catch {
    }
    setSnapshotStatus('none')
  }, [id])

  // Fetch camera info + zones
  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const [camRes, zonesRes] = await Promise.all([
          fetch(`/api/cameras/${id}`),
          fetch(`/api/cameras/${id}/zones`),
        ])
        if (camRes.ok) setCamera(await camRes.json())
        if (zonesRes.ok) {
          const data = await zonesRes.json()
          setZones(data.zones || [])
        }
      } catch (e) {
        console.error('Failed to load camera/zones:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    fetchLiveSnapshot()
  }, [fetchLiveSnapshot])

  const handleSave = async (zone: Omit<CameraZone, 'id'>) => {
    const orgId = selectedOrgId || camera?.organization_id
    if (!orgId) return
    const res = await fetch(`/api/cameras/${id}/zones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...zone, organization_id: orgId }),
    })
    if (res.ok) {
      const saved = await res.json()
      setZones(prev => [...prev, saved])
    } else {
      alert('Failed to save zone. Please try again.')
    }
  }

  const handleDelete = async (zoneId: string) => {
    const res = await fetch(`/api/cameras/${id}/zones/${zoneId}`, { method: 'DELETE' })
    if (res.ok) {
      setZones(prev => prev.filter(z => z.id !== zoneId))
    } else {
      alert('Failed to delete zone.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/cameras')}
          className="text-gray-400 hover:text-gray-700 text-sm font-bold flex items-center gap-1"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Zone Editor — {camera?.name || 'Camera'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Draw zones on the camera frame to track occupancy by area.
          </p>
        </div>
      </div>

      {/* Snapshot status banner */}
      {snapshotStatus === 'live' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          <span>Live camera frame loaded — draw zones directly on the real footage.</span>
          <button
            onClick={fetchLiveSnapshot}
            className="ml-auto text-xs font-bold underline"
          >
            Refresh frame
          </button>
        </div>
      )}
      {snapshotStatus === 'none' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          <strong>AI service not running</strong> — start it with{' '}
          <code className="bg-amber-100 px-1 rounded">cd ai_service && python app.py</code>{' '}
          then click <strong>▶️ Start AI</strong> on the camera, and come back here to see the live frame.
          You can still draw zones on the dark canvas and they will work correctly.
        </div>
      )}
      {snapshotStatus === 'loading' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-500">
          Loading camera frame…
        </div>
      )}

      {/* How to use */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>How to use:</strong> Select <em>Rectangle</em> to drag a box, or <em>Freehand</em> to draw a custom polygon.
        Name each zone (e.g. "Entrance", "Gym Floor") then click <strong>Save Zone</strong>.
        Zones are image-size independent and work on any screen.
      </div>

      {/* Zone editor */}
      {camera && (
        <ZoneEditor
          cameraId={id}
          organizationId={selectedOrgId || camera.organization_id}
          imageUrl={snapshotUrl}
          existingZones={zones}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {zones.length === 0 && !loading && (
        <div className="text-center py-6 text-gray-400 text-sm">
          No zones saved yet. Draw your first zone above.
        </div>
      )}
    </div>
  )
}
