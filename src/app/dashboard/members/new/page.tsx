'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewMemberPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    card_id: '',
    membership_type: 'annual'
  })

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!formData.name.trim()) newErrors.name = 'Name required'
    if (!formData.email.trim()) newErrors.email = 'Email required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email'
    if (!formData.phone.trim()) newErrors.phone = 'Phone required'
    if (!formData.card_id.trim()) newErrors.card_id = 'Card ID required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create member')
      }

      router.push('/dashboard/members')
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (hasError: boolean) => ({
    width: '100%',
    padding: '0.75rem',
    backgroundColor: 'var(--color-background-primary)',
    border: hasError ? '2px solid var(--color-text-danger)' : '1px solid var(--color-border-tertiary)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '14px',
    color: 'var(--color-text-primary)',
    boxSizing: 'border-box' as const,
    outline: 'none',
    transition: 'border-color 0.2s'
  })

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Add New Member</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Fill in the details below to register a new gym member.
        </p>
      </header>

      <form onSubmit={handleSubmit} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem',
        backgroundColor: 'var(--color-background-secondary)',
        padding: '2rem',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--color-border-secondary)'
      }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '14px', color: 'var(--color-text-secondary)' }}>Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="John Doe"
            style={inputStyle(!!errors.name)}
          />
          {errors.name && <p style={{ color: 'var(--color-text-danger)', fontSize: '12px', margin: '0.4rem 0 0' }}>{errors.name}</p>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '14px', color: 'var(--color-text-secondary)' }}>Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="john@example.com"
            style={inputStyle(!!errors.email)}
          />
          {errors.email && <p style={{ color: 'var(--color-text-danger)', fontSize: '12px', margin: '0.4rem 0 0' }}>{errors.email}</p>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '14px', color: 'var(--color-text-secondary)' }}>Phone *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="+1 (555) 000-0000"
            style={inputStyle(!!errors.phone)}
          />
          {errors.phone && <p style={{ color: 'var(--color-text-danger)', fontSize: '12px', margin: '0.4rem 0 0' }}>{errors.phone}</p>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '14px', color: 'var(--color-text-secondary)' }}>Card ID *</label>
          <input
            type="text"
            value={formData.card_id}
            onChange={(e) => setFormData({...formData, card_id: e.target.value})}
            placeholder="RFID / Barcode Number"
            style={inputStyle(!!errors.card_id)}
          />
          {errors.card_id && <p style={{ color: 'var(--color-text-danger)', fontSize: '12px', margin: '0.4rem 0 0' }}>{errors.card_id}</p>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '14px', color: 'var(--color-text-secondary)' }}>Membership Type</label>
          <select
            value={formData.membership_type}
            onChange={(e) => setFormData({...formData, membership_type: e.target.value})}
            style={inputStyle(false)}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly (3 months)</option>
            <option value="annual">Annual (1 year)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.8rem',
              background: loading ? 'var(--color-border-tertiary)' : 'var(--color-text-info)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.opacity = '1')}
          >
            {loading ? 'Creating...' : 'Create Member'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              flex: 1,
              padding: '0.8rem',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
