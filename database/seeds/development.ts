import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  AdminStatus,
  ContentStatus,
  DestinationStatus,
  DifficultyLevel,
  EntityStatus,
  PrismaClient,
  ScheduleStatus,
  TripType,
} from '../../apps/api/src/generated/prisma/client';

const ids = {
  admin: '00000000-0000-4000-8000-000000000001',
  destination: '00000000-0000-4000-8000-000000000010',
  mountain: '00000000-0000-4000-8000-000000000020',
  route: '00000000-0000-4000-8000-000000000030',
  trip: '00000000-0000-4000-8000-000000000040',
  schedule: '00000000-0000-4000-8000-000000000050',
  meetingPoint: '00000000-0000-4000-8000-000000000060',
  packageJakarta: '00000000-0000-4000-8000-000000000070',
  packageBasecamp: '00000000-0000-4000-8000-000000000071',
  faq: '00000000-0000-4000-8000-000000000080',
} as const;

const roles = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    name: 'Super Admin',
    slug: 'SUPER_ADMIN',
    description: 'Akses penuh ke seluruh fungsi administrasi Wildera.',
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    name: 'Operations',
    slug: 'OPERATIONS',
    description: 'Mengelola trip, jadwal, booking, peserta, dan Private Trip.',
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    name: 'Content',
    slug: 'CONTENT',
    description: 'Mengelola katalog dan konten website.',
  },
] as const;

function requiredEnvironment() {
  const databaseUrl = process.env.DATABASE_URL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!databaseUrl) throw new Error('DATABASE_URL wajib diisi untuk seed.');
  if (!password || password.length < 12 || password.startsWith('replace_')) {
    throw new Error(
      'SEED_ADMIN_PASSWORD wajib diisi dengan password development minimal 12 karakter.',
    );
  }
  return {
    databaseUrl,
    password,
    email: (process.env.SEED_ADMIN_EMAIL ?? 'admin@wildera.test')
      .trim()
      .toLowerCase(),
    name: (process.env.SEED_ADMIN_NAME ?? 'Admin Wildera').trim(),
  };
}

async function reusablePasswordHash(
  currentHash: string | undefined,
  password: string,
) {
  if (currentHash) {
    try {
      if (await argon2.verify(currentHash, password)) return currentHash;
    } catch {
      // A legacy or malformed value is replaced with a valid Argon2id hash below.
    }
  }
  return argon2.hash(password, { type: argon2.argon2id });
}

