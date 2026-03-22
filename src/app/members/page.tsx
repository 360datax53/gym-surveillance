'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '2rem' }}>Members</h1>
      
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--color-background-secondary)' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '1rem', fontSize: '14px', fontWeight: 500 }}>Name</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontSize: '14px', fontWeight: 500 }}>Email</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontSize: '14px', fontWeight: 500 }}>Phone</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontSize: '14px', fontWeight: 500 }}>Status</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontSize: '14px', fontWeight: 500 }}>Membership End</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding: '1rem' }}>{member.name}</td>
                <td style={{ padding: '1rem' }}>{member.email}</td>
                <td style={{ padding: '1rem' }}>{member.phone}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: member.membership_status === 'active' ? 'var(--color-background-info)' : 'var(--color-background-danger)',
                    color: member.membership_status === 'active' ? 'var(--color-text-info)' : 'var(--color-text-danger)',
                  }}>
                    {member.membership_status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  {member.membership_end ? new Date(member.membership_end).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {members.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            No members found
          </div>
        )}
      </div>
    </div>
  )
}
