import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Authorize } from '../../common/authorization/authorize.decorator';
import { Permission } from '../../common/authorization/permission';
import { ScheduleService } from './schedule.service';
import type { ScheduleListResponse, TripSchedule } from '@wildera/types';
import type { AuthenticatedRequest } from '../auth/auth.types';

@Controller('admin/schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @Authorize(Permission.SCHEDULE_VIEW)
  async list(
    @Query() query: Record<string, unknown>,
  ): Promise<ScheduleListResponse> {
    return this.scheduleService.list(query);
  }

  @Get(':id')
  @Authorize(Permission.SCHEDULE_VIEW)
  async getById(@Param('id') id: string): Promise<TripSchedule> {
    return this.scheduleService.getById(id);
  }

  @Get(':id/manifest')
  @Authorize(Permission.SCHEDULE_VIEW)
  async getManifest(@Param('id') id: string) {
    return this.scheduleService.getManifest(id);
  }

  @Post()
  @Authorize(Permission.SCHEDULE_MANAGE)
  async create(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TripSchedule> {
    const userId = req.admin?.id;
    return this.scheduleService.create(body, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Patch(':id')
  @Authorize(Permission.SCHEDULE_MANAGE)
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TripSchedule> {
    const userId = req.admin?.id;
    return this.scheduleService.update(id, body, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post(':id/open')
  @HttpCode(HttpStatus.OK)
  @Authorize(Permission.SCHEDULE_MANAGE)
  async open(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<TripSchedule> {
    const userId = req.admin?.id;
    return this.scheduleService.setStatus(id, 'OPEN', {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @Authorize(Permission.SCHEDULE_MANAGE)
  async close(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<TripSchedule> {
    const userId = req.admin?.id;
    return this.scheduleService.setStatus(id, 'CLOSED', {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Authorize(Permission.SCHEDULE_MANAGE)
  async cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Req() req: AuthenticatedRequest,
  ): Promise<TripSchedule> {
    const userId = req.admin?.id;
    return this.scheduleService.setStatus(
      id,
      'CANCELLED',
      {
        userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
      body?.reason,
    );
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @Authorize(Permission.SCHEDULE_MANAGE)
  async complete(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<TripSchedule> {
    const userId = req.admin?.id;
    return this.scheduleService.setStatus(id, 'COMPLETED', {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Delete(':id')
  @Authorize(Permission.SCHEDULE_MANAGE)
  async delete(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; id: string }> {
    const userId = req.admin?.id;
    return this.scheduleService.delete(id, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
