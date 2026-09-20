import { Controller, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Authorize } from '../../common/authorization/authorize.decorator';
import { Permission } from '../../common/authorization/permission';
import type { RequestWithId } from '../../common/logger/request-context';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { AdminStatus } from '../../generated/prisma/client';

@Controller('admin/users')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get()
  @Authorize(Permission.ADMIN_MANAGE)
  async getUsers() {
    const data = await this.service.getUsers();
    return { success: true, data };
  }

  @Get(':id')
  @Authorize(Permission.ADMIN_MANAGE)
  async getUser(@Param('id') id: string) {
    const data = await this.service.getUserById(id);
    return { success: true, data };
  }

  @Post()
  @Authorize(Permission.ADMIN_MANAGE)
  async createUser(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest & RequestWithId,
  ) {
    const actor = {
      id: req.admin?.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const data = await this.service.createUser(body, actor);
    return { success: true, data };
  }

  @Patch(':id')
  @Authorize(Permission.ADMIN_MANAGE)
  async updateUser(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest & RequestWithId,
  ) {
    const actor = {
      id: req.admin?.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const data = await this.service.updateUser(id, body, actor);
    return { success: true, data };
  }

  @Post(':id/disable')
  @Authorize(Permission.ADMIN_MANAGE)
  async disableUser(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest & RequestWithId,
  ) {
    const actor = {
      id: req.admin?.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const data = await this.service.setUserStatus(
      id,
      AdminStatus.DISABLED,
      actor,
    );
    return { success: true, data };
  }

  @Post(':id/enable')
  @Authorize(Permission.ADMIN_MANAGE)
  async enableUser(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest & RequestWithId,
  ) {
    const actor = {
      id: req.admin?.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const data = await this.service.setUserStatus(
      id,
      AdminStatus.ACTIVE,
      actor,
    );
    return { success: true, data };
  }
}
