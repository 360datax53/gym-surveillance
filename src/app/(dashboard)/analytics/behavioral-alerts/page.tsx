'use client'

import { useState, useEffect } from 'react'

interface BehavioralAlert {
  id: string
  pattern_type: string
  severity: string
  location: string
  description: string
  created_at: string
  resolved: boolean
  members?: { name: string; email: string; membership_status: string }
}

export default function BehavioralAlertsPage() {
  const [alerts, setAlerts] = useState<BehavioralAlert[]>([])
  const [severity, setSeverity] = useState<string>('all')
  const [resolved, setResolved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [severity, resolved])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      let url = '/api/analytics/behavioral-alerts?'
      if (severity !== 'all') url += `severity=${severity}&`
      url += `resolved=${resolved}`

      const response = await fetch(url)
      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (alertId: string) => {
    try {
      await fetch('/api/analytics/behavioral-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId, resolved: true, notes: 'Incident verified and cleared by staff.' })
      })
      fetchAlerts()
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const getSeverityBadge = (sev: string) => {
    const configs: Record<string, { bg: string, text: string, ring: string }> = {
      high: { bg: 'bg-red-500', text: 'text-white', ring: 'ring-red-100' },
      medium: { bg: 'bg-orange-500', text: 'text-white', ring: 'ring-orange-100' },
      low: { bg: 'bg-yellow-400', text: 'text-gray-900', ring: 'ring-yellow-50' }
    }
    const config = configs[sev] || { bg: 'bg-gray-500', text: 'text-white', ring: 'ring-gray-100' }
    
    return (
      <span className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-sm ring-4 ${config.ring}`}>
        {sev}
      </span>
    )
  }

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'loitering': return '⏱️'
      case 'theft_attempt': return '🚨'
      case 'unusual_path': return '🚩'
      default: return '📌'
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span role="img" aria-label="alerts">🛡️</span> Behavioral Security Intelligence
        </h1>
        <p className="text-gray-500 mt-2">Manage security incidents detected through AI movement pattern analysis.</p>
      </div>

      {/* Filters Hub */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Severity Tier</p>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="bg-gray-50 border-none rounded-lg py-2 px-3 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px] cursor-pointer"
            >
              <option value="all">All Risktiers</option>
              <option value="high">Critical Risk</option>
              <option value="medium">Moderate Risk</option>
              <option value="low">Potential Risk</option>
            </select>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Case Status</p>
            <div className="flex bg-gray-50 p-1 rounded-lg">
              <button
                onClick={() => setResolved(false)}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${!resolved ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setResolved(true)}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${resolved ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}
              >
                Resolved
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={fetchAlerts}
          className="text-gray-400 hover:text-blue-600 transition-colors p-2"
          title="Refresh Feed"
        >
          🔄
        </button>
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-500 font-medium tracking-tight">Accessing security logs...</p>
        </div>
      ) : alerts.length > 0 ? (
        <div className="grid gap-6">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white p-8 rounded-3xl border-l-[12px] border-y border-r border-gray-200 shadow-sm transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2 ${
                alert.severity === 'high' ? 'border-l-red-500' : alert.severity === 'medium' ? 'border-l-orange-500' : 'border-l-yellow-400'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    {getSeverityBadge(alert.severity)}
                    <span className="text-gray-300 font-light">|</span>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                       {getPatternIcon(alert.pattern_type)} {alert.pattern_type.replace('_', ' ').toUpperCase()}
                    </h3>
                  </div>
                  
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <p className="text-gray-700 font-medium leading-relaxed">{alert.description}</p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-300 uppercase italic">Anomaly Point</p>
                      <p className="text-sm font-bold text-gray-600">Gym Zone: {alert.location}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-300 uppercase italic">Timestamp</p>
                      <p className="text-sm font-bold text-gray-600 truncate">{new Date(alert.created_at).toLocaleString()}</p>
                    </div>
                    {alert.members && (
                      <div className="lg:col-span-2 space-y-1">
                        <p className="text-[10px] font-bold text-gray-300 uppercase italic">Linked Subject</p>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600">
                            {alert.members.name.charAt(0)}
                          </div>
                          <p className="text-sm font-bold text-blue-600 underline cursor-pointer">{alert.members.name}</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${alert.members.membership_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {alert.members.membership_status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {!alert.resolved && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="w-full md:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl text-sm font-black uppercase tracking-tighter hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-900/10"
                  >
                    Resolve Incident
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white py-32 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-6">🛡️</div>
          <h3 className="text-xl font-bold text-gray-400 italic">Clear Skies: No Anomalies Detected</h3>
          <p className="text-gray-400 max-w-sm mt-2 font-medium">All behavioral tracking logs are within normal parameters. No pending behavioral alerts for the selected criteria.</p>
        </div>
      )}
    </div>
  )
}
