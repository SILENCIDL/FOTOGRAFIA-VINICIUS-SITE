import { LRUCache } from 'lru-cache';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const cache = new LRUCache<string, RateLimitEntry>({
  max: 10000,
  ttl: 60 * 60 * 1000, // 1h
});

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60 * 60 * 1000
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = cache.get(key);

  if (!entry || now > entry.resetAt) {
    cache.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { allowed: true, retryAfter: 0 };
}

export function rateLimitByIp(
  ip: string,
  action: string,
  maxRequests: number,
  windowMs?: number
): { allowed: boolean; retryAfter: number } {
  return checkRateLimit(`${ip}:${action}`, maxRequests, windowMs);
}
