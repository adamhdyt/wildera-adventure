import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { catchError, finalize, throwError } from 'rxjs';
import type { RequestWithId } from './request-context';
import { AppLogger } from './app-logger.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = performance.now();
    let statusCode: number | undefined;
    let errorCode: string | undefined;

    return next.handle().pipe(
      catchError((error: unknown) => {
        statusCode = error instanceof HttpException ? error.getStatus() : 500;
        if (error instanceof HttpException) {
          const body = error.getResponse();
          if (typeof body === 'object' && body && 'code' in body) {
            errorCode = String(body.code);
          }
        }
        return throwError(() => error);
      }),
      finalize(() => {
        this.logger.request({
          request_id: request.requestId,
          method: request.method,
          path: request.originalUrl,
          status_code: statusCode ?? response.statusCode,
          duration_ms: Math.round((performance.now() - startedAt) * 100) / 100,
          ...(errorCode ? { error_code: errorCode } : {}),
        });
      }),
    );
  }
}
