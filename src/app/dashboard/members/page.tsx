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
  face_image_url?: string
}

const ITEMS_PER_PAGE = 5

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

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
    setCurrentPage(1)
  }, [searchTerm, statusFilter, members])

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex)

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

  const thStyle = {
    padding: '1rem',
    textAlign: 'left' as const,
    borderBottom: '1px solid var(--color-border-secondary)',
    fontWeight: 600,
    fontSize: '14px',
    color: 'var(--color-text-secondary)'
  }

  const tdStyle = {
    padding: '1rem',
    fontSize: '14px',
    color: 'var(--color-text-primary)',
    verticalAlign: 'middle' as const
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
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
            placeholder="Search by name, email, phone, or Card ID..."
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
          Showing {filteredMembers.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredMembers.length)} of {filteredMembers.length} members
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
        <>
          <div style={{ 
            overflowX: 'auto', 
            marginBottom: '2rem',
            backgroundColor: 'var(--color-background-primary)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--color-border-secondary)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background-secondary)' }}>
                  <th style={{ ...thStyle, width: '60px' }}>Photo</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Contact</th>
                  <th style={thStyle}>Card ID</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Expires</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((member) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <td style={tdStyle}>
                      {member.face_image_url ? (
                        <img
                          src={member.face_image_url}
                          alt={member.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1px solid var(--color-border-tertiary)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-background-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: 'var(--color-text-tertiary)',
                          border: '1px solid var(--color-border-tertiary)'
                        }}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{member.name}</td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '13px' }}>{member.email}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{member.phone}</div>
                    </td>
                    <td style={tdStyle}>{member.card_id || 'N/A'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: 'var(--border-radius-md)',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        backgroundColor: member.membership_status === 'active' ? 'rgba(0, 200, 0, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                        color: member.membership_status === 'active' ? '#008000' : 'var(--color-text-danger)'
                      }}>
                        {member.membership_status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {member.membership_end ? new Date(member.membership_end).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--color-background-primary)',
                  border: '1px solid var(--color-border-tertiary)',
                  borderRadius: 'var(--border-radius-md)',
                  color: currentPage === 1 ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px'
                }}
              >
                ← Prev
              </button>

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: currentPage === page ? 'var(--color-text-info)' : 'var(--color-background-primary)',
                      color: currentPage === page ? 'white' : 'var(--color-text-primary)',
                      border: '1px solid var(--color-border-tertiary)',
                      borderRadius: 'var(--border-radius-md)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: currentPage === page ? 600 : 400
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--color-background-primary)',
                  border: '1px solid var(--color-border-tertiary)',
                  borderRadius: 'var(--border-radius-md)',
                  color: currentPage === totalPages ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '13px'
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