async function seed() {
  const environment = requiredEnvironment();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: environment.databaseUrl }),
  });

  try {
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: environment.email },
      select: { passwordHash: true },
    });
    const passwordHash = await reusablePasswordHash(
      existingAdmin?.passwordHash,
      environment.password,
    );

    await prisma.$transaction(async (database) => {
      const seededRoles = new Map<string, string>();
      for (const role of roles) {
        const record = await database.role.upsert({
          where: { slug: role.slug },
          create: role,
          update: { name: role.name, description: role.description },
          select: { id: true, slug: true },
        });
        seededRoles.set(record.slug, record.id);
      }

      const admin = await database.adminUser.upsert({
        where: { email: environment.email },
        create: {
          id: ids.admin,
          name: environment.name,
          email: environment.email,
          passwordHash,
          status: AdminStatus.ACTIVE,
        },
        update: {
          name: environment.name,
          passwordHash,
          status: AdminStatus.ACTIVE,
        },
        select: { id: true },
      });
      const superAdminRoleId = seededRoles.get('SUPER_ADMIN');
      if (!superAdminRoleId) throw new Error('Role SUPER_ADMIN gagal dibuat.');
      await database.adminUserRole.upsert({
        where: {
          adminUserId_roleId: {
            adminUserId: admin.id,
            roleId: superAdminRoleId,
          },
        },
        create: { adminUserId: admin.id, roleId: superAdminRoleId },
        update: {},
      });

      const destination = await database.destination.upsert({
        where: { slug: 'jawa-tengah' },
        create: {
          id: ids.destination,
          name: 'Jawa Tengah',
          slug: 'jawa-tengah',
          province: 'Jawa Tengah',
          region: 'Jawa',
          status: DestinationStatus.ACTIVE,
        },
        update: {
          name: 'Jawa Tengah',
          province: 'Jawa Tengah',
          region: 'Jawa',
          status: DestinationStatus.ACTIVE,
          deletedAt: null,
        },
        select: { id: true },
      });

      const mountain = await database.mountain.upsert({
        where: { slug: 'gunung-prau' },
        create: {
          id: ids.mountain,
          destinationId: destination.id,
          name: 'Gunung Prau',
          slug: 'gunung-prau',
          altitudeM: 2590,
          defaultDifficulty: DifficultyLevel.MODERATE,
          status: ContentStatus.DRAFT,
        },
        update: {
          destinationId: destination.id,
          name: 'Gunung Prau',
          altitudeM: 2590,
          defaultDifficulty: DifficultyLevel.MODERATE,
          status: ContentStatus.DRAFT,
          deletedAt: null,
        },
        select: { id: true },
      });

      const route = await database.route.upsert({
        where: {
          mountainId_slug: {
            mountainId: mountain.id,
            slug: 'patak-banteng',
          },
        },
        create: {
          id: ids.route,
          mountainId: mountain.id,
          name: 'Prau via Patak Banteng',
          slug: 'patak-banteng',
          startingPoint: 'Basecamp Patak Banteng',
          difficulty: DifficultyLevel.MODERATE,
          status: ContentStatus.DRAFT,
        },
        update: {
          name: 'Prau via Patak Banteng',
          startingPoint: 'Basecamp Patak Banteng',
          difficulty: DifficultyLevel.MODERATE,
          status: ContentStatus.DRAFT,
          deletedAt: null,
        },
        select: { id: true },
      });

      const trip = await database.trip.upsert({
        where: { slug: 'open-trip-prau' },
        create: {
          id: ids.trip,
          mountainId: mountain.id,
          routeId: route.id,
          name: 'Open Trip Prau',
          slug: 'open-trip-prau',
          tripType: TripType.OPEN_TRIP,
          durationDays: 2,
          durationNights: 1,
          difficulty: DifficultyLevel.MODERATE,
          beginnerFriendly: true,
          status: ContentStatus.DRAFT,
          createdBy: admin.id,
        },
        update: {
          mountainId: mountain.id,
          routeId: route.id,
          name: 'Open Trip Prau',
          tripType: TripType.OPEN_TRIP,
          durationDays: 2,
          durationNights: 1,
          difficulty: DifficultyLevel.MODERATE,
          beginnerFriendly: true,
          status: ContentStatus.DRAFT,
          createdBy: admin.id,
          deletedAt: null,
        },
        select: { id: true },
      });

      await database.tripSchedule.upsert({
        where: { id: ids.schedule },
        create: {
          id: ids.schedule,
          tripId: trip.id,
          startDate: new Date('2026-09-19T00:00:00.000Z'),
          endDate: new Date('2026-09-20T00:00:00.000Z'),
          capacity: 20,
          status: ScheduleStatus.DRAFT,
          createdBy: admin.id,
        },
        update: {
          tripId: trip.id,
          startDate: new Date('2026-09-19T00:00:00.000Z'),
          endDate: new Date('2026-09-20T00:00:00.000Z'),
          capacity: 20,
          status: ScheduleStatus.DRAFT,
          createdBy: admin.id,
        },
      });

      await database.meetingPoint.upsert({
        where: { id: ids.meetingPoint },
        create: {
          id: ids.meetingPoint,
          name: 'Blok M',
          city: 'Jakarta',
          status: EntityStatus.ACTIVE,
        },
        update: {
          name: 'Blok M',
          city: 'Jakarta',
          status: EntityStatus.ACTIVE,
        },
      });

      await database.schedulePackage.upsert({
        where: { id: ids.packageJakarta },
        create: {
          id: ids.packageJakarta,
          scheduleId: ids.schedule,
          meetingPointId: ids.meetingPoint,
          name: 'Start Jakarta',
          price: '1250000',
          status: EntityStatus.ACTIVE,
          sortOrder: 1,
        },
        update: {
          scheduleId: ids.schedule,
          meetingPointId: ids.meetingPoint,
          name: 'Start Jakarta',
          price: '1250000',
          status: EntityStatus.ACTIVE,
          sortOrder: 1,
        },
      });
      await database.schedulePackage.upsert({
        where: { id: ids.packageBasecamp },
        create: {
          id: ids.packageBasecamp,
          scheduleId: ids.schedule,
          meetingPointId: null,
          name: 'Start Basecamp',
          price: '750000',
          status: EntityStatus.ACTIVE,
          sortOrder: 2,
        },
        update: {
          scheduleId: ids.schedule,
          meetingPointId: null,
          name: 'Start Basecamp',
          price: '750000',
          status: EntityStatus.ACTIVE,
          sortOrder: 2,
        },
      });

      await database.faq.upsert({
        where: { id: ids.faq },
        create: {
          id: ids.faq,
          category: 'Booking',
          question: 'Bagaimana cara booking Open Trip?',
          answer:
            'Pilih jadwal dan paket di halaman trip, lalu hubungi admin Wildera melalui WhatsApp untuk konfirmasi ketersediaan.',
          sortOrder: 1,
          status: ContentStatus.DRAFT,
        },
        update: {
          category: 'Booking',
          question: 'Bagaimana cara booking Open Trip?',
          answer:
            'Pilih jadwal dan paket di halaman trip, lalu hubungi admin Wildera melalui WhatsApp untuk konfirmasi ketersediaan.',
          sortOrder: 1,
          status: ContentStatus.DRAFT,
        },
      });

      const defaultSettings = [
        {
          key: 'business_whatsapp',
          value: '6281234567890',
        },
        {
          key: 'instagram_url',
          value: 'https://instagram.com/wildera.adventure',
        },
        {
          key: 'contact_email',
          value: 'info@wildera.id',
        },
        {
          key: 'almost_full_percentage',
          value: 20,
        },
      ];

      for (const item of defaultSettings) {
        await database.siteSetting.upsert({
          where: { settingKey: item.key },
          create: {
            settingKey: item.key,
            settingValue: item.value,
            isPublic: true,
          },
          update: {
            settingValue: item.value,
            isPublic: true,
          },
        });
      }
    });

    console.log(
      `Development seed ready for ${environment.email}: 3 roles, 1 destination, 1 mountain, 1 route, 1 trip, 1 schedule, 2 packages, 1 meeting point, 1 FAQ, 4 site settings.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
