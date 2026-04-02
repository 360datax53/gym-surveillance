'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface Point { x: number; y: number }

export interface CameraZone {
  id?: string
  zone_name: string
  polygon_coords: Point[]
  color: string
}

type DrawMode = 'off' | 'rectangle' | 'freehand'

interface ZoneEditorProps {
  cameraId: string
  organizationId: string
  imageUrl?: string
  existingZones: CameraZone[]
  onSave: (zone: Omit<CameraZone, 'id'>) => Promise<void>
  onDelete: (zoneId: string) => Promise<void>
}

const ZONE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

// Ray-casting point-in-polygon — exported for use in intake route
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function toCanvas(p: Point, w: number, h: number): Point {
  return { x: p.x * w, y: p.y * h }
}

function toNorm(p: Point, w: number, h: number): Point {
  return { x: p.x / w, y: p.y / h }
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default function ZoneEditor({
  existingZones,
  onSave,
  onDelete,
  imageUrl,
}: ZoneEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [drawMode, setDrawMode] = useState<DrawMode>('off')
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [tempEnd, setTempEnd] = useState<Point | null>(null) // for rectangle preview
  const [isDrawing, setIsDrawing] = useState(false)
  const [zoneName, setZoneName] = useState('')
  const [zoneColor, setZoneColor] = useState(ZONE_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Load background image
  useEffect(() => {
    if (!imageUrl) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgRef.current = img
      redraw()
    }
    img.src = imageUrl
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width: W, height: H } = canvas.getBoundingClientRect()
    canvas.width = W
    canvas.height = H
    ctx.clearRect(0, 0, W, H)

    // Background image or gray fill
    if (imgRef.current) {
      ctx.drawImage(imgRef.current, 0, 0, W, H)
    } else {
      ctx.fillStyle = '#1f2937'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#6b7280'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('No snapshot — draw zones on your camera frame', W / 2, H / 2)
    }

    // Draw existing zones
    for (const zone of existingZones) {
      if (zone.polygon_coords.length < 3) continue
      const pts = zone.polygon_coords.map(p => toCanvas(p, W, H))
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      ctx.fillStyle = hexToRgba(zone.color, 0.25)
      ctx.fill()
      ctx.strokeStyle = zone.color
      ctx.lineWidth = 2
      ctx.stroke()
      // Label
      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
      ctx.fillStyle = zone.color
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(zone.zone_name, cx, cy)
    }

    // Draw current polygon being built
    const previewPts = (() => {
      if (drawMode === 'rectangle' && currentPoints.length === 1 && tempEnd) {
        const s = toCanvas(currentPoints[0], W, H)
        const e = toCanvas(tempEnd, W, H)
        return [
          { x: s.x, y: s.y }, { x: e.x, y: s.y },
          { x: e.x, y: e.y }, { x: s.x, y: e.y },
        ]
      }
      return currentPoints.map(p => toCanvas(p, W, H))
    })()

    if (previewPts.length > 0) {
      ctx.beginPath()
      ctx.moveTo(previewPts[0].x, previewPts[0].y)
      previewPts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
      if (drawMode === 'rectangle' && tempEnd) ctx.closePath()
      ctx.strokeStyle = zoneColor
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.stroke()
      ctx.setLineDash([])
      // Dots on each vertex
      previewPts.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = zoneColor
        ctx.fill()
      })
    }
  }, [existingZones, currentPoints, tempEnd, zoneColor, drawMode])

  useEffect(() => { redraw() }, [redraw])

  // Unified pointer event helpers
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const W = rect.width
    const H = rect.height
    return toNorm(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      W, H
    )
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawMode === 'off') return
    e.preventDefault()
    const pt = getCanvasPoint(e)
    if (drawMode === 'rectangle') {
      setCurrentPoints([pt])
      setIsDrawing(true)
    } else {
      setCurrentPoints([pt])
      setIsDrawing(true)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || drawMode === 'off') return
    e.preventDefault()
    const pt = getCanvasPoint(e)
    if (drawMode === 'rectangle') {
      setTempEnd(pt)
    } else {
      setCurrentPoints(prev => [...prev, pt])
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || drawMode === 'off') return
    e.preventDefault()
    const pt = getCanvasPoint(e)
    if (drawMode === 'rectangle' && currentPoints.length === 1) {
      const s = currentPoints[0]
      setCurrentPoints([
        { x: s.x, y: s.y }, { x: pt.x, y: s.y },
        { x: pt.x, y: pt.y }, { x: s.x, y: pt.y },
      ])
      setTempEnd(null)
    }
    setIsDrawing(false)
  }

  const handleUndo = () => {
    if (drawMode === 'freehand') {
      setCurrentPoints(prev => prev.slice(0, -5))
    } else {
      setCurrentPoints([])
    }
    setTempEnd(null)
  }

  const handleClear = () => {
    setCurrentPoints([])
    setTempEnd(null)
    setIsDrawing(false)
  }

  const handleSave = async () => {
    const finalCoords = (() => {
      if (drawMode === 'rectangle' && currentPoints.length === 4) return currentPoints
      if (drawMode === 'freehand' && currentPoints.length >= 3) return currentPoints
      return null
    })()

    if (!finalCoords) {
      alert('Draw a zone first (at least 3 points for freehand, or drag a rectangle).')
      return
    }
    if (!zoneName.trim()) {
      alert('Enter a zone name.')
      return
    }

    setSaving(true)
    try {
      await onSave({ zone_name: zoneName.trim(), polygon_coords: finalCoords, color: zoneColor })
      setCurrentPoints([])
      setZoneName('')
      setDrawMode('off')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this zone?')) return
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Canvas */}
      <div ref={containerRef} className="relative w-full" style={{ aspectRatio: '16/9' }}>
        <canvas
          ref={canvasRef}
          className={`w-full h-full rounded-xl border-2 ${
            drawMode !== 'off' ? 'cursor-crosshair border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 cursor-default'
          }`}
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        {drawMode === 'off' && (
          <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
            Select a draw mode to start
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {/* Draw mode */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Draw Mode</p>
          <div className="flex gap-2">
            {(['off', 'rectangle', 'freehand'] as DrawMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => { setDrawMode(mode); handleClear() }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  drawMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mode === 'off' ? 'Off' : mode === 'rectangle' ? '⬜ Rectangle' : '✏️ Freehand'}
              </button>
            ))}
          </div>
        </div>

        {/* Zone settings row */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Zone Name</label>
            <input
              value={zoneName}
              onChange={e => setZoneName(e.target.value)}
              placeholder="e.g. Entrance, Gym Floor"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Color</label>
            <div className="flex gap-1.5">
              {ZONE_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setZoneColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    zoneColor === c ? 'scale-125 border-gray-900' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleUndo}
            disabled={currentPoints.length === 0}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 disabled:opacity-40"
          >
            ↩ Undo
          </button>
          <button
            onClick={handleClear}
            disabled={currentPoints.length === 0}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 disabled:opacity-40"
          >
            ✕ Clear
          </button>
          <button
            onClick={handleSave}
            disabled={saving || currentPoints.length < 3}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-40 ml-auto"
          >
            {saving ? 'Saving…' : '✓ Save Zone'}
          </button>
        </div>
      </div>

      {/* Existing zones list */}
      {existingZones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Saved Zones ({existingZones.length})</p>
          </div>
          <div className="divide-y divide-gray-100">
            {existingZones.map(zone => (
              <div key={zone.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: zone.color }} />
                  <span className="text-sm font-semibold text-gray-800">{zone.zone_name}</span>
                  <span className="text-xs text-gray-400">{zone.polygon_coords.length} points</span>
                </div>
                <button
                  onClick={() => zone.id && handleDelete(zone.id)}
                  disabled={deletingId === zone.id}
                  className="text-xs text-red-500 hover:text-red-700 font-bold disabled:opacity-40"
                >
                  {deletingId === zone.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
