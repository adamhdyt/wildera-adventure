import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Authorize } from '../../common/authorization/authorize.decorator';
import { Permission } from '../../common/authorization/permission';
import { MeetingPointService } from './meeting-point.service';
import type { AuthenticatedRequest } from '../auth/auth.types';
import type {
  CreateMeetingPointPayload,
  EntityStatus,
  MeetingPoint,
  UpdateMeetingPointPayload,
} from '@wildera/types';

@Controller('admin/meeting-points')
export class MeetingPointController {
  constructor(private readonly meetingPointService: MeetingPointService) {}

  @Get()
  @Authorize(
    Permission.SCHEDULE_VIEW,
    Permission.SCHEDULE_MANAGE,
    Permission.CATALOG_MANAGE,
  )
  async list(@Query('status') status?: EntityStatus): Promise<MeetingPoint[]> {
    return this.meetingPointService.list(status);
  }

  @Get(':id')
  @Authorize(
    Permission.SCHEDULE_VIEW,
    Permission.SCHEDULE_MANAGE,
    Permission.CATALOG_MANAGE,
  )
  async getById(@Param('id') id: string): Promise<MeetingPoint> {
    return this.meetingPointService.getById(id);
  }

  @Post()
  @Authorize(Permission.SCHEDULE_MANAGE, Permission.CATALOG_MANAGE)
  async create(
    @Body() payload: CreateMeetingPointPayload,
    @Req() req: AuthenticatedRequest,
  ): Promise<MeetingPoint> {
    return this.meetingPointService.create(payload, {
      userId: req.admin?.id,
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'] as string,
    });
  }

  @Patch(':id')
  @Authorize(Permission.SCHEDULE_MANAGE, Permission.CATALOG_MANAGE)
  async update(
    @Param('id') id: string,
    @Body() payload: UpdateMeetingPointPayload,
    @Req() req: AuthenticatedRequest,
  ): Promise<MeetingPoint> {
    return this.meetingPointService.update(id, payload, {
      userId: req.admin?.id,
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'] as string,
    });
  }

  @Delete(':id')
  @Authorize(Permission.SCHEDULE_MANAGE, Permission.CATALOG_MANAGE)
  async delete(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.meetingPointService.delete(id, {
      userId: req.admin?.id,
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'] as string,
    });
  }
}
