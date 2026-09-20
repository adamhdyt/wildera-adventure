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
import { ParticipantService } from './participant.service';
import type { BookingParticipantItem } from '@wildera/types';
import type { AuthenticatedRequest } from '../auth/auth.types';

@Controller('admin/bookings/:bookingId/participants')
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  @Get()
  @Authorize(Permission.PARTICIPANT_VIEW)
  async list(
    @Param('bookingId') bookingId: string,
  ): Promise<BookingParticipantItem[]> {
    return this.participantService.list(bookingId);
  }

  @Get(':id')
  @Authorize(Permission.PARTICIPANT_VIEW)
  async getById(
    @Param('bookingId') bookingId: string,
    @Param('id') id: string,
  ): Promise<BookingParticipantItem> {
    return this.participantService.getById(bookingId, id);
  }

  @Post()
  @Authorize(Permission.PARTICIPANT_MANAGE)
  async create(
    @Param('bookingId') bookingId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<BookingParticipantItem> {
    const userId = req.admin?.id;
    return this.participantService.create(bookingId, body, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Patch(':id')
  @Authorize(Permission.PARTICIPANT_MANAGE)
  async update(
    @Param('bookingId') bookingId: string,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<BookingParticipantItem> {
    const userId = req.admin?.id;
    return this.participantService.update(bookingId, id, body, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Delete(':id')
  @Authorize(Permission.PARTICIPANT_MANAGE)
  async delete(
    @Param('bookingId') bookingId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: true; id: string }> {
    const userId = req.admin?.id;
    return this.participantService.delete(bookingId, id, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
