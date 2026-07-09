import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { redisService } from '../services/redis.service.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const useRedis = config.session.redisEnabled && redisService.isReady();

export function twilioRateLimiter(
  maxPerMinute: number = 60,
  maxPerHour: number = 1000
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!config.twilio.rateLimitEnabled) {
      return next();
    }

    const vendorId = (req as any).user?.vendorId || req.body?.vendorId || 'global';
    const now = Date.now();
    const minuteKey = `twilio:rl:${vendorId}:minute`;
    const hourKey = `twilio:rl:${vendorId}:hour`;

    try {
      if (useRedis) {
        // Redis implementation
        const minuteCount = await redisService.incr(minuteKey, 60);
        if (minuteCount > maxPerMinute) {
          logger.warn('Rate limit exceeded (minute)', { vendorId });
          return res.status(429).json({
            success: false,
            error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }
          });
        }

        const hourCount = await redisService.incr(hourKey, 3600);
        if (hourCount > maxPerHour) {
          logger.warn('Rate limit exceeded (hour)', { vendorId });
          return res.status(429).json({
            success: false,
            error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Hourly limit exceeded' }
          });
        }
      } else {
        // Fallback to in-memory (production should use Redis)
        const memoryStore = (global as any).twilioRateLimitStore || new Map<string, RateLimitEntry>();
        (global as any).twilioRateLimitStore = memoryStore;

        const minuteEntry = memoryStore.get(minuteKey);
        if (!minuteEntry || minuteEntry.resetAt < now) {
          memoryStore.set(minuteKey, { count: 1, resetAt: now + 60000 });
        } else {
          minuteEntry.count++;
          if (minuteEntry.count > maxPerMinute) {
            logger.warn('Rate limit exceeded (minute)', { vendorId });
            return res.status(429).json({
              success: false,
              error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }
            });
          }
        }

        const hourEntry = memoryStore.get(hourKey);
        if (!hourEntry || hourEntry.resetAt < now) {
          memoryStore.set(hourKey, { count: 1, resetAt: now + 3600000 });
        } else {
          hourEntry.count++;
          if (hourEntry.count > maxPerHour) {
            logger.warn('Rate limit exceeded (hour)', { vendorId });
            return res.status(429).json({
              success: false,
              error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Hourly limit exceeded' }
            });
          }
        }
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error, allowing request', { error });
      next();
    }
  };
}
