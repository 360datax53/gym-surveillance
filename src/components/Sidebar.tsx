'use client'

import { LayoutDashboard, Camera, Users, Bell, Settings, LogOut, ShieldAlert, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Camera, label: 'Cameras', href: '/dashboard/cameras' },
  { icon: Users, label: 'Members', href: '/dashboard/members' },
  { icon: ShieldAlert, label: 'Alerts', href: '/dashboard/alerts' },
  { icon: Search, label: 'Search', href: '/search' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-400">Exo-Oort</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center space-x-3 px-4 py-3 w-full text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
          <Settings className="h-5 w-5" />
          <span className="font-medium">Settings</span>
        </button>
        <button className="flex items-center space-x-3 px-4 py-3 w-full text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-2">
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}
