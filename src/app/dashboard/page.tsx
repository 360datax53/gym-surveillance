'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setIsAuthed(true)
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
    <div style={{ padding: '2rem' }}>
      <h1 style={{ margin: '0 0 1rem', fontSize: '28px', fontWeight: 500 }}>🎥 Gym Surveillance Dashboard</h1>
      
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
          ✅ Welcome! Your gym surveillance system is online and ready.
        </p>
        <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', marginTop: '1rem' }}>
          Week 2 setup complete. More features coming in Week 3!
        </p>
      </div>
    </div>
  )
}
