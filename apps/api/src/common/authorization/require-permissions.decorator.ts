import { SetMetadata } from '@nestjs/common';
import type { Permission } from './permission';

export const PERMISSIONS_METADATA = 'wildera:permissions';

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_METADATA, permissions);
