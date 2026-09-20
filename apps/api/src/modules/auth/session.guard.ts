import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedRequest, SessionPayload } from './auth.types';
import { AuthService } from './auth.service';
import { readSessionCookie } from './session-cookie';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readSessionCookie(request.headers.cookie);
    if (!token) throw this.unauthenticated();

    let payload: SessionPayload;
    try {
      payload = await this.jwt.verifyAsync<SessionPayload>(token);
    } catch {
      throw this.unauthenticated();
    }
    if (!payload.sub || typeof payload.sessionVersion !== 'string') {
      throw this.unauthenticated();
    }
    const admin = await this.auth.findSessionUser(
      payload.sub,
      payload.sessionVersion,
    );
    if (!admin) throw this.unauthenticated();
    request.admin = admin;
    return true;
  }

  private unauthenticated() {
    return new UnauthorizedException({
      code: 'UNAUTHENTICATED',
      message: 'Sesi admin tidak valid atau sudah berakhir.',
    });
  }
}
