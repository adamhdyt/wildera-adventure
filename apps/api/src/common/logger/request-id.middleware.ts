import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { RequestWithId } from './request-context';

const allowedRequestId = /^[A-Za-z0-9._:-]{1,100}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const supplied = request.header('x-request-id');
    const requestId =
      supplied && allowedRequestId.test(supplied)
        ? supplied
        : `req_${randomUUID().replaceAll('-', '')}`;
    (request as RequestWithId).requestId = requestId;
    response.setHeader('X-Request-Id', requestId);
    next();
  }
}
