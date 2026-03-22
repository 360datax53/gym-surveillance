'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        const { data, error: err } = await supabase
          .from('members')
          .select('*')

        if (err) {
          setError(`Error: ${err.message}`)
          console.error('Supabase error:', err)
        } else {
          setMembers(data || [])
          setError('')
        }
      } catch (e) {
        setError(`Exception: ${e}`)
        console.error('Exception:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Members ({members.length})</h1>
      {members.length === 0 ? <p>No members</p> : (
        <pre>{JSON.stringify(members, null, 2)}</pre>
      )}
    </div>
  )
}
