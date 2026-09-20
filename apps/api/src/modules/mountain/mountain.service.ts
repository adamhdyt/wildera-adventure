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
  validateCreateMountain,
  validateMountainQuery,
  validatePublicMountainQuery,
  validateUpdateMountain,
} from '@wildera/validation';
import type { Mountain, MountainListResponse } from '@wildera/types';
import {
  ContentStatus,
  DifficultyLevel,
  Prisma,
} from '../../generated/prisma/client';

export interface AuditContext {
  adminUserId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class MountainService {
  constructor(private readonly prisma: PrismaService) {}

  async list(queryInput: unknown): Promise<MountainListResponse> {
    const query = validateMountainQuery(queryInput);
    const where: Prisma.MountainWhereInput = {
      deletedAt: null,
    };

    if (query.destinationId) {
      where.destinationId = query.destinationId;
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status as ContentStatus;
    }

    if (query.difficulty && query.difficulty !== 'ALL') {
      where.defaultDifficulty = query.difficulty as DifficultyLevel;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { shortDescription: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { bestSeason: { contains: query.search, mode: 'insensitive' } },
        {
          destination: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.mountain.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: [{ name: 'asc' }],
        include: {
          destination: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              routes: true,
              trips: true,
            },
          },
        },
      }),
      this.prisma.mountain.count({ where }),
    ]);

    return {
      items: items as unknown as Mountain[],
      total,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    };
  }

  async getById(id: string): Promise<Mountain> {
    const mountain = await this.prisma.mountain.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            routes: true,
            trips: true,
          },
        },
      },
    });

    if (!mountain) {
      throw new NotFoundException({
        code: 'MOUNTAIN_NOT_FOUND',
        message: 'Gunung tidak ditemukan.',
      });
    }

    return mountain as unknown as Mountain;
  }

  async create(body: unknown, audit?: AuditContext): Promise<Mountain> {
    const validation = validateCreateMountain(body);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Beberapa data belum valid.',
        fields: validation.errors,
      });
    }

    const input = validation.data;

    // Verify destination exists and is active/not deleted
    const destination = await this.prisma.destination.findFirst({
      where: {
        id: input.destinationId,
        deletedAt: null,
      },
    });

    if (!destination) {
      throw new BadRequestException({
        code: 'DESTINATION_NOT_FOUND',
        message: 'Destinasi yang dipilih tidak ditemukan.',
      });
    }

    // Check slug collision
    const existing = await this.prisma.mountain.findFirst({
      where: {
        slug: input.slug,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'SLUG_ALREADY_EXISTS',
        message: 'Slug gunung sudah digunakan.',
      });
    }

    const created = await this.prisma.mountain.create({
      data: {
        destinationId: input.destinationId,
        name: input.name,
        slug: input.slug!,
        altitudeM: input.altitudeM ?? null,
        shortDescription: input.shortDescription ?? null,
        description: input.description ?? null,
        defaultDifficulty: (input.defaultDifficulty as DifficultyLevel) ?? null,
        bestSeason: input.bestSeason ?? null,
        latitude:
          input.latitude !== null ? new Prisma.Decimal(input.latitude!) : null,
        longitude:
          input.longitude !== null
            ? new Prisma.Decimal(input.longitude!)
            : null,
        status: (input.status ?? 'DRAFT') as ContentStatus,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
      },
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            routes: true,
            trips: true,
          },
        },
      },
    });

    if (audit?.adminUserId) {
      await this.logAudit({
        action: 'MOUNTAIN_CREATE',
        entityId: created.id,
        newValue: created as unknown as Prisma.InputJsonValue,
        audit,
      });
    }

    return created as unknown as Mountain;
  }

  async update(
    id: string,
    body: unknown,
    audit?: AuditContext,
  ): Promise<Mountain> {
    const validation = validateUpdateMountain(body);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Beberapa data belum valid.',
        fields: validation.errors,
      });
    }

    const current = await this.prisma.mountain.findFirst({
      where: { id, deletedAt: null },
    });

    if (!current) {
      throw new NotFoundException({
        code: 'MOUNTAIN_NOT_FOUND',
        message: 'Gunung tidak ditemukan.',
      });
    }

    const input = validation.data;

    // Verify destination if changed
    if (input.destinationId && input.destinationId !== current.destinationId) {
      const destination = await this.prisma.destination.findFirst({
        where: {
          id: input.destinationId,
          deletedAt: null,
        },
      });

      if (!destination) {
        throw new BadRequestException({
          code: 'DESTINATION_NOT_FOUND',
          message: 'Destinasi yang dipilih tidak ditemukan.',
        });
      }
    }

    // Check slug collision if slug changed
    if (input.slug && input.slug !== current.slug) {
      const slugCollision = await this.prisma.mountain.findFirst({
        where: {
          slug: input.slug,
          NOT: { id },
          deletedAt: null,
        },
      });

      if (slugCollision) {
        throw new ConflictException({
          code: 'SLUG_ALREADY_EXISTS',
          message: 'Slug gunung sudah digunakan.',
        });
      }
    }

    const updated = await this.prisma.mountain.update({
      where: { id },
      data: {
        ...(input.destinationId !== undefined
          ? { destinationId: input.destinationId }
          : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.altitudeM !== undefined
          ? { altitudeM: input.altitudeM }
          : {}),
        ...(input.shortDescription !== undefined
          ? { shortDescription: input.shortDescription }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.defaultDifficulty !== undefined
          ? {
              defaultDifficulty:
                (input.defaultDifficulty as DifficultyLevel) ?? null,
            }
          : {}),
        ...(input.bestSeason !== undefined
          ? { bestSeason: input.bestSeason }
          : {}),
        ...(input.latitude !== undefined
          ? {
              latitude:
                input.latitude !== null
                  ? new Prisma.Decimal(input.latitude)
                  : null,
            }
          : {}),
        ...(input.longitude !== undefined
          ? {
              longitude:
                input.longitude !== null
                  ? new Prisma.Decimal(input.longitude)
                  : null,
            }
          : {}),
        ...(input.status !== undefined
          ? { status: input.status as ContentStatus }
          : {}),
        ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
        ...(input.seoDescription !== undefined
          ? { seoDescription: input.seoDescription }
          : {}),
      },
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            routes: true,
            trips: true,
          },
        },
      },
    });

    if (audit?.adminUserId) {
      await this.logAudit({
        action: 'MOUNTAIN_UPDATE',
        entityId: id,
        oldValue: current as unknown as Prisma.InputJsonValue,
        newValue: updated as unknown as Prisma.InputJsonValue,
        audit,
      });
    }

    return updated as unknown as Mountain;
  }

  async delete(
    id: string,
    audit?: AuditContext,
  ): Promise<{ success: boolean }> {
    const current = await this.prisma.mountain.findFirst({
      where: { id, deletedAt: null },
    });

    if (!current) {
      throw new NotFoundException({
        code: 'MOUNTAIN_NOT_FOUND',
        message: 'Gunung tidak ditemukan.',
      });
    }

    const updated = await this.prisma.mountain.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: ContentStatus.ARCHIVED,
      },
    });

    if (audit?.adminUserId) {
      await this.logAudit({
        action: 'MOUNTAIN_DELETE',
        entityId: id,
        oldValue: current as unknown as Prisma.InputJsonValue,
        newValue: updated as unknown as Prisma.InputJsonValue,
        audit,
      });
    }

    return { success: true };
  }

  async listPublic(queryInput: unknown) {
    const query = validatePublicMountainQuery(
      (queryInput as Record<string, unknown>) || {},
    );
    const where: Prisma.MountainWhereInput = {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        {
          destination: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          destination: {
            region: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (query.destination) {
      where.destination = {
        OR: [{ slug: query.destination }, { id: query.destination }],
      };
    }

    if (query.difficulty) {
      where.defaultDifficulty = query.difficulty;
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [records, total] = await Promise.all([
      this.prisma.mountain.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ altitudeM: 'desc' }],
        include: {
          destination: {
            select: {
              id: true,
              name: true,
              slug: true,
              region: true,
              province: true,
            },
          },
          media: {
            include: { media: true },
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: {
              trips: {
                where: { status: ContentStatus.PUBLISHED, deletedAt: null },
              },
            },
          },
        },
      }),
      this.prisma.mountain.count({ where }),
    ]);

    const data = records.map((m) => {
      const cover = m.media.find((a) => a.mediaRole === 'COVER') ?? m.media[0];
      return {
        id: m.id,
        name: m.name,
        slug: m.slug,
        altitudeM: m.altitudeM ?? 0,
        defaultDifficulty: m.defaultDifficulty ?? 'MODERATE',
        city: m.destination.region ?? null,
        province: m.destination.province ?? m.destination.region ?? null,
        destination: {
          id: m.destination.id,
          name: m.destination.name,
          slug: m.destination.slug,
          region: m.destination.region,
        },
        coverImage: {
          url: cover?.media?.url ?? '',
          alt: cover?.media?.altText ?? m.name,
        },
        tripCount: m._count.trips,
      };
    });

    return {
      data,
      meta: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  async getBySlugPublic(slug: string) {
    const mountain = await this.prisma.mountain.findFirst({
      where: {
        slug,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        destination: true,
        routes: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
        },
        media: {
          include: { media: true },
          orderBy: { sortOrder: 'asc' },
        },
        trips: {
          where: { status: ContentStatus.PUBLISHED, deletedAt: null },
          include: {
            media: {
              include: { media: true },
              orderBy: { sortOrder: 'asc' },
            },
            schedules: {
              where: { status: { in: ['OPEN', 'CLOSED'] } },
              orderBy: { startDate: 'asc' },
              include: {
                bookings: {
                  select: { status: true, participantCount: true },
                },
                packages: {
                  where: { status: 'ACTIVE' },
                  orderBy: { price: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!mountain) {
      throw new NotFoundException({
        code: 'MOUNTAIN_NOT_FOUND',
        message: 'Gunung tidak ditemukan atau belum dipublikasikan.',
      });
    }

    const coverItem =
      mountain.media.find((a) => a.mediaRole === 'COVER') ?? mountain.media[0];
    const galleryItems = mountain.media
      .filter((a) => a.mediaRole === 'GALLERY')
      .map((a) => ({
        url: a.media.url,
        alt: a.media.altText || mountain.name,
      }));

    const upcomingTrips = mountain.trips.map((t) => {
      const tripCover =
        t.media.find((a) => a.mediaRole === 'COVER') ?? t.media[0];
      const sched = t.schedules[0];
      let nextSchedule = null;
      if (sched) {
        const confirmedSeats = sched.bookings
          .filter((b) =>
            ['INQUIRY', 'PENDING_CONFIRMATION', 'CONFIRMED'].includes(b.status),
          )
          .reduce((sum, b) => sum + b.participantCount, 0);
        const availableSeats = Math.max(0, sched.capacity - confirmedSeats);
        const startingPrice = sched.packages[0]
          ? Number(sched.packages[0].price)
          : 0;

        nextSchedule = {
          id: sched.id,
          startDate: sched.startDate.toISOString().slice(0, 10),
          endDate: sched.endDate.toISOString().slice(0, 10),
          capacity: sched.capacity,
          confirmedSeats,
          availableSeats,
          availabilityStatus: computeAvailability(
            sched.capacity,
            confirmedSeats,
          ),
          startingPrice,
        };
      }

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        tripType: t.tripType,
        difficulty: t.difficulty,
        beginnerFriendly:
          t.difficulty === 'EASY' || t.difficulty === 'MODERATE',
        duration: { days: t.durationDays, nights: t.durationNights },
        mountain: {
          name: mountain.name,
          slug: mountain.slug,
          altitudeM: mountain.altitudeM,
        },
        coverImage: {
          url: tripCover?.media?.url ?? '',
          alt: tripCover?.media?.altText ?? t.name,
        },
        nextSchedule,
      };
    });

    return {
      id: mountain.id,
      name: mountain.name,
      slug: mountain.slug,
      altitudeM: mountain.altitudeM ?? 0,
      city: mountain.destination.region ?? null,
      province:
        mountain.destination.province ?? mountain.destination.region ?? null,
      country: 'Indonesia',
      description: mountain.description,
      bestSeason: mountain.bestSeason,
      defaultDifficulty: mountain.defaultDifficulty ?? 'MODERATE',
      destination: {
        id: mountain.destination.id,
        name: mountain.destination.name,
        slug: mountain.destination.slug,
        region: mountain.destination.region,
      },
      routes: mountain.routes.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        distanceKm: r.distanceKm ? Number(r.distanceKm) : null,
        elevationGainM: r.elevationGainM,
        estimatedHours: r.estimatedDurationHours
          ? Number(r.estimatedDurationHours)
          : null,
        difficulty: r.difficulty,
        description: r.description,
      })),
      media: {
        cover: {
          url: coverItem?.media?.url ?? '',
          alt: coverItem?.media?.altText ?? mountain.name,
        },
        gallery: galleryItems,
      },
      upcomingTrips,
      seo: {
        title: `Gunung ${mountain.name} - Info Pendakian & Open Trip`,
        description:
          mountain.description ?? `Panduan pendakian Gunung ${mountain.name}`,
      },
    };
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
          entityType: 'MOUNTAIN',
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
