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
import { BookingService } from './booking.service';
import type { AdminBookingItem, BookingListResponse } from '@wildera/types';
import type { AuthenticatedRequest } from '../auth/auth.types';

@Controller('admin/bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @Authorize(Permission.BOOKING_VIEW)
  async list(
    @Query() query: Record<string, unknown>,
  ): Promise<BookingListResponse> {
    return this.bookingService.list(query);
  }

  @Get(':id')
  @Authorize(Permission.BOOKING_VIEW)
  async getById(@Param('id') id: string): Promise<AdminBookingItem> {
    return this.bookingService.getById(id);
  }

  @Post()
  @Authorize(Permission.BOOKING_MANAGE)
  async create(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminBookingItem> {
    const userId = req.admin?.id;
    return this.bookingService.create(body, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Patch(':id')
  @Authorize(Permission.BOOKING_MANAGE)
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminBookingItem> {
    const userId = req.admin?.id;
    return this.bookingService.update(id, body, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @Authorize(Permission.BOOKING_CONFIRM)
  async confirm(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminBookingItem> {
    const userId = req.admin?.id;
    return this.bookingService.confirm(id, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Authorize(Permission.BOOKING_CANCEL)
  async cancel(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminBookingItem> {
    const userId = req.admin?.id;
    return this.bookingService.cancel(id, body, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Delete(':id')
  @Authorize(Permission.BOOKING_MANAGE)
  async delete(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; id: string }> {
    const userId = req.admin?.id;
    return this.bookingService.delete(id, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
