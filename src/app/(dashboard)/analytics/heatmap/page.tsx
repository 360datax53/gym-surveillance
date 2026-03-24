'use client'

import { useState, useEffect } from 'react'

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

export default function HeatmapPage() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHeatmap()
  }, [selectedDate])

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

  const getZoneColor = (zone: string, stats: ZoneStat) => {
    const intensity = stats.peak
    if (intensity > 20) return 'rgba(239, 68, 68, 0.2)' // Red - very busy
    if (intensity > 10) return 'rgba(245, 158, 11, 0.2)' // Orange - busy
    if (intensity > 5) return 'rgba(252, 211, 77, 0.2)' // Yellow - moderate
    return 'rgba(34, 197, 94, 0.1)' // Green - quiet
  }

  const getBorderColor = (stats: ZoneStat) => {
    const intensity = stats.peak
    if (intensity > 20) return '#ef4444'
    if (intensity > 10) return '#f59e0b'
    if (intensity > 5) return '#fcd34d'
    return '#22c55e'
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span role="img" aria-label="heatmap">🗺️</span> Gym Heatmap & Analytics
          </h1>
          <p className="text-gray-500 mt-2">Monitor spatial occupancy and traffic flow across gym zones.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
              const res = await fetch('/api/analytics/test-data', { method: 'POST' })
              if (res.ok) fetchHeatmap()
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Generate Test Data
          </button>
          <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <label className="text-sm font-medium text-gray-600">Observation Date:</label>
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
          <p className="text-gray-500 font-medium">Aggregating spatial data...</p>
        </div>
      ) : heatmapData && Object.keys(heatmapData.zoneStats).length > 0 ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Visitors</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-4xl font-bold text-gray-900">{heatmapData.totalVisitors}</p>
                <p className="text-sm text-green-500 font-medium">Synced</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Peak Intensity</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-4xl font-bold text-gray-900">
                  {Math.max(...Object.values(heatmapData.zoneStats).map(z => z.peak))}
                </p>
                <p className="text-sm text-gray-500">people/zone</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">High-Traffic Zone</p>
              <div className="mt-2">
                <p className="text-2xl font-bold text-blue-600 truncate">
                  {Object.entries(heatmapData.zoneStats).sort(([, a], [, b]) => b.peak - a.peak)[0]?.[0]?.replace('_', ' ').toUpperCase() || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Zone Heatmap Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Spatial Occupancy</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(heatmapData.zoneStats).map(([zone, stats]) => (
                <div
                  key={zone}
                  style={{
                    backgroundColor: getZoneColor(zone, stats),
                    borderColor: getBorderColor(stats),
                  }}
                  className="p-6 rounded-2xl border-2 transition-all hover:scale-[1.02] cursor-default"
                >
                  <h3 className="text-lg font-bold text-gray-900 border-b border-white/20 pb-2 mb-4">
                    {zone.replace('_', ' ').toUpperCase()}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Peak Occupancy</span>
                      <span className="font-bold">{stats.peak}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Avg Presence</span>
                      <span className="font-bold text-blue-600">{stats.average}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 text-gray-400 font-medium uppercase italic">
                      <span>Total Checkouts: {stats.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Chart */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Temporal Activity Flow</h2>
              <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase">15-Minute Buckets</span>
            </div>
            <div className="h-[300px] flex items-end gap-1.5 overflow-x-auto pb-4 custom-scrollbar">
              {heatmapData.timeline.map((point, idx) => {
                const maxPeople = Math.max(...heatmapData.timeline.map(p => p.people)) || 1
                const height = (point.people / maxPeople) * 100
                
                return (
                  <div
                    key={idx}
                    style={{ height: `${Math.max(height, 5)}%` }}
                    className={`flex-1 min-w-[12px] rounded-t-md transition-all group relative ${
                      point.people > 15 ? 'bg-red-500' : point.people > 8 ? 'bg-orange-400' : 'bg-blue-500'
                    } hover:brightness-110 hover:shadow-lg`}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-32">
                      <div className="bg-gray-900 text-white text-[10px] p-2 rounded shadow-2xl">
                        <p className="font-bold">{new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-blue-300">{point.people} active persons</p>
                        <p className="text-gray-400 italic">Zone: {point.zone}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Heatmap Legend */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Intensity Legend</h3>
            <div className="flex flex-wrap gap-8">
              {[
                { label: 'Quiet (<5)', color: 'bg-green-500/20', border: 'border-green-500' },
                { label: 'Moderate (5-10)', color: 'bg-yellow-400/20', border: 'border-yellow-400' },
                { label: 'Busy (10-20)', color: 'bg-orange-500/20', border: 'border-orange-500' },
                { label: 'Critically Busy (>20)', color: 'bg-red-500/20', border: 'border-red-500' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded border-2 ${item.color} ${item.border}`} />
                  <span className="text-sm font-medium text-gray-600 uppercase tracking-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white py-20 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-400">Temporal Sync Required</h3>
          <p className="text-gray-400 max-w-sm mt-1">No spatial occupancy data detected for this date. Check camera synchronization or select another date.</p>
        </div>
      )}
    </div>
  )
}
