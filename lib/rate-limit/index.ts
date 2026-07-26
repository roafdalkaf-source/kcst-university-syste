/**
 * Rate Limiter — In-memory (كافي لـ single instance)
 * للإنتاج الكامل: استخدم Redis عبر Upstash
 */

interface RateLimitEntry { count: number; resetAt: number; }
const store = new Map<string, RateLimitEntry>();

// Cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  success:   boolean;
  remaining: number;
  resetIn:   number; // seconds
}

export function rateLimit(
  identifier: string,
  { max = 10, windowMs = 60_000 }: { max?: number; windowMs?: number } = {}
): RateLimitResult {
  const now  = Date.now();
  const key  = identifier;
  let entry  = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;
  const remaining = Math.max(0, max - entry.count);
  const resetIn   = Math.ceil((entry.resetAt - now) / 1000);

  return { success: entry.count <= max, remaining, resetIn };
}

// Pre-configured limiters
export const authLimiter     = (ip: string) => rateLimit(`auth:${ip}`,     { max: 5,   windowMs: 15 * 60_000 }); // 5/15min
export const apiLimiter      = (ip: string) => rateLimit(`api:${ip}`,      { max: 100, windowMs: 60_000 });       // 100/min
export const uploadLimiter   = (ip: string) => rateLimit(`upload:${ip}`,   { max: 20,  windowMs: 60_000 });       // 20/min
export const emailLimiter    = (ip: string) => rateLimit(`email:${ip}`,    { max: 3,   windowMs: 60 * 60_000 });  // 3/hour
export const searchLimiter   = (ip: string) => rateLimit(`search:${ip}`,   { max: 30,  windowMs: 60_000 });       // 30/min
