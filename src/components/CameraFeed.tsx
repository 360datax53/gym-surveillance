'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

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
  const [streamActive, setStreamActive] = useState(false)
  const frameImageRef = useRef<HTMLImageElement | null>(null)

  // Poll individual JPEG snapshots instead of persistent MJPEG streams
  // This avoids Chrome's 6-connection-per-domain limit entirely
  useEffect(() => {
    if (camera.status !== 'online') return

    let cancelled = false
    let timeoutId: NodeJS.Timeout

    const fetchSnapshot = async () => {
      if (cancelled) return

      try {
        const hostname = typeof window !== 'undefined' 
          ? (localStorage.getItem('ai_service_host') || window.location.hostname) 
          : 'localhost';
        const aiServiceUrl = `http://${hostname}:5005`;
        const res = await fetch(`${aiServiceUrl}/api/snapshot/${camera.id}`, {
          cache: 'no-store'
        })

        if (res.ok && res.status === 200) {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)

          // Create or reuse image element
          if (!frameImageRef.current) {
            frameImageRef.current = new Image()
          }
          
          const img = frameImageRef.current
          const oldUrl = img.src

          img.onload = () => {
            setStreamActive(true)
            // Revoke old URL to free memory
            if (oldUrl && oldUrl.startsWith('blob:')) {
              URL.revokeObjectURL(oldUrl)
            }
          }
          img.src = url
        }
      } catch (e) {
        // Silent - AI service might not be ready yet
      }

      // Schedule next frame (5 FPS = 200ms between frames)
      if (!cancelled) {
        timeoutId = setTimeout(fetchSnapshot, 200)
      }
    }

    // Stagger start times so not all cameras fetch simultaneously
    const staggerDelay = (camera.id.charCodeAt(0) % 14) * 50
    timeoutId = setTimeout(fetchSnapshot, staggerDelay)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      // Cleanup blob URLs
      if (frameImageRef.current?.src?.startsWith('blob:')) {
        URL.revokeObjectURL(frameImageRef.current.src)
      }
    }
  }, [camera.id, camera.status])

  // Poll for AI detections
  useEffect(() => {
    if (!streamActive) return

    const pollDetections = async () => {
      try {
        const hostname = typeof window !== 'undefined' 
          ? (localStorage.getItem('ai_service_host') || window.location.hostname) 
          : 'localhost';
        const aiServiceUrl = `http://${hostname}:5005`;
        const res = await fetch(`${aiServiceUrl}/api/detections/${camera.id}`)
        if (res.ok) {
          const data = await res.json()
          setDetections(data.detections || [])

          if (data.detections && data.detections.length > 0) {
            // Check if any detection contains a legitimate face match
            const matchedDet = data.detections.find((d: any) => d.matched_name)
            if (matchedDet) {
              setMatchedMember({
                name: matchedDet.matched_name,
                confidence: Math.round(matchedDet.match_confidence * 100),
                membership_status: "Verified Match"
              })
            } else {
              setMatchedMember(null)
            }
          } else {
            setMatchedMember(null)
          }
        }
      } catch (e) {
        // Silent
      }
    }

    const interval = setInterval(pollDetections, 1000)
    return () => clearInterval(interval)
  }, [camera.id, streamActive])

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let animationId: number

    const render = () => {
      const img = frameImageRef.current

      // Draw the latest snapshot frame
      if (img && img.complete && img.naturalWidth > 0 && streamActive) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      } else {
        // Offline look
        ctx.fillStyle = '#111'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'rgba(0, 255, 0, 0.02)'
        for (let i = 0; i < canvas.height; i += 4) {
          ctx.fillRect(0, i, canvas.width, 1)
        }
      }

      // Draw AI detection boxes
      // Green = face detected, Yellow = person/body detected (overhead camera)
      detections.forEach((det: any) => {
        const x = det.x * canvas.width
        const y = det.y * canvas.height
        const w = det.width * canvas.width
        const h = det.height * canvas.height
        const isFace = det.type === 'face' || !det.type

        ctx.strokeStyle = isFace ? '#00ff00' : '#ffcc00'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, w, h)

        // Label background
        ctx.fillStyle = isFace ? 'rgba(0,255,0,0.75)' : 'rgba(255,204,0,0.75)'
        ctx.fillRect(x, y - 20, Math.min(110, w), 20)
        ctx.fillStyle = 'black'
        ctx.font = 'bold 11px Inter, sans-serif'
        ctx.fillText(`${isFace ? 'FACE' : 'PERSON'} ${Math.round(det.confidence * 100)}%`, x + 4, y - 5)
      })

      // Member match overlay
      if (matchedMember) {
        ctx.fillStyle = '#00e676'
        ctx.font = 'bold 18px monospace'
        ctx.fillText(`✓ MEMBER: ${matchedMember.name.toUpperCase()}`, 30, 50)
      }

      animationId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animationId)
  }, [detections, matchedMember, streamActive])

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-mono, monospace)' }}>
      <div style={{ position: 'relative', width: '100%', height: '320px', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: '#000' }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ background: matchedMember ? '#00c853' : streamActive ? '#da291c' : '#555', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em' }}>
            {matchedMember ? '✓ VERIFIED' : streamActive ? 'ANALYZING...' : 'CONNECTING...'}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid #333', color: '#00e676', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
            {detections.length} FACES DETECTED
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '20px', left: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '10px', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          LIVE // {camera.name} // {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
