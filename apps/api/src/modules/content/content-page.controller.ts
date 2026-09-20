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

@Controller('admin/content-pages')
export class ContentPageController {
  constructor(private readonly service: ContentService) {}

  @Get()
  @Authorize(Permission.CONTENT_VIEW)
  async list(@Query() query: Record<string, unknown>) {
    const result = await this.service.listAdminContentPages(query);
    return { success: true, data: result };
  }

  @Get(':keyOrId')
  @Authorize(Permission.CONTENT_VIEW)
  async getByKeyOrId(@Param('keyOrId') keyOrId: string) {
    const result = await this.service.getAdminContentPage(keyOrId);
    return { success: true, data: result };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Authorize(Permission.CONTENT_MANAGE)
  async create(
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest & RequestWithId,
  ) {
    const result = await this.service.createContentPage(body, {
      adminUserId: request.admin?.id,
      requestId: request.requestId,
      userAgent: request.headers?.['user-agent'],
    });
    return { success: true, data: result };
  }

  @Patch(':keyOrId')
  @Authorize(Permission.CONTENT_MANAGE)
  async update(
    @Param('keyOrId') keyOrId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest & RequestWithId,
  ) {
    const result = await this.service.updateContentPage(keyOrId, body, {
      adminUserId: request.admin?.id,
      requestId: request.requestId,
      userAgent: request.headers?.['user-agent'],
    });
    return { success: true, data: result };
  }

  @Delete(':keyOrId')
  @Authorize(Permission.CONTENT_MANAGE)
  async delete(
    @Param('keyOrId') keyOrId: string,
    @Req() request: AuthenticatedRequest & RequestWithId,
  ) {
    await this.service.deleteContentPage(keyOrId, {
      adminUserId: request.admin?.id,
      requestId: request.requestId,
      userAgent: request.headers?.['user-agent'],
    });
    return { success: true };
  }
}
