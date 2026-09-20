import { Controller, Get, Query, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Authorize } from '../../common/authorization/authorize.decorator';
import { Permission } from '../../common/authorization/permission';
import type { AuthenticatedRequest } from '../auth/auth.types';

@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @Authorize(Permission.AUDIT_VIEW_LIMITED)
  async getAuditLogs(
    @Query() query: Record<string, unknown>,
    @Req() req: AuthenticatedRequest,
  ) {
    const roles = req.admin?.roles ?? [];
    const result = await this.service.getAuditLogs(query, roles);
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }
}
