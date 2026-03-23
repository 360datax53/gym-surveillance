'use client'

import { useEffect, useState } from 'react'

interface Member {
  id: string
  name: string
  email: string
  phone: string
  card_id: string
  membership_status: string
  membership_end: string
  registered_at: string
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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
        setFilteredMembers(data.members || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [])

  useEffect(() => {
    let results = members

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      results = results.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.phone.includes(term) ||
        (m.card_id && m.card_id.toLowerCase().includes(term))
      )
    }

    if (statusFilter !== 'all') {
      results = results.filter(m => m.membership_status === statusFilter)
    }

    setFilteredMembers(results)
  }, [searchTerm, statusFilter, members])

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
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Gym Members</h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a 
              href="/dashboard/members/new" 
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: 'var(--color-background-tertiary)',
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid var(--color-border-tertiary)',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-border-tertiary)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-background-tertiary)')}
            >
              <span>➕</span> Add Member
            </a>
            <a 
              href="/api/members/export?format=csv" 
              download
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: 'var(--color-text-info)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <span>📥</span> Download CSV
            </a>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'var(--color-background-primary)',
              border: '1px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '14px',
              color: 'var(--color-text-primary)'
            }}
          />
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
              minWidth: '150px'
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div style={{ color: 'var(--color-text-tertiary)', fontSize: '14px' }}>
          Total: {filteredMembers.length} members
        </div>
      </header>

      {filteredMembers.length === 0 ? (
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center', 
          backgroundColor: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px dashed var(--color-border-secondary)'
        }}>
          <p style={{ color: 'var(--color-text-tertiary)' }}>No members found matching your criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredMembers.map((member) => (
            <div 
              key={member.id} 
              style={{ 
                padding: '1.5rem', 
                border: '1px solid var(--color-border-tertiary)', 
                borderRadius: 'var(--border-radius-lg)',
                backgroundColor: 'var(--color-background-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>{member.name}</h3>
                <p style={{ margin: '0.25rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  {member.email} • {member.phone}
                </p>
                <p style={{ margin: '0.25rem 0', color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
                  Card ID: {member.card_id || 'N/A'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  display: 'inline-block',
                  padding: '0.4rem 0.8rem',
                  borderRadius: 'var(--border-radius-md)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  backgroundColor: member.membership_status === 'active' ? 'rgba(0, 200, 0, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                  color: member.membership_status === 'active' ? '#008000' : 'var(--color-text-danger)',
                  marginBottom: '0.5rem'
                }}>
                  {member.membership_status}
                </span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                  Ends: {member.membership_end ? new Date(member.membership_end).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
