interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT ?? "50", 10);

export function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  const resetAt = midnight.getTime();

  const record = store.get(userId);

  if (!record || record.resetAt <= now) {
    store.set(userId, { count: 1, resetAt });
    return { allowed: true, remaining: DAILY_LIMIT - 1, resetAt };
  }

  if (record.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  const remaining = DAILY_LIMIT - record.count;
  return { allowed: true, remaining, resetAt: record.resetAt };
}
