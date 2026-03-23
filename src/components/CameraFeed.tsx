'use client'

import { useState, useRef, useEffect } from 'react'

interface Detection {
  x: number
  y: number
  width: number
  height: number
  confidence: number
}

interface Camera {
  id: string;
  status: string;
  name: string;
}

export default function CameraFeed({ camera }: { camera: Camera }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [detections, setDetections] = useState<Detection[]>([])

  useEffect(() => {
    if (!canvasRef.current || camera.status !== 'online') return

    // Simulated camera stream logic
    // In a real scenario, this would poll the /api/camera-stream endpoint with frames
    const interval = setInterval(async () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Draw black background (placeholder for real video frame)
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Add a subtle scanline effect for "CCTV" feel
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
        for (let i = 0; i < canvas.height; i += 4) {
          ctx.fillRect(0, i, canvas.width, 1)
        }

        // Draw detected faces
        detections.forEach((detection) => {
          // Glow effect for bounding boxes
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00ff00';
          ctx.strokeStyle = '#00ff00'
          ctx.lineWidth = 2
          ctx.strokeRect(
            detection.x,
            detection.y,
            detection.width,
            detection.height
          )
          
          ctx.shadowBlur = 0; // Reset shadow

          // Draw confidence label with background
          const label = `${(detection.confidence * 100).toFixed(0)}% CONFIDENCE`
          ctx.font = 'bold 12px IBM Plex Mono, monospace'
          const textWidth = ctx.measureText(label).width
          
          ctx.fillStyle = '#00ff00'
          ctx.fillRect(detection.x, detection.y - 20, textWidth + 10, 20)
          
          ctx.fillStyle = '#000'
          ctx.fillText(label, detection.x + 5, detection.y - 5)
        })
      }
    }, 100); // 10fps for smooth UI updates

    return () => clearInterval(interval)
  }, [detections, camera.status])

  return (
    <div style={{ position: 'relative', width: '100%', height: '180px', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={320}
        height={180}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      
      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{ width: '8px', height: '8px', background: '#ff0000', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
        <span style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Live Stream
        </span>
      </div>

      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: '#00ff00',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontFamily: 'monospace',
        border: '1px solid #00ff00'
      }}>
        {detections.length} FACES
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
