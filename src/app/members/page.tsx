'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setMembers(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '2rem' }}>Members</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Name</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Email</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Phone</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Status</th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>End Date</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '1rem' }}>{m.name}</td>
              <td style={{ padding: '1rem' }}>{m.email}</td>
              <td style={{ padding: '1rem' }}>{m.phone}</td>
              <td style={{ padding: '1rem' }}>{m.membership_status}</td>
              <td style={{ padding: '1rem' }}>{m.membership_end ? new Date(m.membership_end).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {members.length === 0 && <p>No members</p>}
    </div>
  )
}
