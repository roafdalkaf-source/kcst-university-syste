import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './index';

export function withRateLimit(
  req: NextRequest,
  options: { max?: number; windowMs?: number } = {}
): NextResponse | null {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? '127.0.0.1';

  const result = rateLimit(ip, options);

  if (!result.success) {
    return NextResponse.json(
      { error: 'طلبات كثيرة جداً. حاول مرة أخرى لاحقاً.', resetIn: result.resetIn },
      {
        status: 429,
        headers: {
          'Retry-After':           String(result.resetIn),
          'X-RateLimit-Remaining': String(result.remaining),
        },
      }
    );
  }
  return null; // OK — continue
}
