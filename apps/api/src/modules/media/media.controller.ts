import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Authorize } from '../../common/authorization/authorize.decorator';
import { Permission } from '../../common/authorization/permission';
import { MediaService } from './media.service';
import { MediaStorageService } from './media-storage.service';
import type {
  MediaAsset,
  MountainMediaResponse,
  TripMediaResponse,
} from '@wildera/types';
import type { AuthenticatedRequest } from '../auth/auth.types';
import * as fs from 'node:fs';

@Controller()
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly storage: MediaStorageService,
  ) {}

  @Post('admin/media/upload')
  @Authorize(Permission.CATALOG_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @Body() body: Record<string, unknown>,
    @Req() req: AuthenticatedRequest,
  ): Promise<MediaAsset> {
    const userId = req.admin?.id;

    // Handle base64 JSON upload
    if (typeof body?.contentBase64 === 'string') {
      const buffer = Buffer.from(body.contentBase64, 'base64');
      return this.mediaService.uploadFile(
        {
          filename: String(body.filename || 'image.jpg'),
          mimeType: String(body.mimeType || 'image/jpeg'),
          buffer,
          size: buffer.length,
        },
        {
          userId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
        typeof body.altText === 'string' ? body.altText : undefined,
      );
    }

    // If neither base64 nor file provided
    throw new BadRequestException({
      code: 'INVALID_UPLOAD_PAYLOAD',
      message: 'Payload upload berkas tidak valid.',
    });
  }

  @Get('admin/media')
  @Authorize(Permission.CATALOG_VIEW)
  async list(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ items: MediaAsset[]; total: number }> {
    return this.mediaService.list({
      search,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('admin/media/:id')
  @Authorize(Permission.CATALOG_VIEW)
  async getById(@Param('id') id: string): Promise<MediaAsset> {
    return this.mediaService.getById(id);
  }

  // Trip Media endpoints
  @Get('admin/trips/:id/media')
  @Authorize(Permission.CATALOG_VIEW)
  async getTripMedia(@Param('id') id: string): Promise<TripMediaResponse> {
    return this.mediaService.getTripMedia(id);
  }

  @Put('admin/trips/:id/media')
  @Authorize(Permission.CATALOG_MANAGE)
  async updateTripMedia(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TripMediaResponse> {
    const userId = req.admin?.id;
    return this.mediaService.updateTripMedia(id, body, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  // Mountain Media endpoints
  @Get('admin/mountains/:id/media')
  @Authorize(Permission.CATALOG_VIEW)
  async getMountainMedia(
    @Param('id') id: string,
  ): Promise<MountainMediaResponse> {
    return this.mediaService.getMountainMedia(id);
  }

  @Put('admin/mountains/:id/media')
  @Authorize(Permission.CATALOG_MANAGE)
  async updateMountainMedia(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<MountainMediaResponse> {
    const userId = req.admin?.id;
    return this.mediaService.updateMountainMedia(id, body, {
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  // File streaming endpoint
  @Get('media/file/*path')
  serveFile(@Req() req: Request, @Res() res: Response): void {
    const objectKey =
      (req.params as Record<string, string>)?.path ||
      (req.url.split('/media/file/')[1] ?? '');
    const filePath = this.storage.resolveFullPath(objectKey);

    if (!fs.existsSync(filePath)) {
      res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Berkas tidak ditemukan.',
        },
      });
      return;
    }

    res.sendFile(filePath);
  }
}
