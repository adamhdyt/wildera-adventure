import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { PrismaService } from '../../common/database/prisma.service';
import type { LoginInput } from './login.input';
import type { AdminSessionUser } from './auth.types';

const dummyPasswordHash =
  '$argon2id$v=19$m=65536,p=4,t=3$P/qZgh02KFwqpfUimUGWzg$aK1X+TUbmkNhqsPy4JuHPUJmxqlrESuX63HmSjeRwiw';

const adminWithRoles = {
  roles: {
    include: { role: true },
  },
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly database: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(input: LoginInput) {
    const admin = await this.database.adminUser.findUnique({
      where: { email: input.email },
      include: adminWithRoles,
    });
    let passwordMatches = false;
    try {
      passwordMatches = await argon2.verify(
        admin?.passwordHash ?? dummyPasswordHash,
        input.password,
      );
    } catch {
      passwordMatches = false;
    }
    if (!admin || !passwordMatches || admin.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email atau password tidak valid.',
      });
    }

    const sessionState = await this.database.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
      select: { updatedAt: true },
    });
    const token = await this.jwt.signAsync(
      { sessionVersion: sessionState.updatedAt.toISOString() },
      { subject: admin.id },
    );
    return { token, user: this.toSessionUser(admin) };
  }

  async findSessionUser(adminId: string, sessionVersion: string) {
    const admin = await this.database.adminUser.findUnique({
      where: { id: adminId },
      include: adminWithRoles,
    });
    if (!admin) return undefined;
    if (admin.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        code: 'ADMIN_DISABLED',
        message: 'Akun admin dinonaktifkan.',
      });
    }
    if (admin.updatedAt.toISOString() !== sessionVersion) return undefined;
    return this.toSessionUser(admin);
  }

  async logout(adminId: string) {
    await this.database.$executeRaw`
      UPDATE admin_users
      SET updated_at = GREATEST(clock_timestamp(), updated_at + interval '1 millisecond')
      WHERE id = ${adminId}::uuid
    `;
  }

  private toSessionUser(admin: {
    email: string;
    id: string;
    name: string;
    roles: Array<{ role: { slug: string } }>;
  }): AdminSessionUser {
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      roles: admin.roles.map(({ role }) => role.slug).sort(),
    };
  }
}
