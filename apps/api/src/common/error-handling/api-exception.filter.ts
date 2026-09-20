import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppLogger } from '../logger/app-logger.service';
import type { RequestWithId } from '../logger/request-context';

const defaultErrors: Partial<
  Record<number, { code: string; message: string }>
> = {
  [HttpStatus.BAD_REQUEST]: {
    code: 'BAD_REQUEST',
    message: 'Permintaan tidak valid.',
  },
  [HttpStatus.NOT_FOUND]: {
    code: 'RESOURCE_NOT_FOUND',
    message: 'Resource tidak ditemukan.',
  },
  [HttpStatus.SERVICE_UNAVAILABLE]: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Layanan sedang tidak tersedia.',
  },
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const supplied =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const suppliedBody =
      typeof supplied === 'object' && supplied !== null
        ? (supplied as Record<string, unknown>)
        : undefined;
    const fallback = defaultErrors[status] ?? {
      code: 'INTERNAL_ERROR',
      message: 'Terjadi kendala pada sistem.',
    };
    const hasSuppliedCode = typeof suppliedBody?.code === 'string';
    const code = hasSuppliedCode ? String(suppliedBody.code) : fallback.code;
    const message =
      hasSuppliedCode && typeof suppliedBody?.message === 'string'
        ? suppliedBody.message
        : fallback.message;
    const fields =
      hasSuppliedCode &&
      typeof suppliedBody?.fields === 'object' &&
      suppliedBody.fields !== null
        ? suppliedBody.fields
        : undefined;

    if (status >= 500) {
      this.logger.exception(
        {
          request_id: request.requestId,
          method: request.method,
          path: request.originalUrl,
          status_code: status,
          error_code: code,
        },
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      success: false,
      error: { code, message, ...(fields ? { fields } : {}) },
      requestId: request.requestId,
    });
  }
}
