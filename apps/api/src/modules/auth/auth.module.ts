import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  SESSION_AUDIENCE,
  SESSION_ISSUER,
  SESSION_TTL_SECONDS,
} from './session.constants';
import { SessionGuard } from './session.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('SESSION_SECRET'),
        signOptions: {
          algorithm: 'HS256',
          audience: SESSION_AUDIENCE,
          expiresIn: SESSION_TTL_SECONDS,
          issuer: SESSION_ISSUER,
        },
        verifyOptions: {
          algorithms: ['HS256'],
          audience: SESSION_AUDIENCE,
          issuer: SESSION_ISSUER,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionGuard],
  exports: [AuthService, JwtModule, SessionGuard],
})
export class AuthModule {}
