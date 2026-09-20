import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import {
  validateCreatePackage,
  validateUpdatePackage,
} from '@wildera/validation';
import type {
  CreatePackagePayload,
  EntityStatus,
  SchedulePackage,
  UpdatePackagePayload,
} from '@wildera/types';

interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class PackageService {
  constructor(private readonly database: PrismaService) {}

  private mapToDto(record: {
    id: string;
    scheduleId: string;
    meetingPointId: string | null;
    name: string;
    description: string | null;
    price: unknown;
    meetingDatetime: Date | null;
    status: string;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    meetingPoint?: {
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
    } | null;
  }): SchedulePackage {
    return {
      id: record.id,
      scheduleId: record.scheduleId,
      meetingPointId: record.meetingPointId,
      name: record.name,
      description: record.description,
      price: Number(record.price),
      meetingDatetime: record.meetingDatetime
        ? record.meetingDatetime.toISOString()
        : null,
      status: record.status as EntityStatus,
      sortOrder: record.sortOrder,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      meetingPoint: record.meetingPoint
        ? {
            id: record.meetingPoint.id,
            name: record.meetingPoint.name,
            city: record.meetingPoint.city,
            address: record.meetingPoint.address,
            latitude:
              record.meetingPoint.latitude !== null
                ? Number(record.meetingPoint.latitude)
                : null,
            longitude:
              record.meetingPoint.longitude !== null
                ? Number(record.meetingPoint.longitude)
                : null,
            notes: record.meetingPoint.notes,
            status: record.meetingPoint.status as EntityStatus,
            createdAt: record.meetingPoint.createdAt.toISOString(),
            updatedAt: record.meetingPoint.updatedAt.toISOString(),
          }
        : null,
    };
  }

  async list(scheduleId: string): Promise<SchedulePackage[]> {
    const schedule = await this.database.tripSchedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule) {
      throw new NotFoundException({
        code: 'SCHEDULE_NOT_FOUND',
        message: 'Jadwal perjalanan tidak ditemukan.',
      });
    }

    const packages = await this.database.schedulePackage.findMany({
      where: { scheduleId },
      include: {
        meetingPoint: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return packages.map((p) => this.mapToDto(p));
  }

  async getById(
    scheduleId: string,
    packageId: string,
  ): Promise<SchedulePackage> {
    const item = await this.database.schedulePackage.findUnique({
      where: { id: packageId },
      include: {
        meetingPoint: true,
      },
    });

    if (!item || item.scheduleId !== scheduleId) {
      throw new NotFoundException({
        code: 'PACKAGE_NOT_FOUND',
        message: 'Paket jadwal tidak ditemukan.',
      });
    }

    return this.mapToDto(item);
  }

  async create(
    scheduleId: string,
    payload: CreatePackagePayload,
    audit: AuditContext,
  ): Promise<SchedulePackage> {
    const schedule = await this.database.tripSchedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule) {
      throw new NotFoundException({
        code: 'SCHEDULE_NOT_FOUND',
        message: 'Jadwal perjalanan tidak ditemukan.',
      });
    }

    const validation = validateCreatePackage(payload);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Data paket jadwal tidak valid.',
        fields: validation.errors,
      });
    }

    const {
      name,
      description,
      price,
      meetingPointId,
      meetingDatetime,
      status,
      sortOrder,
    } = validation.data;

    if (meetingPointId) {
      const meetingPoint = await this.database.meetingPoint.findUnique({
        where: { id: meetingPointId },
      });
      if (!meetingPoint) {
        throw new NotFoundException({
          code: 'MEETING_POINT_NOT_FOUND',
          message: 'Titik temu yang dipilih tidak ditemukan.',
        });
      }
    }

    const item = await this.database.schedulePackage.create({
      data: {
        scheduleId,
        name,
        description: description || null,
        price,
        meetingPointId: meetingPointId || null,
        meetingDatetime: meetingDatetime ? new Date(meetingDatetime) : null,
        status: status || 'ACTIVE',
        sortOrder: sortOrder !== undefined ? sortOrder : 0,
      },
      include: {
        meetingPoint: true,
      },
    });

    if (audit.userId) {
      await this.database.auditLog.create({
        data: {
          adminUserId: audit.userId,
          action: 'PACKAGE_CREATE',
          entityType: 'SchedulePackage',
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
    scheduleId: string,
    packageId: string,
    payload: UpdatePackagePayload,
    audit: AuditContext,
  ): Promise<SchedulePackage> {
    const existing = await this.database.schedulePackage.findUnique({
      where: { id: packageId },
    });
    if (!existing || existing.scheduleId !== scheduleId) {
      throw new NotFoundException({
        code: 'PACKAGE_NOT_FOUND',
        message: 'Paket jadwal tidak ditemukan.',
      });
    }

    const validation = validateUpdatePackage(payload);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Data update paket jadwal tidak valid.',
        fields: validation.errors,
      });
    }

    const updateData: Record<string, unknown> = {};
    if (validation.data.name !== undefined)
      updateData.name = validation.data.name;
    if (validation.data.description !== undefined)
      updateData.description = validation.data.description;
    if (validation.data.price !== undefined)
      updateData.price = validation.data.price;
    if (validation.data.meetingPointId !== undefined) {
      if (validation.data.meetingPointId) {
        const mp = await this.database.meetingPoint.findUnique({
          where: { id: validation.data.meetingPointId },
        });
        if (!mp) {
          throw new NotFoundException({
            code: 'MEETING_POINT_NOT_FOUND',
            message: 'Titik temu yang dipilih tidak ditemukan.',
          });
        }
      }
      updateData.meetingPointId = validation.data.meetingPointId;
    }
    if (validation.data.meetingDatetime !== undefined) {
      updateData.meetingDatetime = validation.data.meetingDatetime
        ? new Date(validation.data.meetingDatetime)
        : null;
    }
    if (validation.data.status !== undefined)
      updateData.status = validation.data.status;
    if (validation.data.sortOrder !== undefined)
      updateData.sortOrder = validation.data.sortOrder;

    const updated = await this.database.schedulePackage.update({
      where: { id: packageId },
      data: updateData,
      include: {
        meetingPoint: true,
      },
    });

    if (audit.userId) {
      await this.database.auditLog.create({
        data: {
          adminUserId: audit.userId,
          action: 'PACKAGE_UPDATE',
          entityType: 'SchedulePackage',
          entityId: packageId,
          oldValue: existing as unknown as object,
          newValue: updated as unknown as object,
          ipAddress: audit.ipAddress || null,
          userAgent: audit.userAgent || null,
        },
      });
    }

    return this.mapToDto(updated);
  }

  async delete(
    scheduleId: string,
    packageId: string,
    audit: AuditContext,
  ): Promise<{ success: boolean }> {
    const existing = await this.database.schedulePackage.findUnique({
      where: { id: packageId },
    });
    if (!existing || existing.scheduleId !== scheduleId) {
      throw new NotFoundException({
        code: 'PACKAGE_NOT_FOUND',
        message: 'Paket jadwal tidak ditemukan.',
      });
    }

    const bookingCount = await this.database.booking.count({
      where: {
        packageId,
        status: { in: ['INQUIRY', 'PENDING_CONFIRMATION', 'CONFIRMED'] },
      },
    });

    if (bookingCount > 0) {
      throw new ConflictException({
        code: 'PACKAGE_HAS_BOOKINGS',
        message: `Paket memiliki ${bookingCount} pesanan aktif dan tidak dapat dihapus.`,
      });
    }

    await this.database.schedulePackage.delete({
      where: { id: packageId },
    });

    if (audit.userId) {
      await this.database.auditLog.create({
        data: {
          adminUserId: audit.userId,
          action: 'PACKAGE_DELETE',
          entityType: 'SchedulePackage',
          entityId: packageId,
          oldValue: existing as unknown as object,
          ipAddress: audit.ipAddress || null,
          userAgent: audit.userAgent || null,
        },
      });
    }

    return { success: true };
  }
}
