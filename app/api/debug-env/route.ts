import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    has_db_url: !!process.env.DATABASE_URL,
    has_gemini_key: !!process.env.GEMINI_API_KEY,
    has_cron_secret: !!process.env.CRON_SECRET,
    cron_secret_length: process.env.CRON_SECRET?.length || 0,
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
