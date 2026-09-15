import "server-only";

type Bucket = { hits: number; resetAt: number };

/**
 * Per-instance throttling, matching the source app's RateLimiter windows.
 * Behind several instances each holds its own counters; move this to the
 * database or a shared cache before scaling horizontally.
 */
const buckets = new Map<string, Bucket>();

export function tooManyAttempts(key: string, max: number): boolean {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= Date.now()) return false;
  return bucket.hits >= max;
}

export function availableIn(key: string): number {
  const bucket = buckets.get(key);
  if (!bucket) return 0;
  return Math.max(0, Math.ceil((bucket.resetAt - Date.now()) / 1000));
}

export function hit(key: string, decaySeconds: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { hits: 1, resetAt: now + decaySeconds * 1000 });
    return;
  }
  bucket.hits += 1;
}

export function clear(key: string): void {
  buckets.delete(key);
}
