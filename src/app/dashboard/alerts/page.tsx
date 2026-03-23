'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Detection {
  id: string
  detection_type?: string
  alert_type?: string
  person_name: string
  location?: string
  description?: string
  detection_time?: string
  alert_time?: string
  created_at: string
  resolved?: boolean
  severity?: string
  resolution_notes?: string
  confidence: number
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Detection[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Detection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [resolving, setResolving] = useState<string | null>(null)
  const [notes, setNotes] = useState<{ [key: string]: string }>({})

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch alerts')
      }
      const data = await response.json()
      setAlerts(data.alerts || [])
      setFilteredAlerts(data.alerts || [])
    } catch (err: any) {
      console.error('Error fetching alerts:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  useEffect(() => {
    let results = alerts

    if (typeFilter !== 'all') {
      results = results.filter(a => (a.detection_type || a.alert_type) === typeFilter)
    }

    if (statusFilter !== 'all') {
      const isResolved = statusFilter === 'resolved'
      results = results.filter(a => !!a.resolved === isResolved)
    }

    setFilteredAlerts(results)
  }, [typeFilter, statusFilter, alerts])

  const handleResolve = async (alertId: string) => {
    setResolving(alertId)
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolved: true,
          resolution_notes: notes[alertId] || ''
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resolve alert')
      }

      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, resolved: true, resolution_notes: notes[alertId] } : a))
      setNotes(prev => ({ ...prev, [alertId]: '' }))
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setResolving(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
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

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>Alerts & Detections</h1>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--color-background-primary)',
              border: '1px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '14px',
              color: 'var(--color-text-primary)',
              minWidth: '200px'
            }}
          >
            <option value="all">All Types</option>
            <option value="card_sharing">Card Sharing</option>
            <option value="unauthorized">Unauthorized Entry</option>
            <option value="loitering">Loitering</option>
            <option value="behavioral">Suspicious Behavior</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--color-background-primary)',
              border: '1px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '14px',
              color: 'var(--color-text-primary)',
              minWidth: '180px'
            }}
          >
            <option value="all">All Status</option>
            <option value="unresolved">New / In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        
        <div style={{ marginTop: '1rem', color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>
          Total: {filteredAlerts.length} alerts found
        </div>
      </header>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {filteredAlerts.length === 0 ? (
          <div style={{ 
            padding: '4rem', 
            textAlign: 'center', 
            backgroundColor: 'var(--color-background-secondary)', 
            borderRadius: 'var(--border-radius-lg)', 
            border: '1px dashed var(--color-border-secondary)' 
          }}>
            <p style={{ color: 'var(--color-text-tertiary)' }}>No alerts found matching your filters.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              style={{
                backgroundColor: alert.resolved ? 'var(--color-background-secondary)' : 'var(--color-background-primary)',
                padding: '1.75rem',
                borderRadius: 'var(--border-radius-lg)',
                border: '1px solid var(--color-border-secondary)',
                boxShadow: alert.resolved ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
                opacity: alert.resolved ? 0.75 : 1,
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {(alert.detection_type || alert.alert_type || 'DETECTION').replace(/_/g, ' ').toUpperCase()}
                    </h3>
                    <span style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: 'var(--border-radius-md)',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: alert.resolved ? 'rgba(0, 200, 0, 0.1)' : 'rgba(255, 180, 0, 0.1)',
                      color: alert.resolved ? '#008000' : '#CC8800',
                      textTransform: 'uppercase'
                    }}>
                      {alert.resolved ? '✓ Resolved' : '⏳ New'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      {alert.person_name || 'Unknown Subject'} • {alert.location || 'Entrance Hall'}
                    </p>
                    {alert.description && (
                      <p style={{ margin: 0, color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
                        {alert.description}
                      </p>
                    )}
                    <p style={{ margin: 0, color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>
                      Confidence Score: <span style={{ color: 'var(--color-text-info)', fontWeight: 600 }}>{(alert.confidence !== undefined ? alert.confidence * 100 : 0).toFixed(1)}%</span>
                    </p>
                    <p style={{ margin: 0, color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>
                      Detected at: {new Date(alert.detection_time || alert.alert_time || alert.created_at).toLocaleString()}
                    </p>
                  </div>

                  {alert.resolved && alert.resolution_notes && (
                    <div style={{ 
                      marginTop: '1.25rem', 
                      padding: '1rem', 
                      backgroundColor: 'rgba(0, 128, 0, 0.05)', 
                      borderRadius: 'var(--border-radius-md)',
                      border: '1px solid rgba(0, 128, 0, 0.1)'
                    }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        <strong style={{ color: '#008000' }}>Note:</strong> {alert.resolution_notes}
                      </p>
                    </div>
                  )}
                </div>

                {!alert.resolved && (
                  <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <textarea
                      placeholder="Add resolution notes (e.g., 'Checked, member was authorized')"
                      value={notes[alert.id] || ''}
                      onChange={(e) => setNotes({ ...notes, [alert.id]: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'var(--color-background-primary)',
                        border: '1px solid var(--color-border-tertiary)',
                        borderRadius: 'var(--border-radius-md)',
                        fontSize: '13px',
                        minHeight: '80px',
                        resize: 'none',
                        outline: 'none',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                    <button
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolving === alert.id}
                      style={{
                        padding: '0.7rem 1.2rem',
                        backgroundColor: resolving === alert.id ? 'var(--color-border-tertiary)' : 'var(--color-text-info)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--border-radius-md)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: resolving === alert.id ? 'not-allowed' : 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseOver={(e) => !resolving && (e.currentTarget.style.opacity = '0.9')}
                      onMouseOut={(e) => !resolving && (e.currentTarget.style.opacity = '1')}
                    >
                      {resolving === alert.id ? 'Resolving...' : 'Mark as Resolved'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
