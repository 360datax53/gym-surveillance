'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Building2, Plus, Pencil, Save, X, Loader2, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newCity, setNewCity] = useState('United Kingdom')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadOrganizations()
  }, [])

  async function loadOrganizations() {
    setLoading(true)
    const { data, error } = await supabase.from('organizations').select('*').order('name')
    if (error) {
      console.error('Error loading orgs:', error)
      setError('Failed to load organizations. Have you run the SQL migration?')
    } else {
      setOrganizations(data || [])
    }
    setLoading(false)
  }

  async function handleAdd() {
    if (!newName.trim()) return
    setError(null)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: newName, city: newCity })
      .select()
      .single()

    if (orgError) {
      setError(orgError.message)
      return
    }

    // Link user
    await supabase.from('user_organizations').insert({
      user_id: session.user.id,
      organization_id: newOrg.id,
      role: 'admin'
    })

    setNewName('')
    setIsAdding(false)
    loadOrganizations()
  }

  async function handleUpdate(id: string) {
    if (!newName.trim()) return
    setError(null)

    const { error } = await supabase
      .from('organizations')
      .update({ name: newName, city: newCity })
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      setEditingId(null)
      loadOrganizations()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-2">Manage your gym locations and organizations.</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
            <p className="text-xs text-red-600 mt-1">Make sure you have executed the `setup_organizations.sql` migration in your Supabase SQL Editor.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-red-600" />
            Gym Locations
          </h2>
          <button
            onClick={() => {
              setIsAdding(true)
              setNewName('')
              setNewCity('United Kingdom')
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Location
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {organizations.length === 0 && !isAdding && (
            <div className="p-12 text-center text-gray-500 italic">
              No organizations found. Your dashboard is currently using mock data.
            </div>
          )}

          {isAdding && (
            <div className="p-6 bg-red-50/30 flex gap-4">
              <div className="flex-1 space-y-4">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Location Name (e.g. Dartford)"
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                />
                <input
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="City/Region"
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={handleAdd} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Save className="h-4 w-4" />
                </button>
                <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {organizations.map((org) => (
            <div key={org.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              {editingId === org.id ? (
                <div className="flex-1 flex gap-4 pr-4">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  />
                  <input
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-48 p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              ) : (
                <div>
                  <h3 className="font-bold text-gray-900">{org.name}</h3>
                  <p className="text-sm text-gray-500">{org.city}</p>
                </div>
              )}

              <div className="flex gap-2">
                {editingId === org.id ? (
                  <>
                    <button onClick={() => handleUpdate(org.id)} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <Save className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setEditingId(org.id)
                      setNewName(org.name)
                      setNewCity(org.city)
                    }} 
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
