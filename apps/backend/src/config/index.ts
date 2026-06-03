import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  env: optionalEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  port: parseInt(optionalEnv('PORT', '4000'), 10),
  apiVersion: optionalEnv('API_VERSION', 'v1'),
  appUrl: optionalEnv('APP_URL', 'http://localhost:4000'),
  frontendUrl: optionalEnv('FRONTEND_URL', 'http://localhost:5173'),

  db: {
    url: requireEnv('DATABASE_URL'),
    poolMax: parseInt(optionalEnv('DATABASE_POOL_MAX', '20'), 10),
    poolMin: parseInt(optionalEnv('DATABASE_POOL_MIN', '2'), 10),
  },

  redis: {
    url: optionalEnv('REDIS_URL', 'redis://localhost:6379'),
    ttl: parseInt(optionalEnv('REDIS_TTL_SECONDS', '3600'), 10),
  },

  jwt: {
    secret: optionalEnv('JWT_SECRET', 'dev-secret-change-in-production-min-32-chars'),
    refreshSecret: optionalEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
    accessExpiresIn: optionalEnv('JWT_ACCESS_EXPIRES_IN', '7d'),
    refreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  otp: {
    expiryMinutes: parseInt(optionalEnv('OTP_EXPIRY_MINUTES', '10'), 10),
    length: parseInt(optionalEnv('OTP_LENGTH', '6'), 10),
  },

  whatsapp: {
    phoneNumberId: optionalEnv('WHATSAPP_PHONE_NUMBER_ID', ''),
    accessToken: optionalEnv('WHATSAPP_ACCESS_TOKEN', ''),
    verifyToken: optionalEnv('WHATSAPP_VERIFY_TOKEN', 'festac-verify-token'),
    appId: optionalEnv('WHATSAPP_APP_ID', ''),
    appSecret: optionalEnv('WHATSAPP_APP_SECRET', ''),
    apiVersion: 'v19.0',
  },

  twilio: {
    accountSid: optionalEnv('TWILIO_ACCOUNT_SID', ''),
    auth_token: optionalEnv('TWILIO_AUTH_TOKEN', ''),
    whatsappNumber: optionalEnv('TWILIO_WHATSAPP_NUMBER', ''),
    webhookUrl: optionalEnv('TWILIO_WEBHOOK_URL', ''),
    webhookSecret: optionalEnv('TWILIO_WEBHOOK_SECRET', ''),
    messageQueueEnabled: optionalEnv('TWILIO_MESSAGE_QUEUE_ENABLED', 'true') === 'true',
    rateLimitEnabled: optionalEnv('TWILIO_RATE_LIMIT_ENABLED', 'true') === 'true',
    rateLimitMaxPerMinute: parseInt(optionalEnv('TWILIO_RATE_LIMIT_MAX_PER_MINUTE', '60'), 10),
    rateLimitMaxPerHour: parseInt(optionalEnv('TWILIO_RATE_LIMIT_MAX_PER_HOUR', '1000'), 10),
    costControlEnabled: optionalEnv('TWILIO_COST_CONTROL_ENABLED', 'true') === 'true',
    fallbackEnabled: optionalEnv('TWILIO_FALLBACK_ENABLED', 'true') === 'true',
    fallbackProvider: optionalEnv('TWILIO_FALLBACK_PROVIDER', 'facebook'),
  },

  openai: {
    apiKey: optionalEnv('OPENAI_API_KEY', ''),
    model: optionalEnv('OPENAI_MODEL', 'gpt-4o-mini'),
    maxTokens: parseInt(optionalEnv('OPENAI_MAX_TOKENS', '500'), 10),
  },

  storage: {
    provider: optionalEnv('STORAGE_PROVIDER', 'local') as 'local' | 'aws' | 'cloudinary',
    aws: {
      region: optionalEnv('AWS_REGION', 'eu-west-1'),
      accessKeyId: optionalEnv('AWS_ACCESS_KEY_ID', ''),
      secretAccessKey: optionalEnv('AWS_SECRET_ACCESS_KEY', ''),
      bucket: optionalEnv('AWS_S3_BUCKET', 'discover-festac-media'),
    },
    localUploadDir: path.resolve(process.cwd(), 'uploads'),
  },

  rateLimit: {
    windowMs: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    max: parseInt(optionalEnv('RATE_LIMIT_MAX', '100'), 10),
  },

  cors: {
    origins: optionalEnv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000')
      .split(',')
      .map((o) => o.trim()),
  },

  log: {
    level: optionalEnv('LOG_LEVEL', 'debug'),
    file: optionalEnv('LOG_FILE', 'logs/app.log'),
  },

  isDev: optionalEnv('NODE_ENV', 'development') === 'development',
  isProd: process.env['NODE_ENV'] === 'production',
  isTest: process.env['NODE_ENV'] === 'test',
} as const;
