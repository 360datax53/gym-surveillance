'use client'

import { useState, useRef, useEffect } from 'react'

interface Detection {
  x: number
  y: number
  width: number
  height: number
  confidence: number
}

interface MatchedMember {
  name: string
  membership_status: string
  confidence: number
}

interface CameraFeedProps {
  camera: {
    id: string
    name: string
    camera_id: string
    status: string
    rtsp_url?: string
  }
  organizationId: string
}

export default function CameraFeed({ camera, organizationId }: CameraFeedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [matchedMember, setMatchedMember] = useState<MatchedMember | null>(null)
  const [isUnknown, setIsUnknown] = useState(false)

  useEffect(() => {
    if (!canvasRef.current || camera.status !== 'online') return

    const interval = setInterval(async () => {
      try {
        // Mocking the detection flow for UI demonstration
        const fakeDetection = {
          x: 180,
          y: 120,
          width: 140,
          height: 180,
          confidence: 0.85 + Math.random() * 0.1
        }

        setDetections([fakeDetection])

        // Mocking the /api/members/match-face result
        // 80% chance match, 20% unknown
        if (Math.random() > 0.2) {
          setMatchedMember({
            name: 'John Doe',
            membership_status: 'active',
            confidence: 0.90 + Math.random() * 0.08
          })
          setIsUnknown(false)
        } else {
          setMatchedMember(null)
          setIsUnknown(true)
        }
      } catch (error) {
        console.error('Detection cycle error:', error)
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [camera.status])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw CCTV "No Signal" or Black Screen
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add Scanline effect
    ctx.fillStyle = 'rgba(0, 255, 0, 0.05)'
    for (let i = 0; i < canvas.height; i += 4) {
      ctx.fillRect(0, i, canvas.width, 1)
    }

    // Grid System
    ctx.strokeStyle = 'rgba(0, 255, 100, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }

    detections.forEach((detection) => {
      const color = isUnknown ? '#ff3d00' : '#00e676'
      
      // Bounding Box Corners (Premium Look)
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      const { x, y, width: w, height: h } = detection
      
      // Top Left
      ctx.beginPath(); ctx.moveTo(x, y + 20); ctx.lineTo(x, y); ctx.lineTo(x + 20, y); ctx.stroke()
      // Top Right
      ctx.beginPath(); ctx.moveTo(x + w - 20, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + 20); ctx.stroke()
      // Bottom Left
      ctx.beginPath(); ctx.moveTo(x, y + h - 20); ctx.lineTo(x, y + h); ctx.lineTo(x + 20, y + h); ctx.stroke()
      // Bottom Right
      ctx.beginPath(); ctx.moveTo(x + w - 20, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - 20); ctx.stroke()

      // Fill subtle glow
      ctx.fillStyle = color === '#ff3d00' ? 'rgba(255, 61, 0, 0.1)' : 'rgba(0, 230, 118, 0.1)'
      ctx.fillRect(x, y, w, h)

      // Confidence Label
      ctx.fillStyle = color
      ctx.font = 'bold 12px monospace'
      ctx.fillText(`${(detection.confidence * 100).toFixed(1)}% CONFIDENCE`, x, y - 8)
    })

    if (matchedMember) {
      ctx.fillStyle = '#00e676'
      ctx.font = 'bold 18px monospace'
      ctx.fillText(`✓ MEMBER: ${matchedMember.name.toUpperCase()}`, 30, 50)
    } else if (isUnknown) {
      ctx.fillStyle = '#ff3d00'
      ctx.font = 'bold 18px monospace'
      ctx.fillText('⚠ UNAUTHORIZED / UNKNOWN', 30, 50)
    }
  }, [detections, matchedMember, isUnknown])

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-mono, monospace)' }}>
      <div style={{ position: 'relative', width: '100%', height: '320px', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: '#000' }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        
        {/* Overlays */}
        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ background: isUnknown ? '#ff3d00' : matchedMember ? '#00c853' : '#1e88e5', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em' }}>
            {isUnknown ? '⚠️ ALERT' : matchedMember ? '✓ VERIFIED' : 'ANALYZING...'}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid #333', color: '#00e676', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
            {detections.length} FACES DETECTED
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '20px', left: '20px', color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
          LIVE // {camera.camera_id} // {new Date().toLocaleTimeString()}
        </div>
      </div>

      {matchedMember && (
        <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'rgba(0, 200, 83, 0.1)', border: '1px solid rgba(0, 200, 83, 0.2)', borderRadius: '12px', color: '#00c853' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '15px', fontWeight: 800, textTransform: 'uppercase' }}>Identity Verified</h4>
              <p style={{ margin: '0', fontSize: '14px', fontWeight: 600, color: '#fff' }}>{matchedMember.name}</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '12px', opacity: 0.8 }}>Status: {matchedMember.membership_status.toUpperCase()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>{(matchedMember.confidence * 100).toFixed(0)}%</div>
              <div style={{ fontSize: '9px', fontWeight: 700, opacity: 0.6 }}>MATCH CONFIDENCE</div>
            </div>
          </div>
        </div>
      )}

      {isUnknown && detections.length > 0 && (
        <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'rgba(255, 61, 0, 0.1)', border: '1px solid rgba(255, 61, 0, 0.2)', borderRadius: '12px', color: '#ff3d00' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '15px', fontWeight: 800, textTransform: 'uppercase' }}>Unknown Detection</h4>
          <p style={{ margin: '0', fontSize: '13px', lineHeight: '1.5' }}>Unrecognized face in restricted zone. Verification failed.</p>
          <div style={{ marginTop: '0.75rem', fontSize: '10px', fontWeight: 700, padding: '4px 8px', background: 'rgba(255, 61, 0, 0.2)', borderRadius: '4px', display: 'inline-block' }}>
            PROTOCOL: ALERT SENT
          </div>
        </div>
      )}
    </div>
  )
}
