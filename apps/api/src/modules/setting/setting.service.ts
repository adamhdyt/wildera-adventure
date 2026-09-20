import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import {
  SUPPORTED_SETTING_KEYS,
  SupportedSettingKey,
  validateUpdateSetting,
} from '@wildera/validation';

export const DEFAULT_SITE_SETTINGS: Record<SupportedSettingKey, unknown> = {
  business_whatsapp: '6281234567890',
  instagram_url: 'https://instagram.com/wildera.adventure',
  contact_email: 'info@wildera.id',
  almost_full_percentage: 20,
};

@Injectable()
export class SettingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public settings:
   * Only returns rows where is_public = true.
   * Excludes any key containing secret/password/token/key to prevent data leakage.
   */
  async getPublicSettings(): Promise<Record<string, unknown>> {
    const rows = await this.prisma.siteSetting.findMany({
      where: { isPublic: true },
      select: {
        settingKey: true,
        settingValue: true,
      },
    });

    const result: Record<string, unknown> = {};
    for (const row of rows) {
      const lower = row.settingKey.toLowerCase();
      if (
        lower.includes('secret') ||
        lower.includes('password') ||
        lower.includes('token')
      ) {
        continue;
      }
      result[row.settingKey] = row.settingValue;
    }

    // Ensure default public keys exist if not yet seeded
    for (const key of SUPPORTED_SETTING_KEYS) {
      if (result[key] === undefined) {
        result[key] = DEFAULT_SITE_SETTINGS[key];
      }
    }

    return result;
  }

  /**
   * Admin settings:
   * Returns all supported settings merged with current database values.
   */
  async getAllAdminSettings(): Promise<{
    business_whatsapp: string;
    instagram_url: string;
    contact_email: string;
    almost_full_percentage: number;
    items: Array<{
      id: string;
      key: string;
      value: unknown;
      isPublic: boolean;
      updatedAt: Date;
    }>;
    [key: string]: unknown;
  }> {
    const rows = await this.prisma.siteSetting.findMany({
      orderBy: { settingKey: 'asc' },
    });

    const map: Record<string, unknown> = {};
    const items = rows.map((r) => {
      map[r.settingKey] = r.settingValue;
      return {
        id: r.id,
        key: r.settingKey,
        value: r.settingValue,
        isPublic: r.isPublic,
        updatedAt: r.updatedAt,
      };
    });

    return {
      business_whatsapp: String(
        map.business_whatsapp ?? DEFAULT_SITE_SETTINGS.business_whatsapp,
      ),
      instagram_url: String(
        map.instagram_url ?? DEFAULT_SITE_SETTINGS.instagram_url,
      ),
      contact_email: String(
        map.contact_email ?? DEFAULT_SITE_SETTINGS.contact_email,
      ),
      almost_full_percentage: Number(
        map.almost_full_percentage ??
          DEFAULT_SITE_SETTINGS.almost_full_percentage,
      ),
      items,
      ...map,
    };
  }

  /**
   * Admin update single setting key:
   * Validates key against whitelist and value against type rules.
   * Writes immutable audit log.
   */
  async updateSetting(
    key: string,
    payload: unknown,
    adminId?: string,
  ): Promise<{
    id: string;
    key: string;
    value: unknown;
    updatedAt: Date;
  }> {
    const validation = validateUpdateSetting(key, payload);
    if (!validation.valid || !validation.data) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validasi pengaturan gagal',
        errors: validation.errors,
      });
    }

    const validKey = validation.data.key;
    const validValue = validation.data.value;

    const existing = await this.prisma.siteSetting.findUnique({
      where: { settingKey: validKey },
    });

    const updated = await this.prisma.siteSetting.upsert({
      where: { settingKey: validKey },
      create: {
        settingKey: validKey,
        settingValue: validValue as Prisma.InputJsonValue,
        isPublic: true,
        updatedBy: adminId ?? null,
      },
      update: {
        settingValue: validValue as Prisma.InputJsonValue,
        isPublic: true,
        updatedBy: adminId ?? null,
      },
    });

    // Write audit log
    try {
      await this.prisma.auditLog.create({
        data: {
          adminUserId: adminId ?? null,
          action: 'SETTING_UPDATE',
          entityType: 'SITE_SETTING',
          entityId: updated.id,
          oldValue: (existing
            ? ({ value: existing.settingValue } as Prisma.InputJsonValue)
            : Prisma.JsonNull) as Prisma.InputJsonValue,
          newValue: {
            value: validValue,
          } as Prisma.InputJsonValue,
        },
      });
    } catch {
      // Non-blocking audit error
    }

    return {
      id: updated.id,
      key: updated.settingKey,
      value: updated.settingValue,
      updatedAt: updated.updatedAt,
    };
  }
}
