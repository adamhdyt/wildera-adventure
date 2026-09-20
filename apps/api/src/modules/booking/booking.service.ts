import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import {
  validateBookingQuery,
  validateCancelBooking,
  validateCreateBooking,
  validateUpdateBooking,
} from '@wildera/validation';
import type {
  AdminBookingItem,
  BookingListResponse,
  BookingQuery,
  CancelBookingPayload,
  CreateBookingPayload,
  UpdateBookingPayload,
} from '@wildera/types';

interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async list(rawQuery: Record<string, unknown>): Promise<BookingListResponse> {
    const query: BookingQuery = validateBookingQuery(rawQuery);
    const {
      page = 1,
      pageSize = 20,
      search,
      status,
      scheduleId,
      tripId,
      source,
      sortOrder = 'desc',
    } = query;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (scheduleId) {
      where.scheduleId = scheduleId;
    }

    if (tripId) {
      where.schedule = { tripId };
    }

    if (source) {
      where.source = source;
    }

    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactWhatsapp: { contains: search } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, rawItems] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: sortOrder },
        include: {
          customer: true,
          schedule: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              capacity: true,
              status: true,
              trip: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  mountain: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          package: {
            select: {
              id: true,
              name: true,
              price: true,
              meetingPoint: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          participants: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const items: AdminBookingItem[] = rawItems.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      customerId: b.customerId,
      scheduleId: b.scheduleId,
      packageId: b.packageId,
      status: b.status as AdminBookingItem['status'],
      source: b.source as AdminBookingItem['source'],
      participantCount: b.participantCount,
      totalAmount: b.totalAmount ? Number(b.totalAmount) : null,
      contactName: b.contactName,
      contactWhatsapp: b.contactWhatsapp,
      contactEmail: b.contactEmail,
      notes: b.notes,
      cancellationReason: b.cancellationReason,
      confirmedAt: b.confirmedAt,
      cancelledAt: b.cancelledAt,
      completedAt: b.completedAt,
      createdBy: b.createdBy,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      customer: b.customer,
      schedule: b.schedule
        ? {
            id: b.schedule.id,
            startDate: b.schedule.startDate,
            endDate: b.schedule.endDate,
            capacity: b.schedule.capacity,
            status: b.schedule.status,
            trip: b.schedule.trip,
          }
        : undefined,
      package: b.package
        ? {
            id: b.package.id,
            name: b.package.name,
            price: Number(b.package.price),
            meetingPoint: b.package.meetingPoint,
          }
        : undefined,
      participants: b.participants.map((p) => ({
        id: p.id,
        bookingId: p.bookingId,
        fullName: p.fullName,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender as AdminBookingItem['participants'] extends Array<
          infer T
        >
          ? T extends { gender?: infer G }
            ? G
            : never
          : never,
        phone: p.phone,
        identityType:
          p.identityType as AdminBookingItem['participants'] extends Array<
            infer T
          >
            ? T extends { identityType?: infer I }
              ? I
              : never
            : never,
        identityNumber: p.identityNumber,
        emergencyContactName: p.emergencyContactName,
        emergencyContactPhone: p.emergencyContactPhone,
        notes: p.notes,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      creator: b.creator,
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string): Promise<AdminBookingItem> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        schedule: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            capacity: true,
            status: true,
            trip: {
              select: {
                id: true,
                name: true,
                slug: true,
                mountain: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            price: true,
            meetingPoint: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        participants: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: `Booking dengan ID "${id}" tidak ditemukan.`,
      });
    }

    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      customerId: booking.customerId,
      scheduleId: booking.scheduleId,
      packageId: booking.packageId,
      status: booking.status as AdminBookingItem['status'],
      source: booking.source as AdminBookingItem['source'],
      participantCount: booking.participantCount,
      totalAmount: booking.totalAmount ? Number(booking.totalAmount) : null,
      contactName: booking.contactName,
      contactWhatsapp: booking.contactWhatsapp,
      contactEmail: booking.contactEmail,
      notes: booking.notes,
      cancellationReason: booking.cancellationReason,
      confirmedAt: booking.confirmedAt,
      cancelledAt: booking.cancelledAt,
      completedAt: booking.completedAt,
      createdBy: booking.createdBy,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      customer: booking.customer,
      schedule: booking.schedule
        ? {
            id: booking.schedule.id,
            startDate: booking.schedule.startDate,
            endDate: booking.schedule.endDate,
            capacity: booking.schedule.capacity,
            status: booking.schedule.status,
            trip: booking.schedule.trip,
          }
        : undefined,
      package: booking.package
        ? {
            id: booking.package.id,
            name: booking.package.name,
            price: Number(booking.package.price),
            meetingPoint: booking.package.meetingPoint,
          }
        : undefined,
      participants: booking.participants.map((p) => ({
        id: p.id,
        bookingId: p.bookingId,
        fullName: p.fullName,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender as AdminBookingItem['participants'] extends Array<
          infer T
        >
          ? T extends { gender?: infer G }
            ? G
            : never
          : never,
        phone: p.phone,
        identityType:
          p.identityType as AdminBookingItem['participants'] extends Array<
            infer T
          >
            ? T extends { identityType?: infer I }
              ? I
              : never
            : never,
        identityNumber: p.identityNumber,
        emergencyContactName: p.emergencyContactName,
        emergencyContactPhone: p.emergencyContactPhone,
        notes: p.notes,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      creator: booking.creator,
    };
  }

  async create(body: unknown, audit: AuditContext): Promise<AdminBookingItem> {
    const validation = validateCreateBooking(body);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Payload booking tidak valid.',
        errors: validation.errors,
      });
    }

    const payload: CreateBookingPayload = validation.data;

    if (!audit.userId) {
      throw new BadRequestException({
        code: 'AUTHENTICATED_USER_REQUIRED',
        message: 'Pengguna harus login untuk membuat booking.',
      });
    }

    // Verify Schedule exists
    const schedule = await this.prisma.tripSchedule.findUnique({
      where: { id: payload.scheduleId },
    });
    if (!schedule) {
      throw new NotFoundException({
        code: 'SCHEDULE_NOT_FOUND',
        message: `Jadwal dengan ID "${payload.scheduleId}" tidak ditemukan.`,
      });
    }

    // Verify Package exists & belongs to schedule
    const schedulePackage = await this.prisma.schedulePackage.findUnique({
      where: {
        id_scheduleId: {
          id: payload.packageId,
          scheduleId: payload.scheduleId,
        },
      },
    });
    if (!schedulePackage) {
      throw new NotFoundException({
        code: 'PACKAGE_NOT_FOUND',
        message: `Paket dengan ID "${payload.packageId}" tidak terhubung dengan jadwal ini.`,
      });
    }

    // Upsert Customer by normalized contactWhatsapp
    const existingCustomer = await this.prisma.customer.findFirst({
      where: { whatsappNumber: payload.contactWhatsapp },
    });

    let customerId: string;
    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update full name / email if provided and differs
      if (
        existingCustomer.fullName !== payload.contactName ||
        (payload.contactEmail &&
          existingCustomer.email !== payload.contactEmail)
      ) {
        await this.prisma.customer.update({
          where: { id: customerId },
          data: {
            fullName: payload.contactName,
            email: payload.contactEmail || existingCustomer.email,
          },
        });
      }
    } else {
      const newCustomer = await this.prisma.customer.create({
        data: {
          fullName: payload.contactName,
          whatsappNumber: payload.contactWhatsapp,
          email: payload.contactEmail || null,
        },
      });
      customerId = newCustomer.id;
    }

    // Calculate total amount
    const totalAmount =
      payload.totalAmount !== undefined
        ? payload.totalAmount
        : Number(schedulePackage.price) * payload.participantCount;

    // Generate unique booking number
    const bookingNumber = await this.generateUniqueBookingNumber();

    const initialStatus = payload.status || 'INQUIRY';
    const confirmedAt = initialStatus === 'CONFIRMED' ? new Date() : null;

    // Create booking and optional participants in a transaction
    const createdBooking = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          customerId,
          scheduleId: payload.scheduleId,
          packageId: payload.packageId,
          status: initialStatus,
          source: payload.source,
          participantCount: payload.participantCount,
          totalAmount,
          contactName: payload.contactName,
          contactWhatsapp: payload.contactWhatsapp,
          contactEmail: payload.contactEmail || null,
          notes: payload.notes || null,
          confirmedAt,
          createdBy: audit.userId!,
        },
      });

      if (payload.participants && payload.participants.length > 0) {
        await tx.bookingParticipant.createMany({
          data: payload.participants.map((p) => ({
            bookingId: booking.id,
            fullName: p.fullName,
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
            gender: p.gender || null,
            phone: p.phone || null,
            identityType: p.identityType || null,
            identityNumber: p.identityNumber || null,
            emergencyContactName: p.emergencyContactName || null,
            emergencyContactPhone: p.emergencyContactPhone || null,
            notes: p.notes || null,
          })),
        });
      }

      return booking;
    });

    const fullBooking = await this.getById(createdBooking.id);

    await this.logAudit({
      audit,
      action: 'BOOKING_CREATE',
      entityType: 'BOOKING',
      entityId: fullBooking.id,
      oldData: null,
      newData: fullBooking,
    });

    return fullBooking;
  }

  async update(
    id: string,
    body: unknown,
    audit: AuditContext,
  ): Promise<AdminBookingItem> {
    const validation = validateUpdateBooking(body);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Payload update booking tidak valid.',
        errors: validation.errors,
      });
    }

    const payload: UpdateBookingPayload = validation.data;

    const existing = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: `Booking dengan ID "${id}" tidak ditemukan.`,
      });
    }

    const updateData: Record<string, unknown> = {};

    if (payload.contactName !== undefined) {
      updateData.contactName = payload.contactName;
    }
    if (payload.contactWhatsapp !== undefined) {
      updateData.contactWhatsapp = payload.contactWhatsapp;
    }
    if (payload.contactEmail !== undefined) {
      updateData.contactEmail = payload.contactEmail;
    }
    if (payload.participantCount !== undefined) {
      updateData.participantCount = payload.participantCount;
    }
    if (payload.totalAmount !== undefined) {
      updateData.totalAmount = payload.totalAmount;
    }
    if (payload.notes !== undefined) {
      updateData.notes = payload.notes;
    }
    if (payload.cancellationReason !== undefined) {
      updateData.cancellationReason = payload.cancellationReason;
    }

    if (payload.status !== undefined && payload.status !== existing.status) {
      updateData.status = payload.status;
      if (payload.status === 'CONFIRMED' && !existing.confirmedAt) {
        updateData.confirmedAt = new Date();
      } else if (payload.status === 'CANCELLED' && !existing.cancelledAt) {
        updateData.cancelledAt = new Date();
      } else if (payload.status === 'COMPLETED' && !existing.completedAt) {
        updateData.completedAt = new Date();
      }
    }

    await this.prisma.booking.update({
      where: { id },
      data: updateData,
    });

    const updated = await this.getById(id);

    await this.logAudit({
      audit,
      action: 'BOOKING_UPDATE',
      entityType: 'BOOKING',
      entityId: id,
      oldData: existing,
      newData: updated,
    });

    return updated;
  }

  async confirm(id: string, audit: AuditContext): Promise<AdminBookingItem> {
    const existing = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: `Booking dengan ID "${id}" tidak ditemukan.`,
      });
    }

    if (existing.status === 'CONFIRMED') {
      return this.getById(id);
    }

    if (existing.status === 'CANCELLED') {
      throw new BadRequestException({
        code: 'CANNOT_CONFIRM_CANCELLED_BOOKING',
        message: 'Booking berstatus CANCELLED tidak dapat dikonfirmasi.',
      });
    }

    // Interactive transaction with pessimistic locking
    await this.prisma.$transaction(async (tx) => {
      // 1. Lock schedule row
      const schedules: Array<{ id: string; capacity: number; status: string }> =
        await tx.$queryRaw`
          SELECT id, capacity, status
          FROM trip_schedules
          WHERE id = ${existing.scheduleId}::uuid
          FOR UPDATE
        `;

      const schedule = schedules[0];
      if (!schedule) {
        throw new NotFoundException({
          code: 'SCHEDULE_NOT_FOUND',
          message: 'Jadwal trip tidak ditemukan.',
        });
      }

      if (schedule.status !== 'OPEN') {
        throw new ConflictException({
          code: 'SCHEDULE_NOT_OPEN',
          message: `Jadwal tidak berstatus OPEN (status saat ini: ${schedule.status}).`,
        });
      }

      // 2. Lock and read booking row inside transaction
      const bookings: Array<{
        id: string;
        status: string;
        participant_count: number;
      }> = await tx.$queryRaw`
        SELECT id, status, participant_count
        FROM bookings
        WHERE id = ${id}::uuid
        FOR UPDATE
      `;

      const currentBooking = bookings[0];
      if (!currentBooking) {
        throw new NotFoundException({
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking tidak ditemukan.',
        });
      }

      if (currentBooking.status === 'CONFIRMED') {
        return;
      }

      // 3. Calculate sum of confirmed seats on this schedule
      const confirmedRows: Array<{ confirmed_seats: number }> =
        await tx.$queryRaw`
          SELECT COALESCE(SUM(participant_count), 0)::int as confirmed_seats
          FROM bookings
          WHERE schedule_id = ${existing.scheduleId}::uuid
            AND status = 'CONFIRMED'
        `;

      const confirmedSeats = Number(confirmedRows[0]?.confirmed_seats || 0);
      const availableSeats = schedule.capacity - confirmedSeats;

      if (currentBooking.participant_count > availableSeats) {
        throw new ConflictException({
          code: 'INSUFFICIENT_CAPACITY',
          message: `Kapasitas jadwal tidak mencukupi. Sisa kursi: ${availableSeats}, diminta: ${currentBooking.participant_count}.`,
          details: {
            requestedSeats: currentBooking.participant_count,
            availableSeats,
            scheduleCapacity: schedule.capacity,
            confirmedSeats,
          },
        });
      }

      // 4. Update status to CONFIRMED
      await tx.$executeRaw`
        UPDATE bookings
        SET status = 'CONFIRMED', confirmed_at = NOW(), updated_at = NOW()
        WHERE id = ${id}::uuid
      `;
    });

    const updated = await this.getById(id);

    await this.logAudit({
      audit,
      action: 'BOOKING_CONFIRM',
      entityType: 'BOOKING',
      entityId: id,
      oldData: existing,
      newData: updated,
    });

    return updated;
  }

  async cancel(
    id: string,
    body: unknown,
    audit: AuditContext,
  ): Promise<AdminBookingItem> {
    const validation = validateCancelBooking(body);
    const payload: CancelBookingPayload = validation.data || {};

    const existing = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: `Booking dengan ID "${id}" tidak ditemukan.`,
      });
    }

    if (existing.status === 'CANCELLED') {
      throw new ConflictException({
        code: 'BOOKING_ALREADY_CANCELLED',
        message: 'Booking ini sudah dalam status dibatalkan (CANCELLED).',
      });
    }

    await this.prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason:
          payload.cancellationReason || existing.cancellationReason,
        cancelledAt: new Date(),
      },
    });

    const updated = await this.getById(id);

    await this.logAudit({
      audit,
      action: 'BOOKING_CANCEL',
      entityType: 'BOOKING',
      entityId: id,
      oldData: existing,
      newData: updated,
    });

    return updated;
  }

  async delete(
    id: string,
    audit: AuditContext,
  ): Promise<{ success: boolean; id: string }> {
    const existing = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: `Booking dengan ID "${id}" tidak ditemukan.`,
      });
    }

    if (existing.status === 'CONFIRMED') {
      throw new ConflictException({
        code: 'CANNOT_DELETE_CONFIRMED_BOOKING',
        message:
          'Booking berstatus CONFIRMED tidak dapat dihapus. Batalkan booking terlebih dahulu.',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.bookingParticipant.deleteMany({
        where: { bookingId: id },
      });
      await tx.booking.delete({
        where: { id },
      });
    });

    await this.logAudit({
      audit,
      action: 'BOOKING_DELETE',
      entityType: 'BOOKING',
      entityId: id,
      oldData: existing,
      newData: null,
    });

    return { success: true, id };
  }

  private async generateUniqueBookingNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    for (let attempt = 0; attempt < 10; attempt++) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
      const candidate = `BK-${dateStr}-${randomSuffix}`;
      const existing = await this.prisma.booking.findUnique({
        where: { bookingNumber: candidate },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }
    }

    // Fallback timestamp suffix
    return `BK-${dateStr}-${Date.now().toString().slice(-4)}`;
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
