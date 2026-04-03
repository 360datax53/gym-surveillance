# Gym Surveillance App

A Next.js 14 application for gym surveillance and analytics using Supabase, OpenAI, and Resend.

## Architecture

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Auth & Database**: Supabase (Postgres + Auth)
- **AI**: OpenAI API
- **Email**: Resend
- **Charts**: Recharts
- **State**: Zustand + SWR

## Project Structure

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — Reusable React components
- `src/lib/` — Supabase clients, auth helpers, utilities
- `src/context/` — React context providers
- `src/hooks/` — Custom React hooks
- `supabase/` — Supabase migrations and config
- `scripts/` — Utility scripts
- `ai_service/` — AI-related service code

## Running the App

The app runs on port 5000 via `npm run dev`. The workflow "Start application" handles this automatically.

## Required Environment Variables

Set these as Replit Secrets:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `RESEND_API_KEY` | Resend API key for email |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (e.g. https://yourapp.replit.app) |
| `CRON_SECRET` | Secret for protecting cron job endpoints |

## Replit Migration Notes

- Dev and start scripts updated to bind to `0.0.0.0:5000` for Replit compatibility
- No instrumentation files were present
- Vercel cron jobs (`vercel.json`) are not supported on Replit — the `/api/analytics/heatmap-aggregate` endpoint would need an alternative scheduling mechanism if needed
