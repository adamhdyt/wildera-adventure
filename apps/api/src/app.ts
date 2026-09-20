import 'reflect-metadata';
import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/app-logger.service';
import { securityHeaders } from './common/security/security-headers.middleware';
import { rateLimiter } from './common/security/rate-limiter.middleware';

export async function createApp() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(AppLogger));

  // Security Middleware
  app.use(securityHeaders());
  app.use(rateLimiter());

  // CORS Configuration
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (curl, server-side fetch, mobile apps)
      if (!origin) {
        return callback(null, true);
      }
      const allowed = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3100',
        'http://127.0.0.1:3100',
        'https://wildera.id',
        'https://staging.wildera.id',
      ];
      if (allowed.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      callback(new Error('CORS not allowed for origin: ' + origin));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Cookie',
      'X-Requested-With',
    ],
    exposedHeaders: [
      'Set-Cookie',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
    ],
  });

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.enableShutdownHooks();
  return app;
}
