'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Menu } from 'lucide-react'

import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setIsAuthed(true)
        } else {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router])

  if (!isAuthed) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      {/* Mobile Header / Hamburger */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 z-20">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none">
          <Menu className="h-6 w-6" />
        </button>
        <span className="ml-4 font-bold text-gray-800">Snap Fitness</span>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-40`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto custom-scrollbar pt-16 md:pt-0">
        {children}
      </main>
    </div>
  )
}
