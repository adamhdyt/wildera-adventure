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
import { PrivateTripService } from './private-trip.service';
import type {
  PrivateTripInquiry,
  PrivateTripInquiryListResponse,
} from '@wildera/types';
import type { AuthenticatedRequest } from '../auth/auth.types';

@Controller()
export class PrivateTripController {
  constructor(private readonly privateTripService: PrivateTripService) {}

  @Post('private-trip-inquiries')
  @HttpCode(HttpStatus.CREATED)
  async submitPublicInquiry(
    @Body() body: unknown,
  ): Promise<{ inquiry: PrivateTripInquiry; whatsappUrl: string }> {
    return this.privateTripService.createInquiry(body);
  }

  @Get('admin/private-trip-inquiries')
  @Authorize(Permission.PRIVATE_TRIP_VIEW)
  async listAdminInquiries(
    @Query() query: Record<string, unknown>,
  ): Promise<PrivateTripInquiryListResponse> {
    return this.privateTripService.findAll(query);
  }

  @Get('admin/private-trip-inquiries/:id')
  @Authorize(Permission.PRIVATE_TRIP_VIEW)
  async getAdminInquiryDetail(
    @Param('id') id: string,
  ): Promise<PrivateTripInquiry> {
    return this.privateTripService.findById(id);
  }

  @Patch('admin/private-trip-inquiries/:id')
  @Authorize(Permission.PRIVATE_TRIP_MANAGE)
  async updateAdminInquiry(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<PrivateTripInquiry> {
    return this.privateTripService.update(id, body, {
      userId: req.admin?.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Delete('admin/private-trip-inquiries/:id')
  @Authorize(Permission.PRIVATE_TRIP_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAdminInquiry(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.privateTripService.delete(id, {
      userId: req.admin?.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
