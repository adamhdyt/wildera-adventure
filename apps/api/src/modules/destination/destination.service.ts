import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import {
  validateCreateDestination,
  validateDestinationQuery,
  validateUpdateDestination,
} from '@wildera/validation';
import type { Destination, DestinationListResponse } from '@wildera/types';
import { DestinationStatus, Prisma } from '../../generated/prisma/client';

export interface AuditContext {
  adminUserId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class DestinationService {
  constructor(private readonly prisma: PrismaService) {}

  async list(queryInput: unknown): Promise<DestinationListResponse> {
    const query = validateDestinationQuery(queryInput);
    const where: Prisma.DestinationWhereInput = {
      deletedAt: null,
    };

    if (query.status && query.status !== 'ALL') {
      where.status = query.status as DestinationStatus;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { province: { contains: query.search, mode: 'insensitive' } },
        { region: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.destination.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: [{ name: 'asc' }],
        include: {
          _count: {
            select: { mountains: true },
          },
        },
      }),
      this.prisma.destination.count({ where }),
    ]);

    return {
      items: items as unknown as Destination[],
      total,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    };
  }

  async getById(id: string): Promise<Destination> {
    const destination = await this.prisma.destination.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { mountains: true },
        },
      },
    });

    if (!destination) {
      throw new NotFoundException({
        code: 'DESTINATION_NOT_FOUND',
        message: 'Destinasi tidak ditemukan.',
      });
    }

    return destination as unknown as Destination;
  }

  async create(body: unknown, audit?: AuditContext): Promise<Destination> {
    const validation = validateCreateDestination(body);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Beberapa data belum valid.',
        fields: validation.errors,
      });
    }

    const input = validation.data;

    // Check slug collision
    const existing = await this.prisma.destination.findFirst({
      where: {
        slug: input.slug,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'SLUG_ALREADY_EXISTS',
        message: 'Slug sudah digunakan.',
      });
    }

    const created = await this.prisma.destination.create({
      data: {
        name: input.name,
        slug: input.slug!,
        province: input.province ?? null,
        region: input.region ?? null,
        description: input.description ?? null,
        status: (input.status ?? 'ACTIVE') as DestinationStatus,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
      },
    });

    if (audit?.adminUserId) {
      await this.logAudit({
        action: 'DESTINATION_CREATE',
        entityId: created.id,
        newValue: created as unknown as Prisma.InputJsonValue,
        audit,
      });
    }

    return created as unknown as Destination;
  }

  async update(
    id: string,
    body: unknown,
    audit?: AuditContext,
  ): Promise<Destination> {
    const validation = validateUpdateDestination(body);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Beberapa data belum valid.',
        fields: validation.errors,
      });
    }

    const current = await this.prisma.destination.findFirst({
      where: { id, deletedAt: null },
    });

    if (!current) {
      throw new NotFoundException({
        code: 'DESTINATION_NOT_FOUND',
        message: 'Destinasi tidak ditemukan.',
      });
    }

    const input = validation.data;

    // Check slug collision if slug changed
    if (input.slug && input.slug !== current.slug) {
      const slugCollision = await this.prisma.destination.findFirst({
        where: {
          slug: input.slug,
          NOT: { id },
          deletedAt: null,
        },
      });

      if (slugCollision) {
        throw new ConflictException({
          code: 'SLUG_ALREADY_EXISTS',
          message: 'Slug sudah digunakan.',
        });
      }
    }

    const updated = await this.prisma.destination.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.province !== undefined ? { province: input.province } : {}),
        ...(input.region !== undefined ? { region: input.region } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.status !== undefined
          ? { status: input.status as DestinationStatus }
          : {}),
        ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
        ...(input.seoDescription !== undefined
          ? { seoDescription: input.seoDescription }
          : {}),
      },
    });

    if (audit?.adminUserId) {
      await this.logAudit({
        action: 'DESTINATION_UPDATE',
        entityId: id,
        oldValue: current as unknown as Prisma.InputJsonValue,
        newValue: updated as unknown as Prisma.InputJsonValue,
        audit,
      });
    }

    return updated as unknown as Destination;
  }

  async delete(
    id: string,
    audit?: AuditContext,
  ): Promise<{ success: boolean }> {
    const current = await this.prisma.destination.findFirst({
      where: { id, deletedAt: null },
    });

    if (!current) {
      throw new NotFoundException({
        code: 'DESTINATION_NOT_FOUND',
        message: 'Destinasi tidak ditemukan.',
      });
    }

    const updated = await this.prisma.destination.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: DestinationStatus.INACTIVE,
      },
    });

    if (audit?.adminUserId) {
      await this.logAudit({
        action: 'DESTINATION_DELETE',
        entityId: id,
        oldValue: current as unknown as Prisma.InputJsonValue,
        newValue: updated as unknown as Prisma.InputJsonValue,
        audit,
      });
    }

    return { success: true };
  }

  async listPublic() {
    const records = await this.prisma.destination.findMany({
      where: {
        status: DestinationStatus.ACTIVE,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
      include: {
        mountains: {
          where: { status: 'PUBLISHED', deletedAt: null },
          select: { id: true, name: true, slug: true, altitudeM: true },
        },
      },
    });

    return records.map((record) => ({
      id: record.id,
      name: record.name,
      slug: record.slug,
      province: record.region || '',
      region: record.region,
      description: record.description,
      mountainCount: record.mountains.length,
      mountains: record.mountains,
    }));
  }

  private async logAudit(params: {
    action: string;
    entityId: string;
    oldValue?: Prisma.InputJsonValue;
    newValue?: Prisma.InputJsonValue;
    audit: AuditContext;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminUserId: params.audit.adminUserId,
          action: params.action,
          entityType: 'DESTINATION',
          entityId: params.entityId,
          oldValue: params.oldValue ?? Prisma.JsonNull,
          newValue: params.newValue ?? Prisma.JsonNull,
          requestId: params.audit.requestId ?? null,
          userAgent: params.audit.userAgent ?? null,
        },
      });
    } catch {
      // Audit log failures should not block the primary operation
    }
  }
}
