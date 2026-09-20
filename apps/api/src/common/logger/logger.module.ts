import {
  Global,
  MiddlewareConsumer,
  Module,
  RequestMethod,
  type NestModule,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppLogger } from './app-logger.service';
import { RequestIdMiddleware } from './request-id.middleware';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

@Global()
@Module({
  providers: [
    AppLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
  exports: [AppLogger],
})
export class LoggerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
