import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../../modules/auth/auth.types';
import { hasPermissions, type Permission } from './permission';
import { PERMISSIONS_METADATA } from './require-permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_METADATA,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.admin) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Sesi admin tidak valid atau sudah berakhir.',
      });
    }
    if (!hasPermissions(request.admin.roles, required)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
      });
    }
    return true;
  }
}
