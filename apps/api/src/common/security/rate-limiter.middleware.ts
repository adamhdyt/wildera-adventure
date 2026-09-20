import type { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const hits = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired records every 5 minutes
const cleanupInterval = setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

export function clearRateLimitRecords() {
  hits.clear();
}

export interface RateLimiterOptions {
  windowMs?: number;
  maxAuth?: number;
  maxPublic?: number;
  skipInTest?: boolean;
}

export function rateLimiter(options?: RateLimiterOptions) {
  const windowMs = options?.windowMs ?? 60 * 1000;
  const maxAuth = options?.maxAuth ?? 20;
  const maxPublic = options?.maxPublic ?? 180;
  const skipInTest = options?.skipInTest ?? true;

  return (req: Request, res: Response, next: NextFunction) => {
    if (skipInTest && process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip =
      req.ip ||
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const isAuth = req.path.includes('/auth/login');
    const limit = isAuth ? maxAuth : maxPublic;
    const key = `${ip}:${isAuth ? 'auth' : 'general'}`;

    const now = Date.now();
    let record = hits.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > limit) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.',
        },
      });
    }

    next();
  };
}
