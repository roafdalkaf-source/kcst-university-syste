import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const start = Date.now();
  try {
    const supabase = createClient();
    const { error } = await supabase.from('app_settings').select('key').limit(1).single();
    const dbOk  = !error;
    const dbMs  = Date.now() - start;
    return NextResponse.json({
      status:    dbOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version:   process.env.npm_package_version ?? '1.0.0',
      checks: {
        database: { status: dbOk ? 'ok' : 'error', latency_ms: dbMs },
        email:    { status: process.env.RESEND_API_KEY ? 'configured' : 'disabled' },
      },
    }, { status: dbOk ? 200 : 503 });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 503 });
  }
}
