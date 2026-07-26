import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_PATHS = [
  '/auth/login', '/auth/signup', '/auth/callback',
  '/auth/forgot-password', '/auth/reset-password',
  '/api/health', '/_next', '/favicon.ico', '/fonts', '/images',
];

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? '127.0.0.1';
}

// Simple in-memory rate limit for auth routes (5 attempts / 15min per IP)
const authAttempts = new Map<string, { count: number; resetAt: number }>();

function checkAuthRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `auth:${ip}`;
  let entry = authAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + 15 * 60_000 };
    authAttempts.set(key, entry);
  }
  entry.count++;
  return entry.count <= 20; // allow 20 attempts per 15min
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Security headers
  const secHeaders = new Headers();
  secHeaders.set('X-Content-Type-Options', 'nosniff');
  secHeaders.set('X-Frame-Options', 'DENY');
  secHeaders.set('X-XSS-Protection', '1; mode=block');
  secHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  secHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Allow public paths
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
    const res = NextResponse.next();
    secHeaders.forEach((v, k) => res.headers.set(k, v));
    return res;
  }

  // Rate limit auth endpoints
  if (path.startsWith('/auth/')) {
    const ip = getIp(req);
    if (!checkAuthRateLimit(ip)) {
      return NextResponse.json(
        { error: 'طلبات كثيرة جداً. حاول بعد 15 دقيقة.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }
  }

  // Join request allowed for authenticated only
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = new URL('/auth/login', req.url);
    if (path !== '/') url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  // Add security headers to all responses
  secHeaders.forEach((v, k) => res.headers.set(k, v));
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts|images|api/health).*)'],
};
