type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_AUTH_ATTEMPTS = 8;
const MAX_EXTRACT_ATTEMPTS = 20;

function consumeAttempt(
  key: string,
  maxAttempts: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= maxAttempts) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function consumeAuthAttempt(key: string): { allowed: boolean; retryAfterSeconds: number } {
  return consumeAttempt(key, MAX_AUTH_ATTEMPTS);
}

export function consumeExtractAttempt(key: string): { allowed: boolean; retryAfterSeconds: number } {
  return consumeAttempt(key, MAX_EXTRACT_ATTEMPTS);
}
