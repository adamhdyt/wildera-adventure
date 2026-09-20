import { applyDecorators, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../../modules/auth/session.guard';
import { Permission } from './permission';
import { PermissionGuard } from './permission.guard';
import { RequirePermissions } from './require-permissions.decorator';

export const Authorize = (...permissions: Permission[]) =>
  applyDecorators(
    RequirePermissions(...permissions),
    UseGuards(SessionGuard, PermissionGuard),
  );
