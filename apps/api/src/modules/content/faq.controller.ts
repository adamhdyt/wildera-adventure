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
import { ContentService } from './content.service';
import type { AuthenticatedRequest } from '../auth/auth.types';
import type { RequestWithId } from '../../common/logger/request-context';

@Controller('admin/faqs')
export class FaqController {
  constructor(private readonly service: ContentService) {}

  @Get()
  @Authorize(Permission.CONTENT_VIEW)
  async list(@Query() query: Record<string, unknown>) {
    const result = await this.service.listAdminFaqs(query);
    return { success: true, data: result };
  }

  @Get(':id')
  @Authorize(Permission.CONTENT_VIEW)
  async getById(@Param('id') id: string) {
    const result = await this.service.getAdminFaq(id);
    return { success: true, data: result };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Authorize(Permission.CONTENT_MANAGE)
  async create(
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest & RequestWithId,
  ) {
    const result = await this.service.createFaq(body, {
      adminUserId: request.admin?.id,
      requestId: request.requestId,
      userAgent: request.headers?.['user-agent'],
    });
    return { success: true, data: result };
  }

  @Patch(':id')
  @Authorize(Permission.CONTENT_MANAGE)
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest & RequestWithId,
  ) {
    const result = await this.service.updateFaq(id, body, {
      adminUserId: request.admin?.id,
      requestId: request.requestId,
      userAgent: request.headers?.['user-agent'],
    });
    return { success: true, data: result };
  }

  @Delete(':id')
  @Authorize(Permission.CONTENT_MANAGE)
  async delete(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest & RequestWithId,
  ) {
    await this.service.deleteFaq(id, {
      adminUserId: request.admin?.id,
      requestId: request.requestId,
      userAgent: request.headers?.['user-agent'],
    });
    return { success: true };
  }
}
