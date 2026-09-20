import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import {
  validateCreateRoute,
  validateRouteQuery,
  validateUpdateRoute,
} from '@wildera/validation';
import type { Route, RouteListResponse } from '@wildera/types';

interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class RouteService {
  constructor(private readonly prisma: PrismaService) {}

  async list(queryInput: unknown): Promise<RouteListResponse> {
    const query = validateRouteQuery(queryInput);

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (query.mountainId) {
      where.mountainId = query.mountainId;
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.difficulty && query.difficulty !== 'ALL') {
      where.difficulty = query.difficulty;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { startingPoint: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        {
          mountain: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { createdAt: 'desc' },
        include: {
          mountain: {
            select: {
              id: true,
              name: true,
              slug: true,
              destinationId: true,
              destination: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              trips: true,
            },
          },
        },
      }),
      this.prisma.route.count({ where }),
    ]);

    return {
      items: items as unknown as Route[],
      total,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    };
  }

  async getById(id: string): Promise<Route> {
    const route = await this.prisma.route.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        mountain: {
          select: {
            id: true,
            name: true,
            slug: true,
            destinationId: true,
            destination: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            trips: true,
          },
        },
      },
    });

    if (!route) {
      throw new NotFoundException({
        code: 'ROUTE_NOT_FOUND',
        message: 'Jalur pendakian tidak ditemukan.',
      });
    }

    return route as unknown as Route;
  }

  async create(body: unknown, audit: AuditContext): Promise<Route> {
    const validation = validateCreateRoute(body);
    if (!validation.valid) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Validasi form jalur gagal.',
        errors: validation.errors,
      });
    }

    const input = validation.data;

    // Verify mountain exists and not deleted
    const mountain = await this.prisma.mountain.findFirst({
      where: {
        id: input.mountainId,
        deletedAt: null,
      },
    });

    if (!mountain) {
      throw new BadRequestException({
        code: 'MOUNTAIN_NOT_FOUND',
        message: 'Gunung yang dipilih tidak ditemukan.',
      });
    }

    // Check slug uniqueness per mountain
    const existing = await this.prisma.route.findFirst({
      where: {
        mountainId: input.mountainId,
        slug: input.slug,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'SLUG_ALREADY_EXISTS',
        message: 'Slug jalur sudah digunakan untuk gunung ini.',
      });
    }

    const created = await this.prisma.route.create({
      data: {
        mountainId: input.mountainId,
        name: input.name,
        slug: input.slug ?? `route-${Date.now()}`,
        description: input.description ?? null,
        distanceKm: input.distanceKm !== undefined ? input.distanceKm : null,
        elevationGainM: input.elevationGainM ?? null,
        estimatedDurationHours:
          input.estimatedDurationHours !== undefined
            ? input.estimatedDurationHours
            : null,
        difficulty: input.difficulty ?? null,
        startingPoint: input.startingPoint ?? null,
        status: input.status ?? 'DRAFT',
      },
      include: {
        mountain: {
          select: {
            id: true,
            name: true,
            slug: true,
            destinationId: true,
            destination: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            trips: true,
          },
        },
      },
    });

    await this.logAudit({
      userId: audit.userId,
      action: 'ROUTE_CREATE',
      entityId: created.id,
      entityType: 'ROUTE',
      oldData: null,
      newData: created,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });

    return created as unknown as Route;
  }

  async update(id: string, body: unknown, audit: AuditContext): Promise<Route> {
    const validation = validateUpdateRoute(body);
    if (!validation.valid) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Validasi pembaruan jalur gagal.',
        errors: validation.errors,
      });
    }

    const existing = await this.prisma.route.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'ROUTE_NOT_FOUND',
        message: 'Jalur pendakian tidak ditemukan.',
      });
    }

    const input = validation.data;
    const targetMountainId = input.mountainId ?? existing.mountainId;

    if (input.mountainId && input.mountainId !== existing.mountainId) {
      const mountain = await this.prisma.mountain.findFirst({
        where: {
          id: input.mountainId,
          deletedAt: null,
        },
      });

      if (!mountain) {
        throw new BadRequestException({
          code: 'MOUNTAIN_NOT_FOUND',
          message: 'Gunung yang dipilih tidak ditemukan.',
        });
      }
    }

    if (
      (input.slug && input.slug !== existing.slug) ||
      (input.mountainId && input.mountainId !== existing.mountainId)
    ) {
      const targetSlug = input.slug ?? existing.slug;
      const slugCollision = await this.prisma.route.findFirst({
        where: {
          mountainId: targetMountainId,
          slug: targetSlug,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (slugCollision) {
        throw new ConflictException({
          code: 'SLUG_ALREADY_EXISTS',
          message: 'Slug jalur sudah digunakan untuk gunung ini.',
        });
      }
    }

    const updateData: Record<string, unknown> = {};

    if (input.mountainId !== undefined)
      updateData.mountainId = input.mountainId;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.distanceKm !== undefined)
      updateData.distanceKm = input.distanceKm;
    if (input.elevationGainM !== undefined)
      updateData.elevationGainM = input.elevationGainM;
    if (input.estimatedDurationHours !== undefined)
      updateData.estimatedDurationHours = input.estimatedDurationHours;
    if (input.difficulty !== undefined)
      updateData.difficulty = input.difficulty;
    if (input.startingPoint !== undefined)
      updateData.startingPoint = input.startingPoint;
    if (input.status !== undefined) updateData.status = input.status;

    const updated = await this.prisma.route.update({
      where: { id },
      data: updateData,
      include: {
        mountain: {
          select: {
            id: true,
            name: true,
            slug: true,
            destinationId: true,
            destination: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            trips: true,
          },
        },
      },
    });

    await this.logAudit({
      userId: audit.userId,
      action: 'ROUTE_UPDATE',
      entityId: id,
      entityType: 'ROUTE',
      oldData: existing,
      newData: updated,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });

    return updated as unknown as Route;
  }

  async delete(id: string, audit: AuditContext): Promise<{ success: true }> {
    const existing = await this.prisma.route.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'ROUTE_NOT_FOUND',
        message: 'Jalur pendakian tidak ditemukan.',
      });
    }

    await this.prisma.route.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        deletedAt: new Date(),
      },
    });

    await this.logAudit({
      userId: audit.userId,
      action: 'ROUTE_DELETE',
      entityId: id,
      entityType: 'ROUTE',
      oldData: existing,
      newData: { status: 'ARCHIVED', deletedAt: new Date() },
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });

    return { success: true };
  }

  private async logAudit(params: {
    userId?: string;
    action: string;
    entityId: string;
    entityType: string;
    oldData: unknown;
    newData: unknown;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      if (!params.userId) {
        const fallbackAdmin = await this.prisma.adminUser.findFirst({
          select: { id: true },
        });
        if (!fallbackAdmin) return;
        params.userId = fallbackAdmin.id;
      }

      await this.prisma.auditLog.create({
        data: {
          adminUserId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValue:
            params.oldData !== null ? (params.oldData as object) : undefined,
          newValue:
            params.newData !== null ? (params.newData as object) : undefined,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
        },
      });
    } catch {
      // Non-blocking audit logging
    }
  }
}
