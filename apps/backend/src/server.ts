import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { join } from 'path';

import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { globalRateLimit } from './middleware/rateLimiter.js';
import socketService from './services/socket.service.js';

async function bootstrap(): Promise<void> {
  const app = express();
  const httpServer = createServer(app);

  // ─── Socket.IO (Realtime) ────────────────────────────────
  socketService.initialize(httpServer, config.cors.origins[0]);

  // Make socketService accessible in routes
  app.set('socketService', socketService);

  // ─── Security Middleware ─────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: config.isProd,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || config.cors.origins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: ${origin} not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }),
  );

  // ─── Body Parsing ────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── Compression ─────────────────────────────────────────
  app.use(compression());

  // ─── Logging ─────────────────────────────────────────────
  if (config.isDev) {
    app.use(morgan('dev'));
  } else {
    app.use(
      morgan('combined', {
        stream: { write: (msg) => logger.http(msg.trim()) },
        skip: (req) => req.url === '/api/v1/health',
      }),
    );
  }

  // ─── Rate Limiting ───────────────────────────────────────
  app.use(globalRateLimit);

  // ─── Trust Proxy (for rate limiting behind NGINX) ────────
  if (config.isProd) app.set('trust proxy', 1);

  // ─── Request ID ──────────────────────────────────────────
  app.use((req, _res, next) => {
    req.headers['x-request-id'] ??= crypto.randomUUID();
    next();
  });

  // ─── Static Files (local dev) ─────────────────────────────
  if (config.storage.provider === 'local') {
    logger.info(`Serving static files from: ${config.storage.localUploadDir} at /uploads-static`);
    app.use('/uploads-static', express.static(config.storage.localUploadDir));
  }

  // ─── API Routes ──────────────────────────────────────────
  app.use(`/api/${config.apiVersion}`, apiRouter);

  // Root
  app.get('/', (_req, res) => {
    res.json({
      name: 'Discover SMEs API',
      version: '1.0.0',
      status: 'running',
      docs: `/api/${config.apiVersion}/health`,
    });
  });

  // ─── Error Handling ──────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  // ─── Database ────────────────────────────────────────────
  await connectDatabase();

  // ─── Cron Jobs ───────────────────────────────────────────
  const { startCronJobs } = await import('./utils/cron.js');
  startCronJobs();

  // ─── Start Server ────────────────────────────────────────
  httpServer.listen(config.port, () => {
    logger.info(`
🚀 Discover SMEs API
   Environment: ${config.env}
   Port:        ${config.port}
   API:         ${config.appUrl}/api/${config.apiVersion}
   Health:      ${config.appUrl}/api/${config.apiVersion}/health
    `);
  });

  // ─── Graceful Shutdown ───────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    httpServer.close(async () => {
      const { disconnectDatabase } = await import('./config/database.js');
      await disconnectDatabase();
      logger.info('Server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
