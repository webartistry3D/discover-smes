import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

interface RateLimitEntry {
  count: number;
  resetAt: Date;
}

// In-memory rate limit store (use Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

export function twilioRateLimiter(
  maxPerMinute: number = 60,
  maxPerHour: number = 1000
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!config.twilio.rateLimitEnabled) {
      return next();
    }

    const vendorId = (req as any).user?.vendorId || req.body?.vendorId || 'global';
    const now = new Date();
    const minuteKey = `${vendorId}:minute`;
    const hourKey = `${vendorId}:hour`;

    // Check minute limit
    let minuteEntry = rateLimitStore.get(minuteKey);
    if (!minuteEntry || minuteEntry.resetAt < now) {
      minuteEntry = { count: 0, resetAt: new Date(Date.now() + 60000) };
      rateLimitStore.set(minuteKey, minuteEntry);
    }

    if (minuteEntry.count >= maxPerMinute) {
      logger.warn('Rate limit exceeded (minute)', { vendorId });
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }
      });
    }

    // Check hour limit
    let hourEntry = rateLimitStore.get(hourKey);
    if (!hourEntry || hourEntry.resetAt < now) {
      hourEntry = { count: 0, resetAt: new Date(Date.now() + 3600000) };
      rateLimitStore.set(hourKey, hourEntry);
    }

    if (hourEntry.count >= maxPerHour) {
      logger.warn('Rate limit exceeded (hour)', { vendorId });
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Hourly limit exceeded' }
      });
    }

    // Increment counters
    minuteEntry.count++;
    hourEntry.count++;

    next();
  };
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = new Date();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute
