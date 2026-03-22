'use client'

import { useEffect, useState } from 'react'

interface Member {
  id: string
  name: string
  email: string
  phone: string
  membership_status: string
  membership_end: string
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch('/api/members')
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch members')
        }
        const data = await response.json()
        setMembers(data.members || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading members...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-danger)', textAlign: 'center' }}>
        <h2>Error Loading Members</h2>
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
        <h1 style={{ fontSize: '2rem' }}>Gym Members</h1>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          Total: {members.length}
        </span>
      </header>

      {members.length === 0 ? (
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center', 
          backgroundColor: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px dashed var(--color-border-secondary)'
        }}>
          <p>No members found in the database.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {members.map((member) => (
            <div 
              key={member.id} 
              style={{ 
                padding: '1.5rem', 
                border: '1px solid var(--color-border-tertiary)', 
                borderRadius: 'var(--border-radius-lg)',
                backgroundColor: 'var(--color-background-tertiary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{member.name}</h3>
                <p style={{ margin: '0.25rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  {member.email} • {member.phone}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.8rem',
                  textTransform: 'capitalize',
                  backgroundColor: member.membership_status === 'active' ? 'rgba(0, 200, 0, 0.1)' : 'var(--color-background-danger)',
                  color: member.membership_status === 'active' ? '#008000' : 'var(--color-text-danger)',
                  marginBottom: '0.5rem'
                }}>
                  {member.membership_status}
                </span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                  Ends: {new Date(member.membership_end).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
