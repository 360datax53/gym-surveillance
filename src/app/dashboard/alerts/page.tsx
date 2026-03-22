'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Detection {
  id: string
  detection_type: string
  person_name: string
  location?: string
  description?: string
  detection_time: string
  resolved?: boolean
  severity?: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Detection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const response = await fetch('/api/alerts')
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch alerts')
        }
        const data = await response.json()
        setAlerts(data.alerts || [])
      } catch (err: any) {
        console.error('Error fetching alerts:', err)
        setError(err.message || 'Failed to fetch alerts')
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading alerts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-danger)', textAlign: 'center' }}>
        <h2>Error Loading Alerts</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            marginTop: '1rem', 
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            backgroundColor: 'var(--color-background-primary)',
            border: '1px solid var(--color-border-primary)',
            borderRadius: 'var(--border-radius-md)'
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Alerts & Detections</h1>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          Total: {alerts.length}
        </span>
      </header>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {alerts.map((alert) => (
          <div key={alert.id} style={{
            border: '1px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1.5rem',
            background: alert.resolved ? 'var(--color-background-secondary)' : 'var(--color-background-primary)',
            boxShadow: alert.resolved ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
                  {alert.detection_type || 'Unspecified Type'}
                </h3>
                <p style={{ margin: '0 0 0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  {alert.person_name} {alert.location ? `• ${alert.location}` : ''}
                </p>
                {alert.description && (
                  <p style={{ margin: '0 0 0.5rem', color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>
                    {alert.description}
                  </p>
                )}
                <p style={{ margin: 0, color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>
                  {new Date(alert.detection_time).toLocaleString()}
                </p>
              </div>
              <div style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: alert.resolved ? 'rgba(0, 200, 0, 0.1)' : alert.severity === 'high' ? 'var(--color-background-danger)' : 'rgba(255, 165, 0, 0.1)',
                color: alert.resolved ? '#008000' : alert.severity === 'high' ? 'var(--color-text-danger)' : '#cc8400',
                border: alert.resolved ? '1px solid rgba(0, 200, 0, 0.2)' : '1px solid transparent'
              }}>
                {alert.resolved ? '✓ Resolved' : alert.severity === 'high' ? '🔴 High' : alert.severity === 'medium' ? '🟡 Medium' : 'Low'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {alerts.length === 0 && (
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center', 
          backgroundColor: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px dashed var(--color-border-secondary)'
        }}>
          <p style={{ color: 'var(--color-text-tertiary)' }}>No alerts found in the database.</p>
        </div>
      )}
    </div>
  )
}
