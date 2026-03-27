'use client'

import { 
  LayoutDashboard, 
  Camera, 
  Users, 
  Bell, 
  Settings, 
  LogOut, 
  ShieldAlert, 
  Map,
  Footprints,
  AlertTriangle,
  Building2,
  ChevronDown,
  User
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Camera, label: 'Cameras', href: '/dashboard/cameras' },
  { icon: Users, label: 'Members', href: '/dashboard/members' },
  { icon: ShieldAlert, label: 'Security Alerts', href: '/dashboard/alerts' },
]

const analyticsItems = [
  { icon: Map, label: 'Heatmap', href: '/analytics/heatmap' },
  { icon: Footprints, label: 'Tracking', href: '/analytics/tracking' },
  { icon: AlertTriangle, label: 'Behavioral Alerts', href: '/analytics/behavioral-alerts' },
]

const mockOrgs = [
  { id: '1', name: 'Dartford', city: 'United Kingdom' },
  { id: '2', name: 'Herne Bay', city: 'United Kingdom' },
  { id: '3', name: 'Isle of Wight', city: 'United Kingdom' },
  { id: '4', name: 'High Wycombe', city: 'United Kingdom' },
  { id: '5', name: 'Whitstable', city: 'United Kingdom' },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [selectedOrg, setSelectedOrg] = useState(mockOrgs[0].id)
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const currentOrg = mockOrgs.find(o => o.id === selectedOrg)
  const userInitial = (user?.email?.[0] || 'U').toUpperCase()
  const userName = user?.email?.split('@')[0] || 'User'

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full overflow-hidden shadow-2xl">
      {/* Brand */}
      <div className="p-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#da291c] rounded shadow-sm flex items-center justify-center text-white text-xl font-black shrink-0">
            SF
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white tracking-tight leading-none">Snap Fitness</h1>
            <p className="text-[10px] text-gray-400 mt-1">Analytics Dashboard</p>
          </div>
        </div>
      </div>

      {/* Organization Switcher */}
      <div className="px-4 pt-4 pb-2">
        <div 
          onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
          className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-[#da291c] flex items-center justify-center flex-shrink-0">
              <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-200 truncate">{currentOrg?.name}</p>
              <p className="text-[10px] text-gray-500">{currentOrg?.city}</p>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ${orgDropdownOpen ? 'rotate-180' : ''}`} />
        </div>

        {orgDropdownOpen && (
          <div className="mt-1 bg-gray-800 rounded-lg border border-white/[0.06] overflow-hidden shadow-xl">
            {mockOrgs.map(org => (
              <div
                key={org.id}
                onClick={() => {
                  setSelectedOrg(org.id)
                  setOrgDropdownOpen(false)
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-all ${
                  org.id === selectedOrg 
                    ? 'bg-[#da291c]/10 text-[#da291c] font-bold' 
                    : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  org.id === selectedOrg ? 'bg-[#da291c]' : 'bg-gray-600'
                }`} />
                <div>
                  <p className="text-[13px] font-medium">{org.name}</p>
                  <p className="text-[10px] text-gray-500">{org.city}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6 custom-scrollbar">
        {/* Main Navigation */}
        <nav className="space-y-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-4">Operations</p>
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
               <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-all group ${
                  isActive 
                    ? 'bg-[#da291c] text-white shadow-md' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#da291c]'}`} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Analytics Section */}
        <nav className="space-y-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-4">Intelligence</p>
          {analyticsItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-all group ${
                  isActive 
                    ? 'bg-[#da291c] text-white shadow-md' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#da291c]'}`} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Profile & Footer */}
      <div className="border-t border-white/5 bg-black/20">
        {/* User Info */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#da291c] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-gray-200 truncate">{userName}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email || 'Loading...'}</p>
            </div>
          </div>
        </div>

        {/* Settings & Logout */}
        <div className="px-4 pb-4 space-y-1">
          <Link 
            href="/dashboard/settings"
            className={`flex items-center space-x-3 px-4 py-2.5 w-full text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-md transition-all group ${
              pathname === '/dashboard/settings' ? 'bg-[#da291c] text-white shadow-md' : ''
            }`}
          >
            <Settings className="h-4.5 w-4.5 group-hover:rotate-45 transition-transform" />
            <span className="font-bold text-sm tracking-tight">Settings</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2.5 w-full text-red-400/70 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all group"
          >
            <LogOut className="h-4.5 w-4.5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm tracking-tight">Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
