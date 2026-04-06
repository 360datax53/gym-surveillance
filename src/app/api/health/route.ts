import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const info = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT || 'not set',
      PORT: process.env.PORT || 'not set',
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    nextjsVersion: '14.2.35',
  };

  return NextResponse.json(info);
}
