import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { MediaStorageService } from './media-storage.service';
import {
  validateImageUpload,
  validateUpdateMediaAssignment,
} from '@wildera/validation';
import type {
  MediaAsset,
  MountainMediaResponse,
  TripMediaResponse,
} from '@wildera/types';

interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MediaStorageService,
  ) {}

  private mapAsset(raw: {
    id: string;
    objectKey: string;
    url: string;
    mimeType: string;
    fileSizeBytes: bigint | number;
    widthPx?: number | null;
    heightPx?: number | null;
    altText?: string | null;
    createdBy: string;
    createdAt: Date;
  }): MediaAsset {
    return {
      id: raw.id,
      objectKey: raw.objectKey,
      url: raw.url,
      mimeType: raw.mimeType,
      fileSizeBytes: Number(raw.fileSizeBytes),
      widthPx: raw.widthPx ?? null,
      heightPx: raw.heightPx ?? null,
      altText: raw.altText ?? null,
      createdBy: raw.createdBy,
      createdAt: raw.createdAt,
    };
  }

  async uploadFile(
    file: {
      filename: string;
      mimeType: string;
      buffer: Buffer;
      size: number;
    },
    audit: AuditContext,
    altText?: string,
  ): Promise<MediaAsset> {
    const validation = validateImageUpload({
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
    });

    if (!validation.valid) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Validasi unggah berkas gagal.',
        details: validation.errors,
      });
    }

    if (!audit.userId) {
      throw new BadRequestException('AUTHENTICATED_USER_REQUIRED');
    }

    const stored = await this.storage.storeFile({
      filename: validation.data.filename,
      extension: validation.data.extension,
      buffer: file.buffer,
    });

    const asset = await this.prisma.mediaAsset.create({
      data: {
        objectKey: stored.objectKey,
        url: stored.url,
        mimeType: validation.data.mimeType,
        fileSizeBytes: BigInt(validation.data.size),
        altText: altText ? altText.trim().slice(0, 255) : null,
        createdBy: audit.userId,
      },
    });

    await this.logAudit({
      action: 'MEDIA_UPLOAD',
      entityId: asset.id,
      newValue: {
        id: asset.id,
        objectKey: asset.objectKey,
        url: asset.url,
        mimeType: asset.mimeType,
        fileSizeBytes: Number(asset.fileSizeBytes),
      },
      audit,
    });

    return this.mapAsset(asset);
  }

  async list(query?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: MediaAsset[]; total: number }> {
    const limit = Math.min(Math.max(Number(query?.limit || 50), 1), 100);
    const offset = Math.max(Number(query?.offset || 0), 0);
    const search = query?.search?.trim();

    const where: Prisma.MediaAssetWhereInput = {};
    if (search) {
      where.OR = [
        { objectKey: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rawItems, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    return {
      items: rawItems.map((r) => this.mapAsset(r)),
      total,
    };
  }

  async getById(id: string): Promise<MediaAsset> {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id },
    });
    if (!asset) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Media tidak ditemukan.',
      });
    }
    return this.mapAsset(asset);
  }

  async getTripMedia(tripId: string): Promise<TripMediaResponse> {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, deletedAt: null },
    });
    if (!trip) {
      throw new NotFoundException({
        code: 'TRIP_NOT_FOUND',
        message: 'Trip tidak ditemukan.',
      });
    }

    const items = await this.prisma.tripMedia.findMany({
      where: { tripId },
      include: { media: true },
      orderBy: { sortOrder: 'asc' },
    });

    const coverItem = items.find((i) => i.mediaRole === 'COVER');
    const galleryItems = items.filter((i) => i.mediaRole === 'GALLERY');

    return {
      cover: coverItem
        ? {
            id: coverItem.id,
            tripId: coverItem.tripId,
            mediaId: coverItem.mediaId,
            mediaRole: coverItem.mediaRole,
            sortOrder: coverItem.sortOrder,
            createdAt: coverItem.createdAt,
            media: this.mapAsset(coverItem.media),
          }
        : null,
      gallery: galleryItems.map((g) => ({
        id: g.id,
        tripId: g.tripId,
        mediaId: g.mediaId,
        mediaRole: g.mediaRole,
        sortOrder: g.sortOrder,
        createdAt: g.createdAt,
        media: this.mapAsset(g.media),
      })),
    };
  }

  async updateTripMedia(
    tripId: string,
    body: unknown,
    audit: AuditContext,
  ): Promise<TripMediaResponse> {
    const validation = validateUpdateMediaAssignment(body);
    if (!validation.valid) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Penetapan media trip tidak valid.',
        details: validation.errors,
      });
    }

    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, deletedAt: null },
    });
    if (!trip) {
      throw new NotFoundException({
        code: 'TRIP_NOT_FOUND',
        message: 'Trip tidak ditemukan.',
      });
    }

    // Verify media existence
    const mediaIdsToVerify: string[] = [];
    if (validation.data.coverMediaId) {
      mediaIdsToVerify.push(validation.data.coverMediaId);
    }
    if (validation.data.galleryMediaIds) {
      mediaIdsToVerify.push(...validation.data.galleryMediaIds);
    }

    if (mediaIdsToVerify.length > 0) {
      const existingMediaCount = await this.prisma.mediaAsset.count({
        where: { id: { in: mediaIdsToVerify } },
      });
      if (existingMediaCount !== new Set(mediaIdsToVerify).size) {
        throw new BadRequestException({
          code: 'MEDIA_NOT_FOUND',
          message: 'Satu atau lebih berkas media yang dipilih tidak ditemukan.',
        });
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.tripMedia.deleteMany({ where: { tripId } });

      if (validation.data.coverMediaId) {
        await tx.tripMedia.create({
          data: {
            tripId,
            mediaId: validation.data.coverMediaId,
            mediaRole: 'COVER',
            sortOrder: 0,
          },
        });
      }

      if (
        validation.data.galleryMediaIds &&
        validation.data.galleryMediaIds.length > 0
      ) {
        await tx.tripMedia.createMany({
          data: validation.data.galleryMediaIds.map((mediaId, idx) => ({
            tripId,
            mediaId,
            mediaRole: 'GALLERY',
            sortOrder: idx + 1,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          adminUserId: audit.userId || null,
          action: 'TRIP_MEDIA_UPDATE',
          entityType: 'trip_media',
          entityId: tripId,
          newValue: {
            tripId,
            coverMediaId: validation.data.coverMediaId,
            galleryMediaIds: validation.data.galleryMediaIds,
          },
          ipAddress: audit.ipAddress || null,
          userAgent: audit.userAgent || null,
        },
      });
    });

    return this.getTripMedia(tripId);
  }

  async getMountainMedia(mountainId: string): Promise<MountainMediaResponse> {
    const mountain = await this.prisma.mountain.findFirst({
      where: { id: mountainId, deletedAt: null },
    });
    if (!mountain) {
      throw new NotFoundException({
        code: 'MOUNTAIN_NOT_FOUND',
        message: 'Gunung tidak ditemukan.',
      });
    }

    const items = await this.prisma.mountainMedia.findMany({
      where: { mountainId },
      include: { media: true },
      orderBy: { sortOrder: 'asc' },
    });

    const coverItem = items.find((i) => i.mediaRole === 'COVER');
    const galleryItems = items.filter((i) => i.mediaRole === 'GALLERY');

    return {
      cover: coverItem
        ? {
            id: coverItem.id,
            mountainId: coverItem.mountainId,
            mediaId: coverItem.mediaId,
            mediaRole: coverItem.mediaRole,
            sortOrder: coverItem.sortOrder,
            createdAt: coverItem.createdAt,
            media: this.mapAsset(coverItem.media),
          }
        : null,
      gallery: galleryItems.map((g) => ({
        id: g.id,
        mountainId: g.mountainId,
        mediaId: g.mediaId,
        mediaRole: g.mediaRole,
        sortOrder: g.sortOrder,
        createdAt: g.createdAt,
        media: this.mapAsset(g.media),
      })),
    };
  }

  async updateMountainMedia(
    mountainId: string,
    body: unknown,
    audit: AuditContext,
  ): Promise<MountainMediaResponse> {
    const validation = validateUpdateMediaAssignment(body);
    if (!validation.valid) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Penetapan media gunung tidak valid.',
        details: validation.errors,
      });
    }

    const mountain = await this.prisma.mountain.findFirst({
      where: { id: mountainId, deletedAt: null },
    });
    if (!mountain) {
      throw new NotFoundException({
        code: 'MOUNTAIN_NOT_FOUND',
        message: 'Gunung tidak ditemukan.',
      });
    }

    const mediaIdsToVerify: string[] = [];
    if (validation.data.coverMediaId) {
      mediaIdsToVerify.push(validation.data.coverMediaId);
    }
    if (validation.data.galleryMediaIds) {
      mediaIdsToVerify.push(...validation.data.galleryMediaIds);
    }

    if (mediaIdsToVerify.length > 0) {
      const existingMediaCount = await this.prisma.mediaAsset.count({
        where: { id: { in: mediaIdsToVerify } },
      });
      if (existingMediaCount !== new Set(mediaIdsToVerify).size) {
        throw new BadRequestException({
          code: 'MEDIA_NOT_FOUND',
          message: 'Satu atau lebih berkas media yang dipilih tidak ditemukan.',
        });
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.mountainMedia.deleteMany({ where: { mountainId } });

      if (validation.data.coverMediaId) {
        await tx.mountainMedia.create({
          data: {
            mountainId,
            mediaId: validation.data.coverMediaId,
            mediaRole: 'COVER',
            sortOrder: 0,
          },
        });
      }

      if (
        validation.data.galleryMediaIds &&
        validation.data.galleryMediaIds.length > 0
      ) {
        await tx.mountainMedia.createMany({
          data: validation.data.galleryMediaIds.map((mediaId, idx) => ({
            mountainId,
            mediaId,
            mediaRole: 'GALLERY',
            sortOrder: idx + 1,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          adminUserId: audit.userId || null,
          action: 'MOUNTAIN_MEDIA_UPDATE',
          entityType: 'mountain_media',
          entityId: mountainId,
          newValue: {
            mountainId,
            coverMediaId: validation.data.coverMediaId,
            galleryMediaIds: validation.data.galleryMediaIds,
          },
          ipAddress: audit.ipAddress || null,
          userAgent: audit.userAgent || null,
        },
      });
    });

    return this.getMountainMedia(mountainId);
  }

  private async logAudit(params: {
    action: string;
    entityId: string;
    newValue: Record<string, unknown>;
    audit: AuditContext;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminUserId: params.audit.userId || null,
          action: params.action,
          entityType: 'media_assets',
          entityId: params.entityId,
          newValue: params.newValue as Prisma.InputJsonValue,
          ipAddress: params.audit.ipAddress || null,
          userAgent: params.audit.userAgent || null,
        },
      });
    } catch {
      // Non-blocking
    }
  }
}
