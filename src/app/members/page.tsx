'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function MembersPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('members').select('*').then(({ data }) => {
      setMembers(data || [])
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Members</h1>
      {loading ? <p>Loading...</p> : <p>{members.length} members</p>}
    </div>
  )
}
