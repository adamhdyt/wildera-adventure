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
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { Authorize } from '../../common/authorization/authorize.decorator';
import { Permission } from '../../common/authorization/permission';
import { TripService } from './trip.service';
import type { Trip, TripContent, TripListResponse } from '@wildera/types';
import type { AuthenticatedRequest } from '../auth/auth.types';

@Controller('admin/trips')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Get()
  @Authorize(Permission.CATALOG_VIEW)
  async list(
    @Query() query: Record<string, unknown>,
  ): Promise<TripListResponse> {
    return this.tripService.list(query);
  }

  @Get(':id')
  @Authorize(Permission.CATALOG_VIEW)
  async getById(@Param('id') id: string): Promise<Trip> {
    return this.tripService.getById(id);
  }

  @Get(':id/content')
  @Authorize(Permission.CATALOG_VIEW)
  async getContent(@Param('id') id: string): Promise<TripContent> {
    return this.tripService.getContent(id);
  }

  @Put(':id/content')
  @Authorize(Permission.CATALOG_MANAGE)
  async updateContent(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TripContent> {
    const userId = req.admin?.id;
    return this.tripService.updateContent(id, body, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post()
  @Authorize(Permission.CATALOG_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<Trip> {
    const userId = req.admin?.id;
    return this.tripService.create(body, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Patch(':id')
  @Authorize(Permission.CATALOG_MANAGE)
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<Trip> {
    const userId = req.admin?.id;
    return this.tripService.update(id, body, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @Authorize(Permission.CATALOG_MANAGE)
  async publish(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Trip> {
    const userId = req.admin?.id;
    return this.tripService.publish(id, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @Authorize(Permission.CATALOG_MANAGE)
  async unpublish(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Trip> {
    const userId = req.admin?.id;
    return this.tripService.unpublish(id, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post(':id/duplicate')
  @Authorize(Permission.CATALOG_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async duplicate(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Trip> {
    const userId = req.admin?.id;
    return this.tripService.duplicate(id, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Delete(':id')
  @Authorize(Permission.CATALOG_MANAGE)
  async delete(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Trip> {
    const userId = req.admin?.id;
    return this.tripService.delete(id, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
