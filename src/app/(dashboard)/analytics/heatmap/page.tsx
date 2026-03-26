'use client'

import { useState, useEffect, useRef } from 'react'

interface ZoneStat {
  total: number
  peak: number
  average: number
  count: number
}

interface HeatmapData {
  zoneStats: Record<string, ZoneStat>
  timeline: Array<{ time: string; zone: string; people: number }>
  totalVisitors: number
}

interface Camera {
  id: string
  camera_id: string
  name: string
  zone: string
  status: string
}

export default function HeatmapPage() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [cameras, setCameras] = useState<Camera[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(true)
  
  // Floor Plan State
  const [isEditMode, setIsEditMode] = useState(false)
  const [positions, setPositions] = useState<Record<string, {x: number, y: number}>>({})
  const [placingCameraId, setPlacingCameraId] = useState<string | null>(null)
  const [mapUrl, setMapUrl] = useState('/floorplan.png')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Rename State
  const [editingCameraId, setEditingCameraId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    // Load saved camera positions from localStorage
    const saved = localStorage.getItem('gymCameraPositions')
    if (saved) {
      try {
        setPositions(JSON.parse(saved))
      } catch (e) {}
    }
    
    fetchCameras()
  }, [])

  useEffect(() => {
    fetchHeatmap()
  }, [selectedDate])

  const fetchCameras = async () => {
    try {
      const res = await fetch('/api/cameras')
      if (res.ok) {
        const data = await res.json()
        setCameras(data.cameras || [])
      }
    } catch (e) {
      console.error('Failed to fetch cameras', e)
    }
  }

  const fetchHeatmap = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/heatmap?date=${selectedDate}`)
      const data = await response.json()
      setHeatmapData(data)
    } catch (error) {
      console.error('Heatmap fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMarkerColor = (stats?: ZoneStat) => {
    if (!stats) return 'rgba(100, 116, 139, 0.4)' // Gray - No Data
    const intensity = stats.peak
    if (intensity > 20) return 'rgba(239, 68, 68, 0.8)' // Red - Crowded
    if (intensity > 10) return 'rgba(245, 158, 11, 0.8)' // Orange - Busy
    if (intensity > 5) return 'rgba(252, 211, 77, 0.8)' // Yellow - Moderate
    return 'rgba(34, 197, 94, 0.8)' // Green - Quiet
  }

  const getMarkerShadow = (stats?: ZoneStat) => {
    if (!stats) return 'none'
    const intensity = stats.peak
    if (intensity > 20) return '0 0 30px rgba(239, 68, 68, 0.6)'
    if (intensity > 10) return '0 0 20px rgba(245, 158, 11, 0.6)'
    if (intensity > 5) return '0 0 15px rgba(252, 211, 77, 0.6)'
    return '0 0 10px rgba(34, 197, 94, 0.6)'
  }

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode || !placingCameraId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    const newPos = { ...positions, [placingCameraId]: { x, y } }
    setPositions(newPos)
    localStorage.setItem('gymCameraPositions', JSON.stringify(newPos))
    setPlacingCameraId(null) // Done placing
  }

  const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', e.target.files[0])

    try {
      const res = await fetch('/api/upload-map', { method: 'POST', body: formData })
      if (res.ok) {
        // Force image refresh by appending timestamp
        setMapUrl(`/floorplan-custom.png?v=${Date.now()}`)
      }
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRenameCamera = async (e: React.FormEvent, id: string) => {
    e.preventDefault()
    if (!editName.trim()) return

    try {
      const res = await fetch('/api/cameras', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName })
      })

      if (res.ok) {
        // Update local state without refetching
        setCameras(prev => prev.map(c => c.id === id ? { ...c, name: editName } : c))
      }
    } catch (err) {
      console.error('Rename failed', err)
    } finally {
      setEditingCameraId(null)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span role="img" aria-label="heatmap">🗺️</span> Floor Plan Heatmap
          </h1>
          <p className="text-gray-500 mt-2">Live spatial occupancy overlay on the gym floor plan.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors shadow-sm border ${
              isEditMode 
                ? 'bg-amber-100 text-amber-700 border-amber-300' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {isEditMode ? 'Done Editing' : '✏️ Map Cameras'}
          </button>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <label className="text-sm font-medium text-gray-600">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium">Loading Heatmap...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Floor Plan Area */}
          <div className="lg:col-span-3 space-y-4">
            {isEditMode && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm">
                <strong>Edit Mode Active:</strong> Click a camera button on the right, then click on the floor plan above to set its physical location.
              </div>
            )}
            
            <div 
              className={`relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden border-2 shadow-2xl ${
                isEditMode && placingCameraId ? 'cursor-crosshair border-blue-500 ring-4 ring-blue-500/20' : 'border-gray-800'
              }`}
              onClick={handleMapClick}
              style={{
                backgroundImage: `url('${mapUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Floor Plan Placeholder Overlay (if image is missing) */}
              <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay pointer-events-none"></div>

              {/* Render Placed Cameras */}
              {cameras.map(camera => {
                const pos = positions[camera.id]
                if (!pos) return null
                
                const stats = heatmapData?.zoneStats[camera.zone]
                
                return (
                  <div
                    key={camera.id}
                    className="absolute group -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out z-10"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    {/* Glowing Heat Marker */}
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white/50 backdrop-blur-sm cursor-pointer transition-transform group-hover:scale-125"
                      style={{ 
                        backgroundColor: getMarkerColor(stats),
                        boxShadow: getMarkerShadow(stats)
                      }}
                    />
                    
                    {/* Tooltip */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur text-white text-xs px-3 py-2 rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      <p className="font-bold text-sm mb-1">{camera.name}</p>
                      <p className="text-gray-300">Zone: {camera.zone}</p>
                      {stats ? (
                        <>
                          <p className="text-blue-300 mt-1">Peak: {stats.peak} people</p>
                          <p className="text-green-300">Avg: {stats.average} people</p>
                        </>
                      ) : (
                        <p className="text-gray-400 mt-1 italic">No data today</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Below Map - Summary Stats */}
            {heatmapData && (
              <div className="grid grid-cols-3 gap-6 pt-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Foot Traffic</p>
                  <p className="text-3xl font-black text-gray-900">{heatmapData.totalVisitors}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Max Capacity Point</p>
                  <p className="text-3xl font-black text-[#f59e0b]">
                    {Math.max(0, ...Object.values(heatmapData.zoneStats).map(z => z.peak))}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Busy Zone</p>
                  <p className="text-xl font-bold text-blue-600 mt-2 truncate">
                    {Object.entries(heatmapData.zoneStats).sort(([, a], [, b]) => b.peak - a.peak)[0]?.[0]?.replace('_', ' ').toUpperCase() || 'N/A'}
                  </p>
                </div>
              </div>
            )}
            {/* Advanced Reporting Analytics */}
            {heatmapData && !isEditMode && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-8">
                
                {/* Timeline Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center bg-gray-50 -my-6 -mx-6 p-4 border-b border-gray-200 mb-6 rounded-t-xl">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">Traffic by Time of Day</h2>
                      <p className="text-xs text-gray-500">15-minute intervals</p>
                    </div>
                    {/* Calculate Absolute Peak Time */}
                    {heatmapData.timeline.length > 0 && (
                      <div className="text-right">
                        <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Peak Time</p>
                        <p className="font-bold text-gray-900">
                          {new Date(
                            [...heatmapData.timeline].sort((a, b) => b.people - a.people)[0]?.time || new Date()
                          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="h-[200px] flex items-end gap-1 overflow-x-auto pb-2 custom-scrollbar">
                    {heatmapData.timeline.length > 0 ? (
                      heatmapData.timeline.map((point, idx) => {
                        const maxPeople = Math.max(...heatmapData.timeline.map(p => p.people)) || 1
                        const height = (point.people / maxPeople) * 100
                        
                        return (
                          <div
                            key={idx}
                            style={{ height: `${Math.max(height, 5)}%` }}
                            className={`flex-1 min-w-[8px] rounded-t-md transition-all group relative cursor-crosshair ${
                              point.people > 15 ? 'bg-red-500' : point.people > 8 ? 'bg-amber-400' : 'bg-blue-500'
                            } hover:brightness-110 opacity-90 hover:opacity-100`}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-32 pb-1">
                              <div className="bg-gray-900 text-white text-[10px] p-2 rounded shadow-2xl">
                                <p className="font-bold">{new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-blue-300">{point.people} detected</p>
                                <p className="text-gray-400 italic break-words">{point.zone.replace('_', ' ')}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 italic">No timeline data available for this date</div>
                    )}
                  </div>
                </div>

                {/* Popular Zones Ranking */}
                <div className="bg-white p-0 rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">Most Used Areas</h2>
                    <p className="text-xs text-gray-500">Ranked by peak capacity</p>
                  </div>
                  <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[220px] custom-scrollbar">
                    {Object.entries(heatmapData.zoneStats).length > 0 ? (
                      Object.entries(heatmapData.zoneStats)
                        .sort(([, a], [, b]) => b.peak - a.peak)
                        .map(([zone, stats], idx) => (
                          <div key={zone} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                idx === 1 ? 'bg-gray-100 text-gray-600' : 
                                idx === 2 ? 'bg-orange-100 text-orange-700' : 
                                'bg-blue-50 text-blue-600'
                              }`}>
                                {idx + 1}
                              </span>
                              <div>
                                <p className="text-sm font-bold text-gray-800 capitalize">{zone.replace(/_/g, ' ')}</p>
                                <p className="text-xs text-gray-500">Avg: {stats.average} people</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-gray-900">{stats.peak}</p>
                              <p className="text-[10px] font-bold text-red-500 uppercase">Peak Value</p>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-gray-400 italic">No zone data available</div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Sidebar - Camera List & Legend */}
          <div className="space-y-6">
            {/* Heatmap Legend */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Intensity Legend</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                  <span className="text-sm font-medium text-gray-600">Quiet (&lt;5)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(252,211,77,0.6)]" />
                  <span className="text-sm font-medium text-gray-600">Moderate (5-10)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.6)]" />
                  <span className="text-sm font-medium text-gray-600">Busy (10-20)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)]" />
                  <span className="text-sm font-medium text-gray-600">Crowded (&gt;20)</span>
                </div>
              </div>
            </div>

            {/* Camera Mapping Controls */}
            {isEditMode && (
              <div className="bg-white p-5 rounded-xl border-2 border-amber-200 shadow-sm flex flex-col gap-4">
                
                {/* Upload Map Button */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Custom Floor Plan</h3>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleMapUpload} />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-2 bg-gray-100 text-gray-700 font-bold rounded-md hover:bg-gray-200 text-sm border border-gray-300 transition-colors"
                  >
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                  </button>
                  <p className="text-[10px] text-gray-500 mt-2">Uploading will overwrite your custom floor map.</p>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-1">Camera Placement & Naming</h3>
                  <p className="text-xs text-gray-500 mb-4">Click name to rename to match iVMS 4200. Click button to place.</p>
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {cameras.map(camera => {
                      const isPlaced = !!positions[camera.id]
                      const isSelected = placingCameraId === camera.id
                      const isEditing = editingCameraId === camera.id
                      
                      return (
                        <div key={camera.id} className="flex gap-2 items-center">
                          <button
                            onClick={() => setPlacingCameraId(camera.id)}
                            className={`flex-1 text-left px-3 py-2 rounded-md text-sm font-medium transition-all ${
                              isSelected 
                                ? 'bg-blue-600 text-white shadow-md scale-[1.02]' 
                                : isPlaced
                                  ? 'bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100'
                                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              {isEditing ? (
                                <form onSubmit={(e) => handleRenameCamera(e, camera.id)} className="w-full">
                                  <input 
                                    autoFocus
                                    className="w-full bg-white text-black px-1 rounded border border-blue-400 outline-none" 
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onBlur={(e) => handleRenameCamera(e, camera.id)}
                                    onClick={e => e.stopPropagation()}
                                  />
                                </form>
                              ) : (
                                <span onClick={(e) => {
                                  e.stopPropagation()
                                  setEditName(camera.name)
                                  setEditingCameraId(camera.id)
                                }}>{camera.name} 📝</span>
                              )}
                              {!isEditing && (isPlaced ? <span className="text-xs">✓ Placed</span> : <span className="text-xs text-blue-500">Unplaced</span>)}
                            </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  {Object.keys(positions).length > 0 && (
                    <button 
                      onClick={() => {
                        if(window.confirm('Reset all camera positions?')) {
                          setPositions({})
                          localStorage.removeItem('gymCameraPositions')
                        }
                      }}
                      className="mt-4 w-full py-2 text-xs font-bold text-red-500 bg-red-50 rounded-md hover:bg-red-100"
                    >
                      Reset All Positions
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
