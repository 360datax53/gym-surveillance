'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setIsAuthed(true)
          setUser(session.user)
        } else {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router])

  if (!isAuthed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', background: 'var(--color-background-secondary)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '32px', fontWeight: 600 }}>🎥 Gym Surveillance Dashboard</h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Welcome, {user?.email || 'User'}! Here's your system status.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* Card: Members */}
        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '1.5rem',
        }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Members</p>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '28px', fontWeight: 600 }}>247</h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-info)' }}>↑ 12 new this month</p>
        </div>

        {/* Card: Alerts */}
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

        {/* Card: Cameras */}
        <div 
          onClick={() => router.push('/dashboard/cameras')}
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1.5rem',
            cursor: 'pointer',
            transition: 'transform 0.1s ease-in-out'
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Cameras Online</p>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '28px', fontWeight: 600 }}>5/5</h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-info)' }}>✅ All operational</p>
        </div>

        {/* Card: Uptime */}
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

      {/* Recent Activity */}
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '1.5rem',
        marginBottom: '2rem',
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
              <p style={{ margin: '0.25rem 0 0', fontSize: '12px', color: 'var(--color-text-danger)' }}>Members: Sarah & Mike</p>
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

      {/* Quick Actions */}
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '1.5rem',
      }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '16px', fontWeight: 500 }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          <button 
            onClick={() => router.push('/dashboard/members')}
            style={{
              padding: '0.75rem',
              background: 'var(--color-text-info)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}>
            👤 View Members
          </button>
          <button 
            onClick={() => router.push('/dashboard/alerts')}
            style={{
            padding: '0.75rem',
            background: 'var(--color-text-info)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}>
            ⚠️ View Alerts
          </button>
          <button 
            onClick={() => router.push('/dashboard/cameras')}
            style={{
              padding: '0.75rem',
              background: 'var(--color-text-info)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}>
            📹 View Cameras
          </button>
          <button style={{
            padding: '0.75rem',
            background: 'var(--color-text-info)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}>
            📊 View Reports
          </button>
          <button style={{
            padding: '0.75rem',
            background: 'var(--color-text-info)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}>
            ⚙️ Settings
          </button>
        </div>
      </div>
    </div>
  )
}
