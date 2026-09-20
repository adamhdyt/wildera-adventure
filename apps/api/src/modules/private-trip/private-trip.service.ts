import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import {
  validateCreatePrivateTripInquiry,
  validateUpdatePrivateTripInquiry,
  validatePrivateTripInquiryQuery,
} from '@wildera/validation';
import type {
  PrivateTripInquiry,
  PrivateTripInquiryListResponse,
  PrivateTripStatus,
} from '@wildera/types';
import { randomBytes } from 'crypto';

export interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class PrivateTripService {
  constructor(private readonly prisma: PrismaService) {}

  async createInquiry(
    rawBody: unknown,
  ): Promise<{ inquiry: PrivateTripInquiry; whatsappUrl: string }> {
    const val = validateCreatePrivateTripInquiry(rawBody);
    if (!val.valid || !val.data) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validasi form permintaan private trip gagal.',
        errors: val.errors,
      });
    }

    const payload = val.data;

    if (payload.mountainId) {
      const mountain = await this.prisma.mountain.findUnique({
        where: { id: payload.mountainId },
      });
      if (!mountain) {
        throw new NotFoundException({
          statusCode: 404,
          message: 'Gunung destinasi yang dipilih tidak ditemukan.',
        });
      }
    }

    const inquiryNumber = await this.generateInquiryNumber();

    const created = await this.prisma.privateTripInquiry.create({
      data: {
        inquiryNumber,
        mountainId: payload.mountainId ?? null,
        destinationOther: payload.destinationOther ?? null,
        customerName: payload.customerName,
        whatsappNumber: payload.whatsappNumber,
        email: payload.email ?? null,
        preferredDate: new Date(payload.preferredDate),
        alternativeDate: payload.alternativeDate
          ? new Date(payload.alternativeDate)
          : null,
        participantCount: payload.participantCount,
        meetingPointRequest: payload.meetingPointRequest,
        budget:
          payload.budget !== undefined && payload.budget !== null
            ? payload.budget
            : null,
        requirements: payload.requirements ?? null,
        status: 'NEW',
      },
      include: {
        mountain: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        assignedAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const inquiry = this.mapToInquiry(created);

    const destinationName =
      created.mountain?.name ?? created.destinationOther ?? 'Destinasi Kustom';
    const waText = encodeURIComponent(
      `Halo Admin Wildera Adventure! Saya ingin konsultasi Private Trip.\n\n` +
        `Nomor Tiket: ${inquiry.inquiryNumber}\n` +
        `Nama: ${inquiry.customerName}\n` +
        `Destinasi: ${destinationName}\n` +
        `Rencana Tanggal: ${inquiry.preferredDate}\n` +
        `Jumlah Peserta: ${inquiry.participantCount} Orang\n` +
        `Meeting Point: ${inquiry.meetingPointRequest ?? '-'}\n\n` +
        `Mohon info penawaran dan ketersediaan tim. Terima kasih!`,
    );

    const adminWhatsAppNumber =
      process.env.ADMIN_WHATSAPP_NUMBER ||
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
      '6281234567890';
    const cleanNumber = adminWhatsAppNumber.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${waText}`;

    return { inquiry, whatsappUrl };
  }

  async findAll(
    rawQuery: Record<string, unknown>,
  ): Promise<PrivateTripInquiryListResponse> {
    const val = validatePrivateTripInquiryQuery(rawQuery);
    if (!val.valid || !val.data) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Parameter query private trip tidak valid.',
        errors: val.errors,
      });
    }

    const { status, search, page = 1, pageSize = 20 } = val.data;

    const where: Prisma.PrivateTripInquiryWhereInput = {};
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { whatsappNumber: { contains: search, mode: 'insensitive' } },
        { inquiryNumber: { contains: search, mode: 'insensitive' } },
        { destinationOther: { contains: search, mode: 'insensitive' } },
        { mountain: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.privateTripInquiry.count({ where }),
      this.prisma.privateTripInquiry.findMany({
        where,
        include: {
          mountain: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          assignedAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: items.map((item) => this.mapToInquiry(item)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async findById(id: string): Promise<PrivateTripInquiry> {
    const item = await this.prisma.privateTripInquiry.findUnique({
      where: { id },
      include: {
        mountain: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        assignedAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Data permintaan private trip tidak ditemukan.',
      });
    }

    return this.mapToInquiry(item);
  }

  async update(
    id: string,
    rawBody: unknown,
    audit?: AuditContext,
  ): Promise<PrivateTripInquiry> {
    const val = validateUpdatePrivateTripInquiry(rawBody);
    if (!val.valid || !val.data) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validasi update private trip inquiry gagal.',
        errors: val.errors,
      });
    }

    const existing = await this.prisma.privateTripInquiry.findUnique({
      where: { id },
      include: {
        mountain: true,
        assignedAdmin: true,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Data permintaan private trip tidak ditemukan.',
      });
    }

    const payload = val.data;

    if (payload.assignedAdminId) {
      const admin = await this.prisma.adminUser.findUnique({
        where: { id: payload.assignedAdminId },
      });
      if (!admin) {
        throw new NotFoundException({
          statusCode: 404,
          message: 'Admin yang ditugaskan tidak ditemukan.',
        });
      }
    }

    const dataToUpdate: Prisma.PrivateTripInquiryUpdateInput = {};
    if (payload.status !== undefined) {
      dataToUpdate.status = payload.status;
    }
    if (payload.assignedAdminId !== undefined) {
      dataToUpdate.assignedAdmin = payload.assignedAdminId
        ? { connect: { id: payload.assignedAdminId } }
        : { disconnect: true };
    }
    if (payload.adminNotes !== undefined) {
      dataToUpdate.adminNotes = payload.adminNotes;
    }

    const updated = await this.prisma.privateTripInquiry.update({
      where: { id },
      data: dataToUpdate,
      include: {
        mountain: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        assignedAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (audit) {
      await this.logAudit({
        audit,
        action: 'PRIVATE_TRIP_INQUIRY_UPDATE',
        entityType: 'PRIVATE_TRIP_INQUIRY',
        entityId: id,
        oldData: {
          status: existing.status,
          assignedAdminId: existing.assignedAdminId,
          adminNotes: existing.adminNotes,
        },
        newData: {
          status: updated.status,
          assignedAdminId: updated.assignedAdminId,
          adminNotes: updated.adminNotes,
        },
      });
    }

    return this.mapToInquiry(updated);
  }

  async delete(id: string, audit?: AuditContext): Promise<void> {
    const existing = await this.prisma.privateTripInquiry.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Data permintaan private trip tidak ditemukan.',
      });
    }

    await this.prisma.privateTripInquiry.delete({
      where: { id },
    });

    if (audit) {
      await this.logAudit({
        audit,
        action: 'PRIVATE_TRIP_INQUIRY_DELETE',
        entityType: 'PRIVATE_TRIP_INQUIRY',
        entityId: id,
        oldData: existing,
        newData: null,
      });
    }
  }

  private async generateInquiryNumber(): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let i = 0; i < 5; i++) {
      const randomSuffix = randomBytes(2).toString('hex').toUpperCase();
      const candidate = `PT-${dateStr}-${randomSuffix}`;
      const found = await this.prisma.privateTripInquiry.findUnique({
        where: { inquiryNumber: candidate },
      });
      if (!found) {
        return candidate;
      }
    }
    return `PT-${dateStr}-${Date.now().toString().slice(-4)}`;
  }

  private mapToInquiry(
    item: Prisma.PrivateTripInquiryGetPayload<{
      include: {
        mountain: {
          select: {
            id: true;
            name: true;
            slug: true;
          };
        };
        assignedAdmin: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    }>,
  ): PrivateTripInquiry {
    return {
      id: item.id,
      inquiryNumber: item.inquiryNumber,
      mountainId: item.mountainId,
      destinationOther: item.destinationOther,
      customerName: item.customerName,
      whatsappNumber: item.whatsappNumber,
      email: item.email,
      preferredDate:
        (item.preferredDate instanceof Date
          ? item.preferredDate.toISOString()
          : String(item.preferredDate)
        ).split('T')[0] ?? '',
      alternativeDate: item.alternativeDate
        ? ((item.alternativeDate instanceof Date
            ? item.alternativeDate.toISOString()
            : String(item.alternativeDate)
          ).split('T')[0] ?? null)
        : null,
      participantCount: item.participantCount,
      meetingPointRequest: item.meetingPointRequest,
      budget:
        item.budget !== null && item.budget !== undefined
          ? Number(item.budget)
          : null,
      requirements: item.requirements,
      status: item.status as PrivateTripStatus,
      assignedAdminId: item.assignedAdminId,
      adminNotes: item.adminNotes,
      createdAt:
        item.createdAt instanceof Date
          ? item.createdAt.toISOString()
          : String(item.createdAt),
      updatedAt:
        item.updatedAt instanceof Date
          ? item.updatedAt.toISOString()
          : String(item.updatedAt),
      mountain: item.mountain
        ? {
            id: item.mountain.id,
            name: item.mountain.name,
            slug: item.mountain.slug,
          }
        : null,
      assignedAdmin: item.assignedAdmin
        ? {
            id: item.assignedAdmin.id,
            name: item.assignedAdmin.name,
            email: item.assignedAdmin.email,
          }
        : null,
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
          adminUserId: params.audit.userId ?? null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValue: params.oldData as Prisma.InputJsonValue,
          newValue: params.newData as Prisma.InputJsonValue,
          ipAddress: params.audit.ipAddress ?? '127.0.0.1',
          userAgent: params.audit.userAgent ?? 'System',
        },
      });
    } catch {
      // Audit fail non-blocking
    }
  }
}
