'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SearchResult {
  id: string
  type: 'member' | 'alert'
  name?: string
  email?: string
  card_id?: string
  membership_status?: string
  person_name?: string
  alert_type?: string
  location?: string
  confidence?: number
  detection_time?: string
  resolved?: boolean
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'member' | 'alert'>('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=${searchType}`
      )
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', background: 'var(--color-background-primary)' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
          🔍 Data Discovery
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Query across members and security alerts for centralized investigation.
        </p>
      </div>

      {/* Search HUD */}
      <form onSubmit={handleSearch} style={{ 
        marginBottom: '3rem', 
        padding: '1.5rem', 
        background: 'var(--color-background-secondary)', 
        borderRadius: '16px', 
        border: '1px solid var(--color-border-primary)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, card ID, or alert..."
            style={{
              padding: '1rem',
              border: '1px solid var(--color-border-secondary)',
              borderRadius: '8px',
              fontSize: '15px',
              background: 'var(--color-background-primary)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          />

          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as any)}
            style={{
              padding: '1rem',
              border: '1px solid var(--color-border-secondary)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'var(--color-background-primary)',
              color: 'var(--color-text-primary)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="all">ALL ENTITIES</option>
            <option value="member">MEMBERS ONLY</option>
            <option value="alert">ALERTS ONLY</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '1rem 2rem',
              background: loading ? 'var(--color-background-tertiary)' : 'var(--color-primary, #007bff)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? 'ANALYZING...' : 'SEARCH'}
          </button>
        </div>
      </form>

      {/* Results Section */}
      {searched && (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              MATCHED RESULTS ({results.length})
            </h2>
            {loading && <span style={{ fontSize: '12px', color: 'var(--color-primary)' }}>Refreshing data...</span>}
          </div>

          {results.length === 0 ? (
            <div
              style={{
                padding: '4rem 2rem',
                background: 'var(--color-background-secondary)',
                borderRadius: '16px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                border: '1px dashed var(--color-border-secondary)'
              }}
            >
              No records found matching "{query}"
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {results.map((result) => (
                <div
                  key={result.id}
                  style={{
                    padding: '1.5rem',
                    border: '1px solid var(--color-border-secondary)',
                    borderRadius: '16px',
                    background: 'var(--color-background-primary)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  {result.type === 'member' ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-background-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            👤
                          </div>
                          <div>
                            <h3 style={{ margin: '0', fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                              {result.name}
                            </h3>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '4px' }}>
                              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>ID: {result.card_id}</span>
                              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{result.email}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ 
                          padding: '4px 12px', 
                          background: result.membership_status === 'active' ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 61, 0, 0.1)',
                          color: result.membership_status === 'active' ? '#00c853' : '#ff3d00',
                          borderRadius: '100px',
                          fontSize: '11px',
                          fontWeight: 800,
                          letterSpacing: '0.05em'
                        }}>
                          {result.membership_status?.toUpperCase()}
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/members/${result.id}`}
                        style={{
                          color: 'var(--color-primary)',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        ENTITY PROFILE →
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-background-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            {result.alert_type === 'card_sharing' ? '🚨' : '⚠️'}
                          </div>
                          <div>
                            <h3 style={{ margin: '0', fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                              {result.person_name}
                            </h3>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '4px' }}>
                              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>LOCATION: {result.location}</span>
                              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>CONFIDENCE: {(result.confidence! * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ 
                          padding: '4px 12px', 
                          background: result.resolved ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 171, 0, 0.1)',
                          color: result.resolved ? '#00c853' : '#ffab00',
                          borderRadius: '100px',
                          fontSize: '11px',
                          fontWeight: 800,
                          letterSpacing: '0.05em'
                        }}>
                          {result.resolved ? '✓ RESOLVED' : '⏳ PENDING ACTION'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link
                          href={`/dashboard/alerts`}
                          style={{
                            color: 'var(--color-primary)',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          AUDIT RECORD →
                        </Link>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                          {new Date(result.detection_time!).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
