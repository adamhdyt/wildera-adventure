import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import argon2 from 'argon2';
import { PrismaService } from '../../common/database/prisma.service';
import {
  validateCreateAdminUser,
  validateUpdateAdminUser,
} from '@wildera/validation';
import { AdminStatus } from '../../generated/prisma/client';

export interface AdminActor {
  id?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers() {
    const users = await this.prisma.adminUser.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      status: u.status,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      roles: u.roles.map((r) => r.role.slug),
    }));
  }

  async getUserById(id: string) {
    const u = await this.prisma.adminUser.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!u) {
      throw new NotFoundException('Admin user tidak ditemukan.');
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      status: u.status,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      roles: u.roles.map((r) => r.role.slug),
    };
  }

  async createUser(body: unknown, actor?: AdminActor) {
    const validation = validateCreateAdminUser(body);
    if (!validation.valid || !validation.data) {
      throw new BadRequestException({
        message: 'Validasi data admin gagal.',
        errors: validation.errors,
      });
    }

    const { name, email, password, roles: roleSlugs } = validation.data;

    // Check unique email
    const existing = await this.prisma.adminUser.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Email admin sudah terdaftar.');
    }

    // Resolve roles
    const dbRoles = await this.prisma.role.findMany({
      where: { slug: { in: roleSlugs } },
    });

    if (dbRoles.length !== roleSlugs.length) {
      throw new BadRequestException('Sebagian role tidak ditemukan di sistem.');
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const user = await this.prisma.adminUser.create({
      data: {
        name,
        email,
        passwordHash,
        status: AdminStatus.ACTIVE,
        roles: {
          create: dbRoles.map((r) => ({
            roleId: r.id,
          })),
        },
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    // Write audit log
    try {
      await this.prisma.auditLog.create({
        data: {
          adminUserId: actor?.id ?? null,
          action: 'ADMIN_USER_CREATED',
          entityType: 'ADMIN_USER',
          entityId: user.id,
          newValue: {
            name: user.name,
            email: user.email,
            roles: roleSlugs,
          },
          ipAddress: actor?.ipAddress ?? null,
          userAgent: actor?.userAgent ?? null,
        },
      });
    } catch {
      // Non-blocking
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      roles: user.roles.map((r) => r.role.slug),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateUser(id: string, body: unknown, actor?: AdminActor) {
    const existing = await this.getUserById(id);

    const validation = validateUpdateAdminUser(body);
    if (!validation.valid || !validation.data) {
      throw new BadRequestException({
        message: 'Validasi pembaruan admin gagal.',
        errors: validation.errors,
      });
    }

    const { name, roles: newRoleSlugs, status } = validation.data;

    // Prepare update
    const updateData: { name?: string; status?: AdminStatus } = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status as AdminStatus;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.adminUser.update({
        where: { id },
        data: updateData,
      });
    }

    // Role changes
    if (newRoleSlugs) {
      const oldRoles = existing.roles;
      const rolesChanged =
        oldRoles.length !== newRoleSlugs.length ||
        oldRoles.some((r) => !newRoleSlugs.includes(r));

      if (rolesChanged) {
        const dbRoles = await this.prisma.role.findMany({
          where: { slug: { in: newRoleSlugs } },
        });

        if (dbRoles.length !== newRoleSlugs.length) {
          throw new BadRequestException(
            'Sebagian role tidak ditemukan di sistem.',
          );
        }

        // Replace roles in transaction
        await this.prisma.$transaction(async (tx) => {
          await tx.adminUserRole.deleteMany({
            where: { adminUserId: id },
          });

          await tx.adminUserRole.createMany({
            data: dbRoles.map((r) => ({
              adminUserId: id,
              roleId: r.id,
            })),
          });
        });

        // Audit ADMIN_ROLE_CHANGED
        try {
          await this.prisma.auditLog.create({
            data: {
              adminUserId: actor?.id ?? null,
              action: 'ADMIN_ROLE_CHANGED',
              entityType: 'ADMIN_USER',
              entityId: id,
              oldValue: { roles: oldRoles },
              newValue: { roles: newRoleSlugs },
              ipAddress: actor?.ipAddress ?? null,
              userAgent: actor?.userAgent ?? null,
            },
          });
        } catch {
          // Non-blocking
        }
      }
    }

    return this.getUserById(id);
  }

  async setUserStatus(id: string, status: AdminStatus, actor?: AdminActor) {
    const existing = await this.getUserById(id);
    if (existing.status === status) {
      return existing;
    }

    await this.prisma.adminUser.update({
      where: { id },
      data: { status },
    });

    try {
      await this.prisma.auditLog.create({
        data: {
          adminUserId: actor?.id ?? null,
          action:
            status === AdminStatus.ACTIVE ? 'ADMIN_ENABLED' : 'ADMIN_DISABLED',
          entityType: 'ADMIN_USER',
          entityId: id,
          oldValue: { status: existing.status },
          newValue: { status },
          ipAddress: actor?.ipAddress ?? null,
          userAgent: actor?.userAgent ?? null,
        },
      });
    } catch {
      // Non-blocking
    }

    return this.getUserById(id);
  }
}
