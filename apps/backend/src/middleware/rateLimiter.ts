import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { config } from '../config/index.js';
import { ERROR_CODES } from '@discover-smes/shared';
import { redisService } from '../services/redis.service.js';

const rateLimitResponse = (code: string, message: string) => ({
  success: false,
  error: { code, message },
});

const redisClient = redisService.getClient();
const useRedis = config.session.redisEnabled && redisClient !== null;

const createRedisStore = (prefix: string) =>
  useRedis
    ? new RedisStore({
        sendCommand: async (...args: [string, ...Array<string | number>]) => {
          const result = await redisClient!.call(...args);
          return result as any;
        },
        prefix,
      })
    : undefined;

export const globalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('rl:global:'),
  message: rateLimitResponse(
    'RATE_LIMIT_EXCEEDED',
    'Too many requests. Please try again later.',
  ),
  skip: (req) => config.isDev && req.ip === '::1',
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  store: createRedisStore('rl:auth:'),
  message: rateLimitResponse(
    'AUTH_RATE_LIMIT',
    'Too many authentication attempts. Please wait 15 minutes.',
  ),
});

export const otpRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  store: createRedisStore('rl:otp:'),
  message: rateLimitResponse('OTP_RATE_LIMIT', 'Too many OTP requests. Please wait 1 hour.'),
  keyGenerator: (req) => req.body?.phone ?? req.ip ?? 'unknown',
});

export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  store: createRedisStore('rl:search:'),
  message: rateLimitResponse('RATE_LIMIT_EXCEEDED', 'Search rate limit exceeded.'),
});

export const whatsappRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  store: createRedisStore('rl:whatsapp:'),
  message: rateLimitResponse('WHATSAPP_RATE_LIMIT', 'WhatsApp webhook rate limit exceeded.'),
});
