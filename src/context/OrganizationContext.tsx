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
      
      const { data: dbOrgs, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name')
      
      let orgs = dbOrgs || [];

      // FINAL FALLBACK: Ensure Dartford is ALWAYS in the list
      const DARTFORD_ID = '4f5a3104-f5ea-44e5-88be-0ebe205b0a37';
      if (!orgs.find(o => o.id === DARTFORD_ID)) {
        orgs = [
          { id: DARTFORD_ID, name: 'Dartford', city: 'United Kingdom' },
          ...orgs
        ];
      }

      setOrganizations(orgs)
      
      // Persistence: Try to get from localStorage
      const saved = localStorage.getItem('selectedOrgId')
      if (saved && orgs.find(o => o.id === saved)) {
        setSelectedOrgId(saved)
      } else {
        setSelectedOrgId(DARTFORD_ID) // Default to Dartford
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
