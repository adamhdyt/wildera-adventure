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
import { MountainService } from './mountain.service';
import type { AuthenticatedRequest } from '../auth/auth.types';
import type { RequestWithId } from '../../common/logger/request-context';

@Controller('admin/mountains')
export class MountainController {
  constructor(private readonly service: MountainService) {}

  @Get()
  @Authorize(Permission.CATALOG_VIEW)
  async list(@Query() query: Record<string, unknown>) {
    const result = await this.service.list(query);
    return { success: true, data: result };
  }

  @Get(':id')
  @Authorize(Permission.CATALOG_VIEW)
  async getById(@Param('id') id: string) {
    const result = await this.service.getById(id);
    return { success: true, data: result };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Authorize(Permission.CATALOG_MANAGE)
  async create(
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest & RequestWithId,
  ) {
    const result = await this.service.create(body, {
      adminUserId: request.admin?.id,
      requestId: request.requestId,
      userAgent: request.headers?.['user-agent'],
    });
    return { success: true, data: result };
  }

  @Patch(':id')
  @Authorize(Permission.CATALOG_MANAGE)
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest & RequestWithId,
  ) {
    const result = await this.service.update(id, body, {
      adminUserId: request.admin?.id,
      requestId: request.requestId,
      userAgent: request.headers?.['user-agent'],
    });
    return { success: true, data: result };
  }

  @Delete(':id')
  @Authorize(Permission.CATALOG_MANAGE)
  async delete(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest & RequestWithId,
  ) {
    const result = await this.service.delete(id, {
      adminUserId: request.admin?.id,
      requestId: request.requestId,
      userAgent: request.headers?.['user-agent'],
    });
    return { success: true, data: result };
  }
}
