'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Track {
  id: string
  zone: string
  entered_at: string
  exited_at?: string
  duration_seconds?: number
  camera_id: string
}

interface Member {
  id: string
  name: string
  email: string
  photo_url?: string
}

export default function TrackingPage() {
  const router = useRouter()
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members')
      const data = await response.json()
      setMembers(data.members || [])
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const handleSelectMember = async (member: Member) => {
    setSelectedMember(member)
    setLoading(true)

    try {
      const response = await fetch(`/api/tracking?member_id=${member.id}`)
      const data = await response.json()
      setTracks(data.tracks || [])
    } catch (error) {
      console.error('Error fetching tracks:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span role="img" aria-label="tracking">👥</span> Person Tracking & Path Audit
        </h1>
        <p className="text-gray-500 mt-2">Investigate individual movement patterns and zone transitions for security audits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Member Selection Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Select Subject</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelectMember(member)}
                className={`w-full p-4 flex items-center gap-3 rounded-xl transition-all ${
                  selectedMember?.id === member.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                  selectedMember?.id === member.id ? 'border-white/30 bg-blue-500' : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}>
                  {member.name.charAt(0)}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="font-bold text-sm truncate">{member.name}</p>
                  <p className={`text-xs truncate ${selectedMember?.id === member.id ? 'text-blue-100' : 'text-gray-400'}`}>
                    {member.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Path Analysis Main View */}
        <div className="lg:col-span-2 space-y-6">
          {selectedMember ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 border-4 border-white shadow-sm">
                    {selectedMember.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h2>
                    <p className="text-gray-500 font-medium">{selectedMember.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Subject Found</p>
                  <p className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 inline-block">LIVE TRACKING ACTIVE</p>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-500 font-medium">Reconstructing investigation path...</p>
                </div>
              ) : tracks.length > 0 ? (
                <div className="space-y-8 relative">
                  {/* Vertical Timeline Thread */}
                  <div className="absolute left-6 top-8 bottom-8 w-1 bg-gradient-to-b from-blue-500 via-blue-400 to-gray-200 rounded-full" />

                  {tracks.map((track, idx) => (
                    <div key={track.id} className="relative pl-16">
                      {/* Timeline Node */}
                      <div className="absolute left-[20px] top-4 w-3 h-3 bg-white border-2 border-blue-500 rounded-full shadow-[0_0_0_4px_rgba(59,130,246,0.1)] z-10" />
                      
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                              📍 {track.zone.replace('_', ' ').toUpperCase()}
                            </h4>
                            <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium">
                              <div className="flex items-center gap-1.5 text-gray-500">
                                <span className="text-blue-500">🕐</span> 
                                <span>Entered: {new Date(track.entered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                              </div>
                              {track.exited_at && (
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <span className="text-red-400">🕑</span>
                                  <span>Exited: {new Date(track.exited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {track.duration_seconds && (
                            <div className="bg-gray-900 text-white px-4 py-2 rounded-xl text-center">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Stay Duration</p>
                              <p className="text-lg font-bold">
                                {Math.floor(track.duration_seconds / 60)}<span className="text-xs text-blue-400 ml-0.5">m</span>
                                <span className="mx-1 text-gray-600">|</span>
                                {track.duration_seconds % 60}<span className="text-xs text-blue-400 ml-0.5">s</span>
                              </p>
                            </div>
                          )}
                        </div>
                        <p className="mt-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full" /> Inference Point: {track.camera_id}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Path Recap */}
                  <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl grayscale select-none pointer-events-none">📊</div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      Investigation Summary
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                        <p className="text-blue-200 text-[10px] font-bold uppercase tracking-wider">Total Zones</p>
                        <p className="text-2xl font-black mt-1">{tracks.length}</p>
                      </div>
                      <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 col-span-2">
                        <p className="text-blue-200 text-[10px] font-bold uppercase tracking-wider">Session Span</p>
                        <p className="text-lg font-black mt-1">
                          {new Date(tracks[0]?.entered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                          <span className="mx-2 text-blue-400">→</span>
                          {new Date(tracks[tracks.length - 1]?.exited_at || tracks[tracks.length - 1]?.entered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white py-20 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                  <div className="text-4xl mb-4">📍</div>
                  <h3 className="text-lg font-semibold text-gray-400">No Historical Path</h3>
                  <p className="text-gray-400 max-w-sm mt-1">This subject has no recorded movement tracks for the current audit cycle.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50/50 py-40 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl mb-6">🆔</div>
              <h3 className="text-xl font-bold text-gray-400 italic">Select an Identity to Begin Tracking</h3>
              <p className="text-gray-400 max-w-sm mt-2 font-medium">Choose a member from the sidebar to visualize their movement path and audit their zone transitions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
