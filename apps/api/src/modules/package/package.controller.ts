import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Authorize } from '../../common/authorization/authorize.decorator';
import { Permission } from '../../common/authorization/permission';
import { PackageService } from './package.service';
import type { AuthenticatedRequest } from '../auth/auth.types';
import type {
  CreatePackagePayload,
  SchedulePackage,
  UpdatePackagePayload,
} from '@wildera/types';

@Controller('admin/schedules/:scheduleId/packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Get()
  @Authorize(
    Permission.SCHEDULE_VIEW,
    Permission.SCHEDULE_MANAGE,
    Permission.CATALOG_MANAGE,
  )
  async list(
    @Param('scheduleId') scheduleId: string,
  ): Promise<SchedulePackage[]> {
    return this.packageService.list(scheduleId);
  }

  @Get(':packageId')
  @Authorize(
    Permission.SCHEDULE_VIEW,
    Permission.SCHEDULE_MANAGE,
    Permission.CATALOG_MANAGE,
  )
  async getById(
    @Param('scheduleId') scheduleId: string,
    @Param('packageId') packageId: string,
  ): Promise<SchedulePackage> {
    return this.packageService.getById(scheduleId, packageId);
  }

  @Post()
  @Authorize(Permission.SCHEDULE_MANAGE, Permission.CATALOG_MANAGE)
  async create(
    @Param('scheduleId') scheduleId: string,
    @Body() payload: CreatePackagePayload,
    @Req() req: AuthenticatedRequest,
  ): Promise<SchedulePackage> {
    return this.packageService.create(scheduleId, payload, {
      userId: req.admin?.id,
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'] as string,
    });
  }

  @Patch(':packageId')
  @Authorize(Permission.SCHEDULE_MANAGE, Permission.CATALOG_MANAGE)
  async update(
    @Param('scheduleId') scheduleId: string,
    @Param('packageId') packageId: string,
    @Body() payload: UpdatePackagePayload,
    @Req() req: AuthenticatedRequest,
  ): Promise<SchedulePackage> {
    return this.packageService.update(scheduleId, packageId, payload, {
      userId: req.admin?.id,
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'] as string,
    });
  }

  @Delete(':packageId')
  @Authorize(Permission.SCHEDULE_MANAGE, Permission.CATALOG_MANAGE)
  async delete(
    @Param('scheduleId') scheduleId: string,
    @Param('packageId') packageId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.packageService.delete(scheduleId, packageId, {
      userId: req.admin?.id,
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'] as string,
    });
  }
}
