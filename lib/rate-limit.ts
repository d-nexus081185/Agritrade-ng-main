// Minimal fixed-window rate limiter kept in process memory.
// Good enough for a single server; use Redis or similar when running several instances.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (bucket.count >= limit) return { allowed: false, retryAfterMs: bucket.resetAt - now };
  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
