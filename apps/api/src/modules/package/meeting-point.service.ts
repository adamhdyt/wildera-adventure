import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import {
  validateCreateMeetingPoint,
  validateUpdateMeetingPoint,
} from '@wildera/validation';
import type {
  CreateMeetingPointPayload,
  EntityStatus,
  MeetingPoint,
  UpdateMeetingPointPayload,
} from '@wildera/types';

interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class MeetingPointService {
  constructor(private readonly database: PrismaService) {}

  private mapToDto(record: {
    id: string;
    name: string;
    city: string | null;
    address: string | null;
    latitude: unknown;
    longitude: unknown;
    notes: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): MeetingPoint {
    return {
      id: record.id,
      name: record.name,
      city: record.city,
      address: record.address,
      latitude: record.latitude !== null ? Number(record.latitude) : null,
      longitude: record.longitude !== null ? Number(record.longitude) : null,
      notes: record.notes,
      status: record.status as EntityStatus,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  async list(status?: EntityStatus): Promise<MeetingPoint[]> {
    const where = status ? { status } : {};
    const items = await this.database.meetingPoint.findMany({
      where,
      orderBy: [{ name: 'asc' }],
    });
    return items.map((i) => this.mapToDto(i));
  }

  async getById(id: string): Promise<MeetingPoint> {
    const item = await this.database.meetingPoint.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException({
        code: 'MEETING_POINT_NOT_FOUND',
        message: 'Titik temu (meeting point) tidak ditemukan.',
      });
    }
    return this.mapToDto(item);
  }

  async create(
    payload: CreateMeetingPointPayload,
    audit: AuditContext,
  ): Promise<MeetingPoint> {
    const validation = validateCreateMeetingPoint(payload);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Data meeting point tidak valid.',
        fields: validation.errors,
      });
    }

    const { name, city, address, latitude, longitude, notes, status } =
      validation.data;

    const item = await this.database.meetingPoint.create({
      data: {
        name,
        city: city || null,
        address: address || null,
        latitude: latitude !== undefined && latitude !== null ? latitude : null,
        longitude:
          longitude !== undefined && longitude !== null ? longitude : null,
        notes: notes || null,
        status: status || 'ACTIVE',
      },
    });

    if (audit.userId) {
      await this.database.auditLog.create({
        data: {
          adminUserId: audit.userId,
          action: 'MEETING_POINT_CREATE',
          entityType: 'MeetingPoint',
          entityId: item.id,
          newValue: item as unknown as object,
          ipAddress: audit.ipAddress || null,
          userAgent: audit.userAgent || null,
        },
      });
    }

    return this.mapToDto(item);
  }

  async update(
    id: string,
    payload: UpdateMeetingPointPayload,
    audit: AuditContext,
  ): Promise<MeetingPoint> {
    const existing = await this.database.meetingPoint.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'MEETING_POINT_NOT_FOUND',
        message: 'Titik temu (meeting point) tidak ditemukan.',
      });
    }

    const validation = validateUpdateMeetingPoint(payload);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Data update meeting point tidak valid.',
        fields: validation.errors,
      });
    }

    const updateData: Record<string, unknown> = {};
    if (validation.data.name !== undefined)
      updateData.name = validation.data.name;
    if (validation.data.city !== undefined)
      updateData.city = validation.data.city;
    if (validation.data.address !== undefined)
      updateData.address = validation.data.address;
    if (validation.data.latitude !== undefined)
      updateData.latitude = validation.data.latitude;
    if (validation.data.longitude !== undefined)
      updateData.longitude = validation.data.longitude;
    if (validation.data.notes !== undefined)
      updateData.notes = validation.data.notes;
    if (validation.data.status !== undefined)
      updateData.status = validation.data.status;

    const updated = await this.database.meetingPoint.update({
      where: { id },
      data: updateData,
    });

    if (audit.userId) {
      await this.database.auditLog.create({
        data: {
          adminUserId: audit.userId,
          action: 'MEETING_POINT_UPDATE',
          entityType: 'MeetingPoint',
          entityId: id,
          oldValue: existing as unknown as object,
          newValue: updated as unknown as object,
          ipAddress: audit.ipAddress || null,
          userAgent: audit.userAgent || null,
        },
      });
    }

    return this.mapToDto(updated);
  }

  async delete(id: string, audit: AuditContext): Promise<{ success: boolean }> {
    const existing = await this.database.meetingPoint.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'MEETING_POINT_NOT_FOUND',
        message: 'Titik temu (meeting point) tidak ditemukan.',
      });
    }

    const packageCount = await this.database.schedulePackage.count({
      where: { meetingPointId: id },
    });

    if (packageCount > 0) {
      throw new ConflictException({
        code: 'MEETING_POINT_IN_USE',
        message: `Meeting point sedang digunakan oleh ${packageCount} paket jadwal dan tidak dapat dihapus.`,
      });
    }

    await this.database.meetingPoint.delete({
      where: { id },
    });

    if (audit.userId) {
      await this.database.auditLog.create({
        data: {
          adminUserId: audit.userId,
          action: 'MEETING_POINT_DELETE',
          entityType: 'MeetingPoint',
          entityId: id,
          oldValue: existing as unknown as object,
          ipAddress: audit.ipAddress || null,
          userAgent: audit.userAgent || null,
        },
      });
    }

    return { success: true };
  }
}
