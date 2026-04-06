# Gym Surveillance App

A Next.js 14 application for gym surveillance and analytics using Supabase, OpenAI, and Resend, with a Python-based AI service for real-time face detection and recognition.

## Architecture

- **Frontend**: Next.js 14 (App Router) with TypeScript, Tailwind CSS
- **Auth & Database**: Supabase (Postgres + Auth)
- **AI Service**: Python Flask API with YOLO face detection + DeepFace recognition
- **AI (Text)**: OpenAI API
- **Email**: Resend
- **Charts**: Recharts
- **State**: Zustand + SWR

## Project Structure

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — Reusable React components
- `src/lib/` — Supabase clients, auth helpers, utilities
- `src/context/` — React context providers
- `src/hooks/` — Custom React hooks
- `ai_service/` — Python AI service (face detection, recognition, RTSP processing)
- `supabase/` — Supabase migrations and config
- `scripts/` — Utility scripts

## Workflows

| Workflow | Port | Command |
|----------|------|---------|
| Start application | 5000 | `npm run dev` |
| AI Service | 8000 | `cd ai_service && python app.py` |

## AI Service Details

The AI service (Flask on port 8000) provides:
- `/api/detect-face` — Face detection via YOLOv8
- `/api/encode-face` — Face encoding via DeepFace (Facenet)
- `/api/process-rtsp` — Start RTSP stream processing for a camera
- `/api/stop-rtsp` — Stop RTSP stream processing
- `/api/detections/<camera_id>` — Get latest detections for a camera
- `/api/snapshot/<camera_id>` — Get a JPEG snapshot from a camera
- `/api/stream/<camera_id>` — MJPEG stream from a camera
- `/health` — Health check

## Required Environment Variables

Set these as Replit Secrets:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `RESEND_API_KEY` | Resend API key for email |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app |
| `CRON_SECRET` | Secret for protecting cron job endpoints |
| `RTSP_USERNAME` | (Optional) RTSP camera username |
| `RTSP_PASSWORD` | (Optional) RTSP camera password |
| `RTSP_HOST` | (Optional) RTSP camera host |

## Migration Notes

- Next.js dev/start scripts bind to `0.0.0.0:5000`
- AI service port changed from 5005 to 8000 (Replit-supported port)
- All internal API calls updated from port 5005 to 8000
- AI host auto-discovery uses `REPLIT_DEV_DOMAIN` on Replit
- OpenCV uses headless version (no GUI dependencies needed)
- YOLO model files stored in `ai_service/` directory
