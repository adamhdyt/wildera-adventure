import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnvironment } from './environment';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      cache: true,
      envFilePath: ['.env', '../../.env'],
      isGlobal: true,
      validate: validateEnvironment,
    }),
  ],
  exports: [NestConfigModule],
})
export class AppConfigModule {}
