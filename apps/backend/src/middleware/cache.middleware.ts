import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { redisService } from '../services/redis.service.js';
import { config } from '../config/index.js';

interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
  keyPrefix?: string;
  skipCache?: (req: Request) => boolean;
}

const useRedis = config.session.redisEnabled && redisService.isReady();

export function cacheMiddleware(options: CacheOptions = {}) {
  const { ttl = 300, keyPrefix = 'cache', skipCache } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache if skipCache function returns true
    if (skipCache && skipCache(req)) {
      return next();
    }

    const cacheKey = `${keyPrefix}:${req.originalUrl}`;

    try {
      if (useRedis) {
        // Try to get from Redis
        const cached = await redisService.get<any>(cacheKey);
        if (cached) {
          logger.debug(`Cache hit: ${cacheKey}`);
          res.setHeader('X-Cache', 'HIT');
          return res.json(cached);
        }
      }

      // Cache miss - proceed to handler
      logger.debug(`Cache miss: ${cacheKey}`);
      res.setHeader('X-Cache', 'MISS');

      // Monkey-patch res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        // Cache the response
        if (useRedis && res.statusCode === 200) {
          redisService.set(cacheKey, data, ttl).catch((err) => {
            logger.error(`Failed to cache response for ${cacheKey}:`, err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error, proceeding without cache:', error);
      next();
    }
  };
}

export function invalidateCache(pattern: string): void {
  if (!useRedis) return;
  redisService.delPattern(pattern).catch((err) => {
    logger.error(`Failed to invalidate cache pattern ${pattern}:`, err);
  });
}

export function clearCacheForUrl(url: string): void {
  if (!useRedis) return;
  const key = `cache:${url}`;
  redisService.del(key).catch((err) => {
    logger.error(`Failed to clear cache for ${url}:`, err);
  });
}
