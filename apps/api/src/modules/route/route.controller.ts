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
import { RouteService } from './route.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  adminUser?: {
    id: string;
    email: string;
  };
}

@Controller('admin/routes')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Get()
  @Authorize(Permission.CATALOG_VIEW)
  async list(@Query() query: Record<string, unknown>) {
    return this.routeService.list(query);
  }

  @Get(':id')
  @Authorize(Permission.CATALOG_VIEW)
  async getById(@Param('id') id: string) {
    return this.routeService.getById(id);
  }

  @Post()
  @Authorize(Permission.CATALOG_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    return this.routeService.create(body, {
      userId: req.adminUser?.id,
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
  ) {
    return this.routeService.update(id, body, {
      userId: req.adminUser?.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Delete(':id')
  @Authorize(Permission.CATALOG_MANAGE)
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.routeService.delete(id, {
      userId: req.adminUser?.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
