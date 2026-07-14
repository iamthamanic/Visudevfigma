/**
 * In-memory sliding-window rate limit for sensitive local-engine routes.
 */

const hitsByKey = new Map<string, number[]>();
const MAX_RATE_LIMIT_KEYS = 256;

function pruneRateLimitStore(now: number, windowMs: number): void {
  for (const [key, timestamps] of hitsByKey.entries()) {
    const recent = timestamps.filter((timestamp) => now - timestamp < windowMs);
    if (recent.length === 0) hitsByKey.delete(key);
    else hitsByKey.set(key, recent);
  }
  while (hitsByKey.size > MAX_RATE_LIMIT_KEYS) {
    const oldestKey = hitsByKey.keys().next().value;
    if (!oldestKey) break;
    hitsByKey.delete(oldestKey);
  }
}

export function checkRateLimit(key: string, windowMs: number, maxHits: number): boolean {
  const now = Date.now();
  pruneRateLimitStore(now, windowMs);

  const recent = (hitsByKey.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= maxHits) {
    hitsByKey.set(key, recent);
    return false;
  }

  recent.push(now);
  hitsByKey.set(key, recent);
  return true;
}

export function resetRateLimitsForTests(): void {
  hitsByKey.clear();
}
