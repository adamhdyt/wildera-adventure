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
  validateCreateTrip,
  validatePublicTripQuery,
  validateTripPublish,
  validateTripQuery,
  validateUpdateTrip,
  validateUpdateTripContent,
} from '@wildera/validation';
import { Prisma } from '../../generated/prisma/client';
import type { Trip, TripContent, TripListResponse } from '@wildera/types';

interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class TripService {
  constructor(private readonly prisma: PrismaService) {}

  async list(queryInput: unknown): Promise<TripListResponse> {
    const query = validateTripQuery(queryInput);

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (query.mountainId) {
      where.mountainId = query.mountainId;
    }

    if (query.routeId) {
      where.routeId = query.routeId;
    }

    if (query.tripType && query.tripType !== 'ALL') {
      where.tripType = query.tripType;
    }

    if (query.difficulty && query.difficulty !== 'ALL') {
      where.difficulty = query.difficulty;
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.featured !== undefined) {
      where.featured = query.featured;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { shortDescription: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        {
          mountain: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          route: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.trip.findMany({
        where,
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
          route: {
            select: {
              id: true,
              name: true,
              slug: true,
              startingPoint: true,
              difficulty: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              schedules: true,
              itineraries: true,
              facilities: true,
              gears: true,
              faqs: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.trip.count({ where }),
    ]);

    return {
      items: items as unknown as Trip[],
      total,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    };
  }

  async getById(id: string): Promise<Trip> {
    const trip = await this.prisma.trip.findFirst({
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
        route: {
          select: {
            id: true,
            name: true,
            slug: true,
            startingPoint: true,
            difficulty: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            schedules: true,
            itineraries: true,
            facilities: true,
            gears: true,
            faqs: true,
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException({
        code: 'TRIP_NOT_FOUND',
        message: `Trip dengan ID "${id}" tidak ditemukan.`,
      });
    }

    return trip as unknown as Trip;
  }

  async create(body: unknown, audit: AuditContext): Promise<Trip> {
    const validation = validateCreateTrip(body);

    if (!validation.valid) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Data trip tidak valid.',
        details: validation.errors,
      });
    }

    const { data } = validation;

    const mountain = await this.prisma.mountain.findFirst({
      where: {
        id: data.mountainId,
        deletedAt: null,
      },
    });

    if (!mountain) {
      throw new BadRequestException({
        code: 'MOUNTAIN_NOT_FOUND',
        message: `Gunung dengan ID "${data.mountainId}" tidak ditemukan atau sudah tidak aktif.`,
      });
    }

    if (data.routeId) {
      const route = await this.prisma.route.findFirst({
        where: {
          id: data.routeId,
          mountainId: data.mountainId,
          deletedAt: null,
        },
      });

      if (!route) {
        throw new BadRequestException({
          code: 'ROUTE_NOT_FOUND',
          message: `Jalur pendakian dengan ID "${data.routeId}" tidak ditemukan untuk gunung ini.`,
        });
      }
    }

    const existingSlug = await this.prisma.trip.findFirst({
      where: {
        slug: data.slug,
        deletedAt: null,
      },
    });

    if (existingSlug) {
      throw new ConflictException({
        code: 'SLUG_ALREADY_EXISTS',
        message: `Trip dengan slug "${data.slug}" sudah terdaftar.`,
      });
    }

    if (!audit.userId) {
      throw new BadRequestException('AUTHENTICATED_USER_REQUIRED');
    }

    const publishedAt = data.status === 'PUBLISHED' ? new Date() : null;

    const trip = await this.prisma.trip.create({
      data: {
        mountainId: data.mountainId,
        routeId: data.routeId || null,
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        tripType: data.tripType,
        shortDescription: data.shortDescription,
        description: data.description,
        durationDays: data.durationDays,
        durationNights: data.durationNights ?? 0,
        difficulty: data.difficulty,
        beginnerFriendly: data.beginnerFriendly ?? false,
        healthCertificateRequired: data.healthCertificateRequired ?? false,
        minimumAge: data.minimumAge,
        maximumAge: data.maximumAge,
        status: data.status ?? 'DRAFT',
        featured: data.featured ?? false,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        publishedAt,
        createdBy: audit.userId!,
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
        route: {
          select: {
            id: true,
            name: true,
            slug: true,
            startingPoint: true,
            difficulty: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            schedules: true,
            itineraries: true,
            facilities: true,
            gears: true,
            faqs: true,
          },
        },
      },
    });

    await this.logAudit({
      audit,
      action: 'TRIP_CREATE',
      entityType: 'TRIP',
      entityId: trip.id,
      oldData: null,
      newData: trip,
    });

    return trip as unknown as Trip;
  }

  async update(id: string, body: unknown, audit: AuditContext): Promise<Trip> {
    const existing = await this.prisma.trip.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'TRIP_NOT_FOUND',
        message: `Trip dengan ID "${id}" tidak ditemukan.`,
      });
    }

    const validation = validateUpdateTrip(body);

    if (!validation.valid) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Data trip tidak valid.',
        details: validation.errors,
      });
    }

    const { data } = validation;
    const targetMountainId = data.mountainId ?? existing.mountainId;

    if (data.mountainId && data.mountainId !== existing.mountainId) {
      const mtn = await this.prisma.mountain.findFirst({
        where: {
          id: data.mountainId,
          deletedAt: null,
        },
      });

      if (!mtn) {
        throw new BadRequestException({
          code: 'MOUNTAIN_NOT_FOUND',
          message: `Gunung dengan ID "${data.mountainId}" tidak ditemukan atau sudah tidak aktif.`,
        });
      }
    }

    if (data.routeId !== undefined) {
      if (data.routeId !== null) {
        const route = await this.prisma.route.findFirst({
          where: {
            id: data.routeId,
            mountainId: targetMountainId,
            deletedAt: null,
          },
        });

        if (!route) {
          throw new BadRequestException({
            code: 'ROUTE_NOT_FOUND',
            message: `Jalur pendakian dengan ID "${data.routeId}" tidak ditemukan untuk gunung ini.`,
          });
        }
      }
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugCollision = await this.prisma.trip.findFirst({
        where: {
          slug: data.slug,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (slugCollision) {
        throw new ConflictException({
          code: 'SLUG_ALREADY_EXISTS',
          message: `Trip dengan slug "${data.slug}" sudah terdaftar.`,
        });
      }
    }

    let publishedAt = existing.publishedAt;
    if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      publishedAt = new Date();
    }

    const updated = await this.prisma.trip.update({
      where: { id },
      data: {
        mountainId: data.mountainId,
        routeId: data.routeId,
        name: data.name,
        slug: data.slug,
        tripType: data.tripType,
        shortDescription: data.shortDescription,
        description: data.description,
        durationDays: data.durationDays,
        durationNights: data.durationNights,
        difficulty: data.difficulty,
        beginnerFriendly: data.beginnerFriendly,
        healthCertificateRequired: data.healthCertificateRequired,
        minimumAge: data.minimumAge,
        maximumAge: data.maximumAge,
        status: data.status,
        featured: data.featured,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        publishedAt,
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
        route: {
          select: {
            id: true,
            name: true,
            slug: true,
            startingPoint: true,
            difficulty: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            schedules: true,
            itineraries: true,
            facilities: true,
            gears: true,
            faqs: true,
          },
        },
      },
    });

    await this.logAudit({
      audit,
      action: 'TRIP_UPDATE',
      entityType: 'TRIP',
      entityId: id,
      oldData: existing,
      newData: updated,
    });

    return updated as unknown as Trip;
  }

  async delete(id: string, audit: AuditContext): Promise<Trip> {
    const existing = await this.prisma.trip.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'TRIP_NOT_FOUND',
        message: `Trip dengan ID "${id}" tidak ditemukan.`,
      });
    }

    const activeSchedulesCount = await this.prisma.tripSchedule.count({
      where: {
        tripId: id,
      },
    });

    if (activeSchedulesCount > 0) {
      throw new ConflictException({
        code: 'TRIP_HAS_ACTIVE_SCHEDULES',
        message: `Trip "${existing.name}" tidak dapat dihapus karena masih memiliki jadwal aktif.`,
      });
    }

    const archived = await this.prisma.trip.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        deletedAt: new Date(),
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
        route: {
          select: {
            id: true,
            name: true,
            slug: true,
            startingPoint: true,
            difficulty: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            schedules: true,
            itineraries: true,
            facilities: true,
            gears: true,
            faqs: true,
          },
        },
      },
    });

    await this.logAudit({
      audit,
      action: 'TRIP_DELETE',
      entityType: 'TRIP',
      entityId: id,
      oldData: existing,
      newData: archived,
    });

    return archived as unknown as Trip;
  }

  async getContent(tripId: string): Promise<TripContent> {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        deletedAt: null,
      },
    });

    if (!trip) {
      throw new NotFoundException({
        code: 'TRIP_NOT_FOUND',
        message: `Trip dengan ID "${tripId}" tidak ditemukan.`,
      });
    }

    const [itineraries, facilities, gears, faqs] = await Promise.all([
      this.prisma.tripItinerary.findMany({
        where: { tripId },
        orderBy: { dayNumber: 'asc' },
      }),
      this.prisma.tripFacility.findMany({
        where: { tripId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.tripGear.findMany({
        where: { tripId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.tripFaq.findMany({
        where: { tripId },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    return {
      tripId,
      itineraries: itineraries as unknown as TripContent['itineraries'],
      facilities: facilities as unknown as TripContent['facilities'],
      gears: gears as unknown as TripContent['gears'],
      faqs: faqs as unknown as TripContent['faqs'],
    };
  }

  async updateContent(
    tripId: string,
    body: unknown,
    audit: AuditContext,
  ): Promise<TripContent> {
    const validation = validateUpdateTripContent(body);

    if (!validation.valid) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Data konten trip tidak valid.',
        details: validation.errors,
      });
    }

    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        deletedAt: null,
      },
    });

    if (!trip) {
      throw new NotFoundException({
        code: 'TRIP_NOT_FOUND',
        message: `Trip dengan ID "${tripId}" tidak ditemukan.`,
      });
    }

    const { data } = validation;

    await this.prisma.$transaction(async (tx) => {
      // 1. Sync itineraries
      if (data.itineraries !== undefined) {
        await tx.tripItinerary.deleteMany({
          where: { tripId },
        });

        if (data.itineraries.length > 0) {
          await tx.tripItinerary.createMany({
            data: data.itineraries.map((it) => ({
              tripId,
              dayNumber: it.dayNumber,
              title: it.title,
              description: it.description ?? null,
              sortOrder: it.sortOrder ?? it.dayNumber,
            })),
          });
        }
      }

      // 2. Sync facilities
      if (data.facilities !== undefined) {
        await tx.tripFacility.deleteMany({
          where: { tripId },
        });

        if (data.facilities.length > 0) {
          await tx.tripFacility.createMany({
            data: data.facilities.map((fac, idx) => ({
              tripId,
              facilityType: fac.facilityType,
              name: fac.name,
              description: fac.description ?? null,
              sortOrder: fac.sortOrder ?? idx,
            })),
          });
        }
      }

      // 3. Sync gears
      if (data.gears !== undefined) {
        await tx.tripGear.deleteMany({
          where: { tripId },
        });

        if (data.gears.length > 0) {
          await tx.tripGear.createMany({
            data: data.gears.map((g, idx) => ({
              tripId,
              gearType: g.gearType,
              name: g.name,
              description: g.description ?? null,
              sortOrder: g.sortOrder ?? idx,
            })),
          });
        }
      }

      // 4. Sync FAQs
      if (data.faqs !== undefined) {
        await tx.tripFaq.deleteMany({
          where: { tripId },
        });

        if (data.faqs.length > 0) {
          await tx.tripFaq.createMany({
            data: data.faqs.map((f, idx) => ({
              tripId,
              question: f.question,
              answer: f.answer,
              status: f.status ?? 'DRAFT',
              sortOrder: f.sortOrder ?? idx,
            })),
          });
        }
      }
    });

    await this.logAudit({
      audit,
      action: 'TRIP_CONTENT_UPDATE',
      entityType: 'TRIP',
      entityId: tripId,
      oldData: null,
      newData: data,
    });

    return this.getContent(tripId);
  }

  async publish(tripId: string, audit: AuditContext): Promise<Trip> {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, deletedAt: null },
      include: {
        media: true,
        itineraries: true,
      },
    });

    if (!trip) {
      throw new NotFoundException({
        code: 'TRIP_NOT_FOUND',
        message: `Trip dengan ID "${tripId}" tidak ditemukan.`,
      });
    }

    const hasCover = trip.media.some((m) => m.mediaRole === 'COVER');
    const check = validateTripPublish({
      name: trip.name,
      slug: trip.slug,
      mountainId: trip.mountainId,
      durationDays: trip.durationDays,
      difficulty: trip.difficulty,
      description: trip.description || trip.shortDescription,
      hasCoverImage: hasCover,
      itineraryCount: trip.itineraries.length,
    });

    if (!check.ready) {
      throw new UnprocessableEntityException({
        code: 'TRIP_NOT_READY_TO_PUBLISH',
        message: 'Trip belum memenuhi syarat untuk dipublikasikan.',
        fields: check.errors,
      });
    }

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      include: {
        mountain: { select: { id: true, name: true, slug: true } },
        route: { select: { id: true, name: true, slug: true } },
      },
    });

    await this.logAudit({
      audit,
      action: 'TRIP_PUBLISH',
      entityType: 'TRIP',
      entityId: tripId,
      oldData: { status: trip.status, publishedAt: trip.publishedAt },
      newData: { status: updated.status, publishedAt: updated.publishedAt },
    });

    return updated as unknown as Trip;
  }

  async unpublish(tripId: string, audit: AuditContext): Promise<Trip> {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, deletedAt: null },
    });

    if (!trip) {
      throw new NotFoundException({
        code: 'TRIP_NOT_FOUND',
        message: `Trip dengan ID "${tripId}" tidak ditemukan.`,
      });
    }

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'DRAFT',
      },
      include: {
        mountain: { select: { id: true, name: true, slug: true } },
        route: { select: { id: true, name: true, slug: true } },
      },
    });

    await this.logAudit({
      audit,
      action: 'TRIP_UNPUBLISH',
      entityType: 'TRIP',
      entityId: tripId,
      oldData: { status: trip.status },
      newData: { status: updated.status },
    });

    return updated as unknown as Trip;
  }

  async duplicate(tripId: string, audit: AuditContext): Promise<Trip> {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, deletedAt: null },
      include: {
        itineraries: true,
        facilities: true,
        gears: true,
        faqs: true,
        media: true,
      },
    });

    if (!trip) {
      throw new NotFoundException({
        code: 'TRIP_NOT_FOUND',
        message: `Trip dengan ID "${tripId}" tidak ditemukan.`,
      });
    }

    const newName = `${trip.name} (Salinan)`;
    let newSlug = `${trip.slug}-salinan`;
    let counter = 1;
    while (await this.prisma.trip.findUnique({ where: { slug: newSlug } })) {
      counter++;
      newSlug = `${trip.slug}-salinan-${counter}`;
    }

    const newTrip = await this.prisma.$transaction(async (tx) => {
      const created = await tx.trip.create({
        data: {
          mountainId: trip.mountainId,
          routeId: trip.routeId,
          tripType: trip.tripType,
          name: newName,
          slug: newSlug,
          shortDescription: trip.shortDescription,
          description: trip.description,
          durationDays: trip.durationDays,
          durationNights: trip.durationNights,
          difficulty: trip.difficulty,
          beginnerFriendly: trip.beginnerFriendly,
          healthCertificateRequired: trip.healthCertificateRequired,
          minimumAge: trip.minimumAge,
          maximumAge: trip.maximumAge,
          featured: trip.featured,
          seoTitle: trip.seoTitle,
          seoDescription: trip.seoDescription,
          status: 'DRAFT',
          publishedAt: null,
          createdBy: audit.userId!,
        },
      });

      if (trip.itineraries.length > 0) {
        await tx.tripItinerary.createMany({
          data: trip.itineraries.map((it) => ({
            tripId: created.id,
            dayNumber: it.dayNumber,
            title: it.title,
            description: it.description,
            sortOrder: it.sortOrder,
          })),
        });
      }

      if (trip.facilities.length > 0) {
        await tx.tripFacility.createMany({
          data: trip.facilities.map((f) => ({
            tripId: created.id,
            facilityType: f.facilityType,
            name: f.name,
            description: f.description,
            sortOrder: f.sortOrder,
          })),
        });
      }

      if (trip.gears.length > 0) {
        await tx.tripGear.createMany({
          data: trip.gears.map((g) => ({
            tripId: created.id,
            gearType: g.gearType,
            name: g.name,
            description: g.description,
            sortOrder: g.sortOrder,
          })),
        });
      }

      if (trip.faqs.length > 0) {
        await tx.tripFaq.createMany({
          data: trip.faqs.map((faq) => ({
            tripId: created.id,
            question: faq.question,
            answer: faq.answer,
            sortOrder: faq.sortOrder,
            status: 'DRAFT',
          })),
        });
      }

      if (trip.media.length > 0) {
        await tx.tripMedia.createMany({
          data: trip.media.map((m) => ({
            tripId: created.id,
            mediaId: m.mediaId,
            mediaRole: m.mediaRole,
            sortOrder: m.sortOrder,
          })),
        });
      }

      // DO NOT copy schedules or bookings (guaranteed by omission)

      return created;
    });

    await this.logAudit({
      audit,
      action: 'TRIP_DUPLICATE',
      entityType: 'TRIP',
      entityId: newTrip.id,
      oldData: { originalTripId: trip.id },
      newData: { newTripId: newTrip.id, name: newName, slug: newSlug },
    });

    return this.getById(newTrip.id);
  }

  async listPublic(queryInput: unknown) {
    const query = validatePublicTripQuery(
      (queryInput as Record<string, unknown>) || {},
    );

    const where: Prisma.TripWhereInput = {
      status: 'PUBLISHED',
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { mountain: { name: { contains: query.search, mode: 'insensitive' } } },
        { route: { name: { contains: query.search, mode: 'insensitive' } } },
        {
          mountain: {
            destination: {
              name: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (query.type) {
      where.tripType = query.type;
    }

    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }

    if (query.mountain || query.destination) {
      const mountainFilter: Prisma.MountainWhereInput = {};
      if (query.mountain) {
        mountainFilter.OR = [{ slug: query.mountain }, { id: query.mountain }];
      }
      if (query.destination) {
        mountainFilter.destination = {
          OR: [{ slug: query.destination }, { id: query.destination }],
        };
      }
      where.mountain = mountainFilter;
    }

    const allPublished = await this.prisma.trip.findMany({
      where,
      include: {
        mountain: {
          select: {
            id: true,
            name: true,
            slug: true,
            altitudeM: true,
            destination: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        media: {
          include: { media: true },
          orderBy: { sortOrder: 'asc' },
        },
        schedules: {
          where: {
            status: { in: ['OPEN', 'CLOSED'] },
          },
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
      orderBy: [{ createdAt: 'desc' }],
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let formatted = allPublished.map((t) => {
      const cover = t.media.find((m) => m.mediaRole === 'COVER') ?? t.media[0];

      const upcomingSchedules = t.schedules.filter(
        (s) => new Date(s.startDate) >= now,
      );
      const next = upcomingSchedules[0] ?? t.schedules[0] ?? null;

      let nextSchedule = null;
      if (next) {
        const confirmedSeats = next.bookings
          .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
          .reduce((sum, b) => sum + b.participantCount, 0);
        const availableSeats = Math.max(0, next.capacity - confirmedSeats);
        const startingPrice = next.packages[0]
          ? Number(next.packages[0].price)
          : 0;

        nextSchedule = {
          id: next.id,
          startDate: next.startDate.toISOString().slice(0, 10),
          endDate: next.endDate.toISOString().slice(0, 10),
          capacity: next.capacity,
          confirmedSeats,
          availableSeats,
          availabilityStatus: computeAvailability(next.capacity, confirmedSeats)
            .availabilityStatus,
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
        duration: {
          days: t.durationDays,
          nights: t.durationNights,
        },
        mountain: {
          name: t.mountain.name,
          slug: t.mountain.slug,
          altitudeM: t.mountain.altitudeM,
        },
        coverImage: {
          url: cover?.media?.url ?? '',
          alt: cover?.media?.altText ?? t.name,
        },
        nextSchedule,
        allSchedules: t.schedules,
      };
    });

    if (query.month) {
      const [y, m] = query.month.split('-');
      formatted = formatted.filter((item) =>
        item.allSchedules.some((s) => {
          const d = new Date(s.startDate);
          return (
            d.getUTCFullYear() === Number(y) &&
            d.getUTCMonth() + 1 === Number(m)
          );
        }),
      );
    }

    if (query.availability) {
      formatted = formatted.filter(
        (item) => item.nextSchedule?.availabilityStatus === query.availability,
      );
    }

    if (query.sort === 'startDate') {
      formatted.sort((a, b) => {
        const aDate = a.nextSchedule
          ? new Date(a.nextSchedule.startDate).getTime()
          : Infinity;
        const bDate = b.nextSchedule
          ? new Date(b.nextSchedule.startDate).getTime()
          : Infinity;
        return query.order === 'desc' ? bDate - aDate : aDate - bDate;
      });
    } else if (query.sort === 'price') {
      formatted.sort((a, b) => {
        const aPrice = a.nextSchedule ? a.nextSchedule.startingPrice : Infinity;
        const bPrice = b.nextSchedule ? b.nextSchedule.startingPrice : Infinity;
        return query.order === 'desc' ? bPrice - aPrice : aPrice - bPrice;
      });
    } else if (query.sort === 'name') {
      formatted.sort((a, b) =>
        query.order === 'desc'
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name),
      );
    }

    const total = formatted.length;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const paged = formatted.slice(skip, skip + pageSize).map((t) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { allSchedules, ...rest } = t;
      return rest;
    });

    return {
      data: paged,
      meta: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  async getBySlugPublic(slug: string) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: {
        mountain: {
          include: {
            destination: true,
          },
        },
        route: true,
        media: {
          include: { media: true },
          orderBy: { sortOrder: 'asc' },
        },
        itineraries: {
          orderBy: { dayNumber: 'asc' },
        },
        facilities: true,
        gears: true,
        faqs: {
          orderBy: { sortOrder: 'asc' },
        },
        schedules: {
          where: {
            status: { in: ['OPEN', 'CLOSED', 'CANCELLED', 'COMPLETED'] },
          },
          orderBy: { startDate: 'asc' },
          include: {
            bookings: {
              select: { status: true, participantCount: true },
            },
            packages: {
              where: { status: 'ACTIVE' },
              orderBy: { sortOrder: 'asc' },
              include: { meetingPoint: true },
            },
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException({
        code: 'TRIP_NOT_FOUND',
        message: 'Trip tidak ditemukan atau belum dipublikasikan.',
      });
    }

    const cover =
      trip.media.find((m) => m.mediaRole === 'COVER') ?? trip.media[0];
    const gallery = trip.media
      .filter((m) => m.mediaRole === 'GALLERY')
      .map((m) => ({
        url: m.media.url,
        alt: m.media.altText || trip.name,
      }));

    const now = Date.now();
    const schedules = trip.schedules.map((s) => {
      const confirmedSeats = s.bookings
        .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .reduce((sum, b) => sum + b.participantCount, 0);
      const availableSeats = Math.max(0, s.capacity - confirmedSeats);
      const isDeadlineValid =
        !s.registrationDeadline ||
        new Date(s.registrationDeadline).getTime() > now;
      const bookable =
        s.status === 'OPEN' && availableSeats > 0 && isDeadlineValid;

      return {
        id: s.id,
        startDate: s.startDate.toISOString().slice(0, 10),
        endDate: s.endDate.toISOString().slice(0, 10),
        registrationDeadline: s.registrationDeadline?.toISOString() ?? null,
        lifecycleStatus: s.status,
        capacity: s.capacity,
        confirmedSeats,
        availableSeats,
        availabilityStatus: computeAvailability(s.capacity, confirmedSeats)
          .availabilityStatus,
        bookable,
        packages: s.packages.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: Number(p.price),
          meetingPoint: p.meetingPoint
            ? {
                id: p.meetingPoint.id,
                name: p.meetingPoint.name,
                city: p.meetingPoint.city,
                address: p.meetingPoint.address,
                latitude: p.meetingPoint.latitude
                  ? Number(p.meetingPoint.latitude)
                  : null,
                longitude: p.meetingPoint.longitude
                  ? Number(p.meetingPoint.longitude)
                  : null,
              }
            : null,
          meetingDatetime: p.meetingDatetime?.toISOString() ?? null,
        })),
      };
    });

    return {
      id: trip.id,
      name: trip.name,
      slug: trip.slug,
      tripType: trip.tripType,
      shortDescription: trip.shortDescription,
      description: trip.description,
      highlights: [],
      difficulty: trip.difficulty,
      beginnerFriendly: trip.beginnerFriendly,
      healthCertificateRequired: trip.healthCertificateRequired,
      minimumAge: trip.minimumAge,
      maximumAge: trip.maximumAge,
      duration: {
        days: trip.durationDays,
        nights: trip.durationNights,
      },
      mountain: {
        id: trip.mountain.id,
        name: trip.mountain.name,
        slug: trip.mountain.slug,
        altitudeM: trip.mountain.altitudeM ?? 0,
        destination: {
          name: trip.mountain.destination.name,
        },
      },
      route: trip.route
        ? {
            id: trip.route.id,
            name: trip.route.name,
          }
        : null,
      media: {
        cover: {
          url: cover?.media?.url ?? '',
          alt: cover?.media?.altText ?? trip.name,
        },
        gallery,
      },
      schedules,
      itinerary: trip.itineraries.map((it) => ({
        id: it.id,
        dayNumber: it.dayNumber,
        title: it.title,
        description: it.description,
      })),
      includes: trip.facilities
        .filter((f) => f.facilityType === 'INCLUDE')
        .map((f) => ({
          id: f.id,
          item: f.name,
          description: f.description,
        })),
      excludes: trip.facilities
        .filter((f) => f.facilityType === 'EXCLUDE')
        .map((f) => ({
          id: f.id,
          item: f.name,
          description: f.description,
        })),
      mandatoryGear: trip.gears
        .filter((g) => g.gearType === 'MANDATORY')
        .map((g) => ({
          id: g.id,
          gearName: g.name,
          specification: g.description,
        })),
      recommendedGear: trip.gears
        .filter((g) => g.gearType === 'RECOMMENDED')
        .map((g) => ({
          id: g.id,
          gearName: g.name,
          specification: g.description,
        })),
      faqs: trip.faqs.map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
      })),
      seo: {
        title: trip.seoTitle || trip.name,
        description: trip.seoDescription || trip.shortDescription || trip.name,
      },
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
      // Audit log failures should not block mutation response
    }
  }
}
