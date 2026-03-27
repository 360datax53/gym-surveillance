'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [heatmapData, setHeatmapData] = useState<any>(null)
  const [cameraCount, setCameraCount] = useState<number>(14)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user)
    })

    // Fetch live heatmap data for today
    const fetchHeatmap = async () => {
      try {
        const d = new Date()
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const res = await fetch(`/api/analytics/heatmap?date=${today}`)
        if (res.ok) {
          const data = await res.json()
          setHeatmapData(data)
        }
      } catch (e) {
        console.error('Failed to fetch dashboard heatmap', e)
      }
    }
    fetchHeatmap()

    const fetchCameraCount = async () => {
      const { count } = await supabase.from('cameras').select('*', { count: 'exact', head: true })
      if (count !== null) setCameraCount(count)
    }
    fetchCameraCount()
  }, [])

  // Calculate busiest zone
  const busiestZone = heatmapData && Object.keys(heatmapData.zoneStats).length > 0 
    ? Object.entries(heatmapData.zoneStats).sort(([, a]: any, [, b]: any) => b.peak - a.peak)[0]?.[0]?.replace('_', ' ').toUpperCase() 
    : 'No Data'


  return (
    <div style={{ padding: '2rem', background: 'var(--color-background-secondary)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '32px', fontWeight: 600 }}>🎥 Gym Surveillance Dashboard</h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Welcome, {user?.email || 'User'}! Here&apos;s your system status.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '1.5rem',
        }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Today's Foot Traffic</p>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '28px', fontWeight: 600 }}>{heatmapData ? heatmapData.totalVisitors : '...'}</h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-info)' }}>📍 Busiest: {busiestZone}</p>
        </div>

        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '1.5rem',
        }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Active Alerts</p>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '28px', fontWeight: 600, color: 'var(--color-text-danger)' }}>3</h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-danger)' }}>⚠️ Review needed</p>
        </div>

        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '1.5rem',
        }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Cameras Online</p>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '28px', fontWeight: 600 }}>{cameraCount}/{cameraCount}</h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-info)' }}>✅ All operational</p>
        </div>

        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '1.5rem',
        }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>System Uptime</p>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '28px', fontWeight: 600 }}>99.8%</h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-info)' }}>Last 30 days</p>
        </div>
      </div>

      {/* Traffic Dashboard Chart */}
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '16px', fontWeight: 500 }}>Traffic Timeline (Today)</h3>
        <div style={{ width: '100%', height: '280px' }}>
          {heatmapData && heatmapData.timeline && heatmapData.timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={heatmapData.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPeople" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#da291c" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#da291c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  tickFormatter={(time) => new Date(time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                  stroke="var(--color-text-tertiary)"
                  fontSize={12}
                  tickMargin={8}
                />
                <YAxis 
                  stroke="var(--color-text-tertiary)"
                  fontSize={12}
                />
                <Tooltip 
                  labelFormatter={(label) => new Date(label).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border-tertiary)' }}
                />
                <Area type="monotone" dataKey="people" stroke="#da291c" strokeWidth={3} fillOpacity={1} fill="url(#colorPeople)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: '14px' }}>
              No traffic data available yet today.
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '1.5rem',
      }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '16px', fontWeight: 500 }}>Recent Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>🔐 John Doe logged in</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Entrance A</p>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>5 min ago</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>⚠️ Card sharing detected</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '12px', color: 'var(--color-text-danger)' }}>Members: Sarah &amp; Mike</p>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>12 min ago</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>✅ System backup completed</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>All databases synced</p>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>1 hour ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}
