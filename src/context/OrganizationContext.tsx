'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface Organization {
  id: string
  name: string
  city: string
}

interface OrganizationContextType {
  organizations: Organization[]
  selectedOrgId: string | null
  setSelectedOrgId: (id: string) => void
  currentOrg: Organization | null
  loading: boolean
  refresh: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    async function fetchOrgs() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: orgs, error } = await supabase
          .from('organizations')
          .select('*')
          .order('name')
        
        if (!error && orgs && orgs.length > 0) {
          setOrganizations(orgs)
          
          // Persistence: Try to get from localStorage
          const saved = localStorage.getItem('selectedOrgId')
          if (saved && orgs.find(o => o.id === saved)) {
            setSelectedOrgId(saved)
          } else {
            setSelectedOrgId(orgs[0].id)
          }
        }
      }
      setLoading(false)
    }

    fetchOrgs()
  }, [])

  const handleSetSelectedOrgId = (id: string) => {
    setSelectedOrgId(id)
    localStorage.setItem('selectedOrgId', id)
  }

  const refresh = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name')
    
    if (!error && orgs) {
      setOrganizations(orgs)
    }
    setLoading(false)
  }

  const currentOrg = organizations.find(o => o.id === selectedOrgId) || null

  return (
    <OrganizationContext.Provider value={{ 
      organizations, 
      selectedOrgId, 
      setSelectedOrgId: handleSetSelectedOrgId, 
      currentOrg,
      loading,
      refresh
    }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}
