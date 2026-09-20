import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import {
  validateCreateParticipant,
  validateUpdateParticipant,
} from '@wildera/validation';
import type {
  BookingParticipantItem,
  GenderType,
  IdentityType,
} from '@wildera/types';

export interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ParticipantService {
  constructor(private readonly prisma: PrismaService) {}

  async list(bookingId: string): Promise<BookingParticipantItem[]> {
    const participants = await this.prisma.bookingParticipant.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    });

    return participants.map((p) => this.mapToItem(p));
  }

  async getById(
    bookingId: string,
    id: string,
  ): Promise<BookingParticipantItem> {
    const participant = await this.prisma.bookingParticipant.findFirst({
      where: { id, bookingId },
    });

    if (!participant) {
      throw new NotFoundException({
        code: 'PARTICIPANT_NOT_FOUND',
        message: 'Data peserta tidak ditemukan.',
      });
    }

    return this.mapToItem(participant);
  }

  async create(
    bookingId: string,
    payload: unknown,
    audit: AuditContext,
  ): Promise<BookingParticipantItem> {
    const validation = validateCreateParticipant(payload);
    if (!validation.valid || !validation.data) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Data peserta tidak valid.',
        details: validation.errors,
      });
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, participantCount: true },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Booking tidak ditemukan.',
      });
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException({
        code: 'CANNOT_MODIFY_CANCELLED_BOOKING',
        message:
          'Tidak dapat menambahkan peserta pada booking berstatus CANCELLED.',
      });
    }

    const created = await this.prisma.bookingParticipant.create({
      data: {
        bookingId,
        fullName: validation.data.fullName,
        dateOfBirth: validation.data.dateOfBirth,
        gender: validation.data.gender,
        phone: validation.data.phone,
        identityType: validation.data.identityType,
        identityNumber: validation.data.identityNumber,
        emergencyContactName: validation.data.emergencyContactName,
        emergencyContactPhone: validation.data.emergencyContactPhone,
        notes: validation.data.notes,
      },
    });

    const result = this.mapToItem(created);

    await this.logAudit({
      audit,
      action: 'PARTICIPANT_ADD',
      entityType: 'BOOKING_PARTICIPANT',
      entityId: created.id,
      oldData: null,
      newData: result,
    });

    return result;
  }

  async update(
    bookingId: string,
    id: string,
    payload: unknown,
    audit: AuditContext,
  ): Promise<BookingParticipantItem> {
    const existing = await this.prisma.bookingParticipant.findFirst({
      where: { id, bookingId },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'PARTICIPANT_NOT_FOUND',
        message: 'Data peserta tidak ditemukan.',
      });
    }

    const validation = validateUpdateParticipant(payload);
    if (!validation.valid || !validation.data) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Data update peserta tidak valid.',
        details: validation.errors,
      });
    }

    const updated = await this.prisma.bookingParticipant.update({
      where: { id },
      data: validation.data,
    });

    const result = this.mapToItem(updated);

    await this.logAudit({
      audit,
      action: 'PARTICIPANT_UPDATE',
      entityType: 'BOOKING_PARTICIPANT',
      entityId: id,
      oldData: existing,
      newData: result,
    });

    return result;
  }

  async delete(
    bookingId: string,
    id: string,
    audit: AuditContext,
  ): Promise<{ success: true; id: string }> {
    const existing = await this.prisma.bookingParticipant.findFirst({
      where: { id, bookingId },
      include: { booking: { select: { status: true } } },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'PARTICIPANT_NOT_FOUND',
        message: 'Data peserta tidak ditemukan.',
      });
    }

    if (
      existing.booking.status === 'CANCELLED' ||
      existing.booking.status === 'COMPLETED'
    ) {
      throw new BadRequestException({
        code: 'CANNOT_DELETE_PARTICIPANT',
        message: `Tidak dapat menghapus peserta pada booking berstatus ${existing.booking.status}.`,
      });
    }

    await this.prisma.bookingParticipant.delete({
      where: { id },
    });

    await this.logAudit({
      audit,
      action: 'PARTICIPANT_DELETE',
      entityType: 'BOOKING_PARTICIPANT',
      entityId: id,
      oldData: existing,
      newData: null,
    });

    return { success: true, id };
  }

  private mapToItem(p: {
    id: string;
    bookingId: string;
    fullName: string;
    dateOfBirth: Date | null;
    gender: string | null;
    phone: string | null;
    identityType: string | null;
    identityNumber: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): BookingParticipantItem {
    return {
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
    };
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
      // Non-blocking audit
    }
  }
}
