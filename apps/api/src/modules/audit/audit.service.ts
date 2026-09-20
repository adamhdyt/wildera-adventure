import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { validateAuditLogQuery } from '@wildera/validation';
import { Prisma } from '../../generated/prisma/client';

const ACTION_ALIASES: Record<string, string[]> = {
  TRIP_PUBLISHED: ['TRIP_PUBLISHED', 'TRIP_PUBLISH'],
  TRIP_PUBLISH: ['TRIP_PUBLISHED', 'TRIP_PUBLISH'],
  BOOKING_CREATED: ['BOOKING_CREATED', 'BOOKING_CREATE'],
  BOOKING_CREATE: ['BOOKING_CREATED', 'BOOKING_CREATE'],
  BOOKING_CONFIRMED: ['BOOKING_CONFIRMED', 'BOOKING_CONFIRM'],
  BOOKING_CONFIRM: ['BOOKING_CONFIRMED', 'BOOKING_CONFIRM'],
  BOOKING_CANCELLED: ['BOOKING_CANCELLED', 'BOOKING_CANCEL'],
  BOOKING_CANCEL: ['BOOKING_CANCELLED', 'BOOKING_CANCEL'],
  SCHEDULE_CAPACITY_CHANGED: ['SCHEDULE_CAPACITY_CHANGED'],
  ADMIN_ROLE_CHANGED: ['ADMIN_ROLE_CHANGED'],
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuditLogs(
    rawQuery: Record<string, unknown>,
    userRoles: readonly string[] = [],
  ) {
    const query = validateAuditLogQuery(rawQuery);
    const where: Prisma.AuditLogWhereInput = {};

    if (query.adminUserId) {
      where.adminUserId = query.adminUserId;
    }

    if (query.entityType) {
      where.entityType = {
        equals: query.entityType,
        mode: 'insensitive',
      };
    }

    if (query.entityId) {
      where.entityId = query.entityId;
    }

    if (query.action) {
      const aliases = ACTION_ALIASES[query.action] ?? [query.action];
      where.action = { in: aliases };
    }

    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) {
        where.createdAt.gte = query.fromDate;
      }
      if (query.toDate) {
        where.createdAt.lte = query.toDate;
      }
    }

    if (query.search) {
      const search = query.search;
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        {
          adminUser: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        take: query.limit,
        skip: (query.page - 1) * query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          adminUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

    const data = rows.map((row) => {
      let oldValue: unknown = row.oldValue;
      let newValue: unknown = row.newValue;

      // Mask sensitive values for non-superadmin viewers
      if (!isSuperAdmin) {
        oldValue = this.maskSensitiveData(oldValue);
        newValue = this.maskSensitiveData(newValue);
      }

      return {
        id: row.id,
        adminUserId: row.adminUserId,
        admin: row.adminUser
          ? {
              id: row.adminUser.id,
              name: row.adminUser.name,
              email: isSuperAdmin ? row.adminUser.email : undefined,
            }
          : null,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        oldValue,
        newValue,
        requestId: row.requestId,
        ipAddress: isSuperAdmin ? row.ipAddress : null,
        userAgent: isSuperAdmin ? row.userAgent : null,
        createdAt: row.createdAt,
      };
    });

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  private maskSensitiveData(val: unknown): unknown {
    if (!val || typeof val !== 'object') return val;
    if (Array.isArray(val)) {
      return val.map((item) => this.maskSensitiveData(item));
    }
    const masked: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      const lower = k.toLowerCase();
      if (
        lower.includes('password') ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('idcard') ||
        lower.includes('nik')
      ) {
        masked[k] = '[REDACTED]';
      } else if (v && typeof v === 'object') {
        masked[k] = this.maskSensitiveData(v);
      } else {
        masked[k] = v;
      }
    }
    return masked;
  }
}
