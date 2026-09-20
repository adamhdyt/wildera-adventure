import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import {
  computeAvailability,
  validateCreateSchedule,
  validateScheduleQuery,
  validateUpdateSchedule,
} from '@wildera/validation';
import type {
  BookingStatus,
  CreateSchedulePayload,
  GenderType,
  IdentityType,
  ScheduleListResponse,
  ScheduleManifestBooking,
  ScheduleManifestParticipant,
  ScheduleManifestSummary,
  ScheduleQueryPayload,
  ScheduleStatus,
  TripSchedule,
  UpdateSchedulePayload,
} from '@wildera/types';

interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async list(rawQuery: Record<string, unknown>): Promise<ScheduleListResponse> {
    const query: ScheduleQueryPayload = validateScheduleQuery(rawQuery);
    const { tripId, status, fromDate, toDate, page = 1, pageSize = 20 } = query;

    const where: Record<string, unknown> = {};

    if (tripId) {
      where.tripId = tripId;
    }

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.startDate = {};
      if (fromDate) {
        (where.startDate as Record<string, unknown>).gte = new Date(fromDate);
      }
      if (toDate) {
        (where.startDate as Record<string, unknown>).lte = new Date(toDate);
      }
    }

    const [total, records] = await Promise.all([
      this.prisma.tripSchedule.count({ where }),
      this.prisma.tripSchedule.findMany({
        where,
        include: {
          trip: {
            select: {
              id: true,
              name: true,
              slug: true,
              tripType: true,
            },
          },
          bookings: {
            where: {
              status: { in: ['CONFIRMED', 'COMPLETED'] },
            },
            select: {
              participantCount: true,
            },
          },
          packages: {
            select: {
              id: true,
              scheduleId: true,
              name: true,
              description: true,
              price: true,
              meetingPointId: true,
              meetingDatetime: true,
              status: true,
              sortOrder: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
        orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const data: TripSchedule[] = records.map((record) => {
      const confirmedSeats = record.bookings.reduce(
        (sum: number, b: { participantCount: number }) =>
          sum + (b.participantCount || 0),
        0,
      );
      const { availableSeats, availabilityStatus } = computeAvailability(
        record.capacity,
        confirmedSeats,
      );

      const startStr = record.startDate.toISOString().split('T')[0] ?? '';
      const endStr = record.endDate.toISOString().split('T')[0] ?? '';

      return {
        id: record.id,
        tripId: record.tripId,
        startDate: startStr,
        endDate: endStr,
        registrationDeadline: record.registrationDeadline
          ? record.registrationDeadline.toISOString()
          : null,
        capacity: record.capacity,
        minimumParticipants: record.minimumParticipants,
        status: record.status as ScheduleStatus,
        notes: record.notes,
        createdBy: record.createdBy,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        trip: record.trip,
        confirmedSeats,
        availableSeats,
        availabilityStatus,
        packages: record.packages?.map((pkg) => ({
          id: pkg.id,
          scheduleId: pkg.scheduleId,
          name: pkg.name,
          description: pkg.description,
          price: Number(pkg.price),
          meetingPointId: pkg.meetingPointId,
          meetingDatetime: pkg.meetingDatetime?.toISOString() ?? null,
          status: pkg.status as 'ACTIVE' | 'INACTIVE',
          sortOrder: pkg.sortOrder,
          createdAt: pkg.createdAt.toISOString(),
          updatedAt: pkg.updatedAt.toISOString(),
        })),
      };
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async getById(id: string): Promise<TripSchedule> {
    const record = await this.prisma.tripSchedule.findUnique({
      where: { id },
      include: {
        trip: {
          select: {
            id: true,
            name: true,
            slug: true,
            tripType: true,
          },
        },
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'COMPLETED'] },
          },
          select: {
            participantCount: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException({
        code: 'SCHEDULE_NOT_FOUND',
        message: `Jadwal dengan ID "${id}" tidak ditemukan.`,
      });
    }

    const confirmedSeats = record.bookings.reduce(
      (sum: number, b: { participantCount: number }) =>
        sum + (b.participantCount || 0),
      0,
    );
    const { availableSeats, availabilityStatus } = computeAvailability(
      record.capacity,
      confirmedSeats,
    );

    const startStr = record.startDate.toISOString().split('T')[0] ?? '';
    const endStr = record.endDate.toISOString().split('T')[0] ?? '';

    return {
      id: record.id,
      tripId: record.tripId,
      startDate: startStr,
      endDate: endStr,
      registrationDeadline: record.registrationDeadline
        ? record.registrationDeadline.toISOString()
        : null,
      capacity: record.capacity,
      minimumParticipants: record.minimumParticipants,
      status: record.status as ScheduleStatus,
      notes: record.notes,
      createdBy: record.createdBy,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      trip: record.trip,
      confirmedSeats,
      availableSeats,
      availabilityStatus,
    };
  }

  async getManifest(scheduleId: string): Promise<ScheduleManifestSummary> {
    const schedule = await this.prisma.tripSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        trip: {
          select: {
            id: true,
            name: true,
            slug: true,
            tripType: true,
          },
        },
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'COMPLETED'] },
          },
          include: {
            package: {
              select: {
                name: true,
              },
            },
            participants: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException({
        code: 'SCHEDULE_NOT_FOUND',
        message: `Jadwal dengan ID "${scheduleId}" tidak ditemukan.`,
      });
    }

    const confirmedSeats = schedule.bookings.reduce(
      (sum: number, b: { participantCount: number }) =>
        sum + (b.participantCount || 0),
      0,
    );
    const { availableSeats } = computeAvailability(
      schedule.capacity,
      confirmedSeats,
    );

    const startStr = schedule.startDate.toISOString().split('T')[0] ?? '';
    const endStr = schedule.endDate.toISOString().split('T')[0] ?? '';

    let completedParticipantsCount = 0;
    const participantList: ScheduleManifestParticipant[] = [];

    const bookings: ScheduleManifestBooking[] = schedule.bookings.map((b) => {
      completedParticipantsCount += b.participants.length;

      for (const p of b.participants) {
        participantList.push({
          id: p.id,
          bookingId: b.id,
          bookingCode: b.bookingNumber,
          customerName: b.contactName,
          customerPhone: b.contactWhatsapp,
          fullName: p.fullName,
          dateOfBirth: p.dateOfBirth
            ? p.dateOfBirth.toISOString().split('T')[0]
            : null,
          gender: p.gender as GenderType | null,
          phone: p.phone,
          identityType: p.identityType as IdentityType | null,
          identityNumber: p.identityNumber,
          emergencyContactName: p.emergencyContactName,
          emergencyContactPhone: p.emergencyContactPhone,
          notes: p.notes,
          packageName: b.package?.name ?? null,
        });
      }

      return {
        id: b.id,
        bookingCode: b.bookingNumber,
        customerName: b.contactName,
        customerPhone: b.contactWhatsapp,
        customerEmail: b.contactEmail ?? '',
        status: b.status as BookingStatus,
        packageName: b.package?.name ?? 'Standard',
        participantCount: b.participantCount,
        completedCount: b.participants.length,
        participants: b.participants.map((p) => ({
          id: p.id,
          bookingId: p.bookingId,
          fullName: p.fullName,
          dateOfBirth: p.dateOfBirth
            ? p.dateOfBirth.toISOString().split('T')[0]
            : null,
          gender: p.gender as GenderType | null,
          phone: p.phone,
          identityType: p.identityType as IdentityType | null,
          identityNumber: p.identityNumber,
          emergencyContactName: p.emergencyContactName,
          emergencyContactPhone: p.emergencyContactPhone,
          notes: p.notes,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
      };
    });

    return {
      trip: schedule.trip,
      schedule: {
        id: schedule.id,
        startDate: startStr,
        endDate: endStr,
        status: schedule.status as ScheduleStatus,
        capacity: schedule.capacity,
        confirmedSeats,
        availableSeats,
      },
      confirmedBookingsCount: schedule.bookings.length,
      expectedParticipants: confirmedSeats,
      completedParticipantsCount,
      bookings,
      participantList,
    };
  }

  async create(payload: unknown, audit: AuditContext): Promise<TripSchedule> {
    const validation = validateCreateSchedule(payload);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Data jadwal yang dikirimkan tidak valid.',
        fields: validation.errors,
      });
    }

    const data: CreateSchedulePayload = validation.data;

    // Verify trip exists
    const trip = await this.prisma.trip.findFirst({
      where: { id: data.tripId, deletedAt: null },
    });

    if (!trip) {
      throw new NotFoundException({
        code: 'TRIP_NOT_FOUND',
        message: `Trip dengan ID "${data.tripId}" tidak ditemukan.`,
      });
    }

    if (!audit.userId) {
      throw new BadRequestException({
        code: 'AUTHENTICATED_USER_REQUIRED',
        message: 'Pengguna terautentikasi dibutuhkan untuk membuat jadwal.',
      });
    }

    const created = await this.prisma.tripSchedule.create({
      data: {
        tripId: data.tripId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        registrationDeadline: data.registrationDeadline
          ? new Date(data.registrationDeadline)
          : null,
        capacity: data.capacity,
        minimumParticipants: data.minimumParticipants ?? null,
        status: 'DRAFT',
        notes: data.notes ?? null,
        createdBy: audit.userId,
      },
    });

    await this.logAudit({
      audit,
      action: 'SCHEDULE_CREATE',
      entityType: 'SCHEDULE',
      entityId: created.id,
      oldData: null,
      newData: {
        tripId: created.tripId,
        startDate: created.startDate,
        endDate: created.endDate,
        capacity: created.capacity,
        status: created.status,
      },
    });

    return this.getById(created.id);
  }

  async update(
    id: string,
    payload: unknown,
    audit: AuditContext,
  ): Promise<TripSchedule> {
    const existing = await this.prisma.tripSchedule.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
          select: { participantCount: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'SCHEDULE_NOT_FOUND',
        message: `Jadwal dengan ID "${id}" tidak ditemukan.`,
      });
    }

    const validation = validateUpdateSchedule(payload);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Data pembaruan jadwal tidak valid.',
        fields: validation.errors,
      });
    }

    const data: UpdateSchedulePayload = validation.data;

    const confirmedSeats = existing.bookings.reduce(
      (sum: number, b: { participantCount: number }) =>
        sum + (b.participantCount || 0),
      0,
    );

    // Conflict check if capacity is lower than confirmed participants
    if (data.capacity !== undefined && data.capacity < confirmedSeats) {
      throw new ConflictException({
        code: 'CAPACITY_BELOW_CONFIRMED',
        message: `Capacity tidak dapat lebih kecil dari ${confirmedSeats} peserta terkonfirmasi.`,
      });
    }

    const updateData: Record<string, unknown> = {};

    if (data.startDate !== undefined) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate !== undefined) {
      updateData.endDate = new Date(data.endDate);
    }
    if (data.registrationDeadline !== undefined) {
      updateData.registrationDeadline = data.registrationDeadline
        ? new Date(data.registrationDeadline)
        : null;
    }
    if (data.capacity !== undefined) {
      updateData.capacity = data.capacity;
    }
    if (data.minimumParticipants !== undefined) {
      updateData.minimumParticipants = data.minimumParticipants;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    const updated = await this.prisma.tripSchedule.update({
      where: { id },
      data: updateData,
    });

    await this.logAudit({
      audit,
      action: 'SCHEDULE_UPDATE',
      entityType: 'SCHEDULE',
      entityId: id,
      oldData: {
        capacity: existing.capacity,
        status: existing.status,
        startDate: existing.startDate,
        endDate: existing.endDate,
      },
      newData: updateData,
    });

    if (
      updateData.capacity !== undefined &&
      updateData.capacity !== existing.capacity
    ) {
      await this.logAudit({
        audit,
        action: 'SCHEDULE_CAPACITY_CHANGED',
        entityType: 'SCHEDULE',
        entityId: id,
        oldData: { capacity: existing.capacity },
        newData: { capacity: updateData.capacity },
      });
    }

    return this.getById(updated.id);
  }

  async setStatus(
    id: string,
    status: ScheduleStatus,
    audit: AuditContext,
    reason?: string,
  ): Promise<TripSchedule> {
    const existing = await this.prisma.tripSchedule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'SCHEDULE_NOT_FOUND',
        message: `Jadwal dengan ID "${id}" tidak ditemukan.`,
      });
    }

    const updateData: Record<string, unknown> = { status };
    if (reason && status === 'CANCELLED') {
      const existingNotes = existing.notes ? `${existing.notes}\n` : '';
      updateData.notes = `${existingNotes}[PEMBATALAN]: ${reason}`.trim();
    }

    const updated = await this.prisma.tripSchedule.update({
      where: { id },
      data: updateData,
    });

    await this.logAudit({
      audit,
      action:
        status === 'CANCELLED' ? 'SCHEDULE_CANCEL' : 'SCHEDULE_STATUS_CHANGE',
      entityType: 'SCHEDULE',
      entityId: id,
      oldData: { status: existing.status },
      newData: { status: updated.status, reason },
    });

    return this.getById(updated.id);
  }

  async delete(
    id: string,
    audit: AuditContext,
  ): Promise<{ success: boolean; id: string }> {
    const existing = await this.prisma.tripSchedule.findUnique({
      where: { id },
      include: {
        bookings: { select: { id: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'SCHEDULE_NOT_FOUND',
        message: `Jadwal dengan ID "${id}" tidak ditemukan.`,
      });
    }

    if (existing.bookings.length > 0) {
      throw new ConflictException({
        code: 'SCHEDULE_HAS_BOOKINGS',
        message: `Jadwal tidak dapat dihapus karena memiliki ${existing.bookings.length} pesanan. Batalkan statusnya jika diperlukan.`,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.schedulePackage.deleteMany({
        where: { scheduleId: id },
      });
      await tx.tripSchedule.delete({
        where: { id },
      });
    });

    await this.logAudit({
      audit,
      action: 'SCHEDULE_DELETE',
      entityType: 'SCHEDULE',
      entityId: id,
      oldData: { tripId: existing.tripId, status: existing.status },
      newData: null,
    });

    return { success: true, id };
  }

  private async logAudit(params: {
    audit: AuditContext;
    action: string;
    entityType: string;
    entityId: string;
    oldData: unknown;
    newData: unknown;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminUserId: params.audit.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValue:
            params.oldData !== null ? (params.oldData as object) : undefined,
          newValue:
            params.newData !== null ? (params.newData as object) : undefined,
          ipAddress: params.audit.ipAddress ?? null,
          userAgent: params.audit.userAgent ?? null,
        },
      });
    } catch {
      // Non-blocking audit logger
    }
  }
}
