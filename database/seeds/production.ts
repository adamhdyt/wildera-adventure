import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  AdminStatus,
  ContentStatus,
  DestinationStatus,
  DifficultyLevel,
  EntityStatus,
  FacilityType,
  GearType,
  MediaRole,
  PrismaClient,
  ScheduleStatus,
  TripType,
} from '../../apps/api/src/generated/prisma/client';

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
  const password =
    process.env.PROD_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;

  if (!databaseUrl) throw new Error('DATABASE_URL wajib diisi untuk seed.');
  if (
    !password ||
    password.length < 12 ||
    password.includes('admin123') ||
    password.startsWith('replace_')
  ) {
    throw new Error(
      'PROD_ADMIN_PASSWORD wajib diisi dengan password produksi minimal 12 karakter non-trivial.',
    );
  }

  return {
    databaseUrl,
    password,
    email: (process.env.PROD_ADMIN_EMAIL ?? 'admin@wildera.id')
      .trim()
      .toLowerCase(),
    name: (process.env.PROD_ADMIN_NAME ?? 'Super Admin Wildera').trim(),
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
      // Re-hash invalid or outdated hash
    }
  }
  return argon2.hash(password, { type: argon2.argon2id });
}

async function seedProduction() {
  const env = requiredEnvironment();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.databaseUrl }),
  });

  try {
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: env.email },
      select: { passwordHash: true },
    });
    const passwordHash = await reusablePasswordHash(
      existingAdmin?.passwordHash,
      env.password,
    );

    await prisma.$transaction(async (database) => {
      // 1. Seed Core RBAC Roles
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

      // 2. Seed Initial Super Admin
      const admin = await database.adminUser.upsert({
        where: { email: env.email },
        create: {
          name: env.name,
          email: env.email,
          passwordHash,
          status: AdminStatus.ACTIVE,
        },
        update: {
          name: env.name,
          status: AdminStatus.ACTIVE,
        },
      });

      const superAdminRoleId = seededRoles.get('SUPER_ADMIN');
      if (superAdminRoleId) {
        await database.adminUserRole.upsert({
          where: {
            adminUserId_roleId: {
              adminUserId: admin.id,
              roleId: superAdminRoleId,
            },
          },
          create: {
            adminUserId: admin.id,
            roleId: superAdminRoleId,
          },
          update: {},
        });
      }

      // 3. Official Business Site Settings
      const defaultSettings = [
        {
          key: 'business_whatsapp',
          value: process.env.PROD_WHATSAPP ?? '6282319872790',
        },
        {
          key: 'instagram_url',
          value:
            process.env.PROD_INSTAGRAM ??
            'https://instagram.com/wilderaadventure.id',
        },
        {
          key: 'contact_email',
          value: process.env.PROD_EMAIL ?? 'wilderaadventure.id@gmail.com',
        },
        {
          key: 'almost_full_percentage',
          value: 80,
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

      // 4. Official Core Content Pages
      const coreContentPages = [
        {
          pageKey: 'privacy',
          slug: 'kebijakan-privasi',
          title: 'Kebijakan Privasi',
          content: `# Kebijakan Privasi Wildera Adventure\n\nWildera Adventure menghargai dan menjaga kerahasiaan data setiap peserta. Dokumen ini menjelaskan pengumpulan, penggunaan, serta perlindungan data identitas, nomor telepon, dan kontak darurat Anda selama proses booking dan penyelenggaraan pendakian.`,
          seoTitle: 'Kebijakan Privasi | Wildera Adventure',
          seoDescription:
            'Kebijakan perlindungan data dan privasi peserta ekspedisi gunung Wildera Adventure.',
        },
        {
          pageKey: 'terms',
          slug: 'syarat-dan-ketentuan',
          title: 'Syarat & Ketentuan',
          content: `# Syarat & Ketentuan Layanan\n\nKetentuan umum keikutsertaan open trip dan private trip, persyaratan usia dan kondisi medis, kelengkapan gear pribadi, serta tanggung jawab peserta mematuhi arahan tim leader dan regulasi Taman Nasional.`,
          seoTitle: 'Syarat & Ketentuan | Wildera Adventure',
          seoDescription:
            'Syarat dan ketentuan resmi pendaftaran trip dan ekspedisi gunung Wildera Adventure.',
        },
        {
          pageKey: 'cancellation',
          slug: 'kebijakan-pembatalan',
          title: 'Kebijakan Pembatalan',
          content: `# Kebijakan Pembatalan & Pengembalian Dana\n\nKetentuan pembatalan sepihak oleh peserta, kebijakan transfer jadwal (reschedule), penggantian peserta, serta ketentuan penutupan jalur akibat cuaca ekstrem atau force majeure pihak pengelola kawasan.`,
          seoTitle: 'Kebijakan Pembatalan | Wildera Adventure',
          seoDescription:
            'Ketentuan pembatalan, refund, dan reschedule pendakian gunung bersama Wildera Adventure.',
        },
        {
          pageKey: 'safety',
          slug: 'standar-keselamatan',
          title: 'Standar Keselamatan',
          content: `# Standar Keselamatan & Medis\n\nKomitmen Wildera Adventure terhadap keselamatan: pemandu berlisensi resmi APGI, rasio pemandu dan porter ideal, First Aid Kit standar lapangan, oksigen portabel, dan protokol evakuasi terintegrasi dengan Ranger Basecamp.`,
          seoTitle: 'Standar Keselamatan & Medis | Wildera Adventure',
          seoDescription:
            'Protokol keamanan, standar medis lapangan, dan mitigasi risiko pendakian Wildera Adventure.',
        },
      ];

      for (const page of coreContentPages) {
        await database.contentPage.upsert({
          where: { pageKey: page.pageKey },
          create: {
            ...page,
            status: ContentStatus.PUBLISHED,
          },
          update: {
            title: page.title,
            content: page.content,
            status: ContentStatus.PUBLISHED,
          },
        });
      }

      // 5. Official Real Destinations
      const destinationsData = [
        {
          name: 'Jawa Barat',
          slug: 'jawa-barat',
          province: 'Jawa Barat',
          region: 'Jawa',
          status: DestinationStatus.ACTIVE,
        },
        {
          name: 'Jawa Tengah',
          slug: 'jawa-tengah',
          province: 'Jawa Tengah',
          region: 'Jawa',
          status: DestinationStatus.ACTIVE,
        },
        {
          name: 'Jawa Timur',
          slug: 'jawa-timur',
          province: 'Jawa Timur',
          region: 'Jawa',
          status: DestinationStatus.ACTIVE,
        },
      ];

      const destinationMap = new Map<string, string>();
      for (const dest of destinationsData) {
        const record = await database.destination.upsert({
          where: { slug: dest.slug },
          create: dest,
          update: { name: dest.name, status: dest.status },
        });
        destinationMap.set(dest.slug, record.id);
      }

      // 6. Official Real Mountains
      const jabarId = destinationMap.get('jawa-barat')!;
      const jatengId = destinationMap.get('jawa-tengah')!;
      const jatimId = destinationMap.get('jawa-timur')!;

      const mountainsData = [
        {
          name: 'Gunung Ciremai',
          slug: 'gunung-ciremai',
          destinationId: jabarId,
          altitudeM: 3078,
          defaultDifficulty: DifficultyLevel.MODERATE,
          status: ContentStatus.PUBLISHED,
        },
        {
          name: 'Gunung Merbabu',
          slug: 'gunung-merbabu',
          destinationId: jatengId,
          altitudeM: 3142,
          defaultDifficulty: DifficultyLevel.MODERATE,
          status: ContentStatus.PUBLISHED,
        },
        {
          name: 'Gunung Prau',
          slug: 'gunung-prau',
          destinationId: jatengId,
          altitudeM: 2590,
          defaultDifficulty: DifficultyLevel.EASY,
          status: ContentStatus.PUBLISHED,
        },
        {
          name: 'Gunung Papandayan',
          slug: 'gunung-papandayan',
          destinationId: jabarId,
          altitudeM: 2665,
          defaultDifficulty: DifficultyLevel.EASY,
          status: ContentStatus.PUBLISHED,
        },
        {
          name: 'Gunung Semeru',
          slug: 'gunung-semeru',
          destinationId: jatimId,
          altitudeM: 3676,
          defaultDifficulty: DifficultyLevel.HARD,
          status: ContentStatus.PUBLISHED,
        },
      ];

      const mountainMap = new Map<string, string>();
      for (const mtn of mountainsData) {
        const record = await database.mountain.upsert({
          where: { slug: mtn.slug },
          create: mtn,
          update: {
            name: mtn.name,
            altitudeM: mtn.altitudeM,
            defaultDifficulty: mtn.defaultDifficulty,
            status: mtn.status,
          },
        });
        mountainMap.set(mtn.slug, record.id);
      }

      // 7. Official Real Routes
      const ciremaiId = mountainMap.get('gunung-ciremai')!;
      const merbabuId = mountainMap.get('gunung-merbabu')!;
      const prauId = mountainMap.get('gunung-prau')!;

      const routesData = [
        {
          mountainId: ciremaiId,
          slug: 'ciremai-palutungan',
          name: 'Ciremai via Palutungan',
          startingPoint: 'Basecamp Palutungan, Kuningan',
          difficulty: DifficultyLevel.MODERATE,
          status: ContentStatus.PUBLISHED,
        },
        {
          mountainId: merbabuId,
          slug: 'merbabu-thekelan',
          name: 'Merbabu via Thekelan',
          startingPoint: 'Basecamp Thekelan, Kopeng',
          difficulty: DifficultyLevel.MODERATE,
          status: ContentStatus.PUBLISHED,
        },
        {
          mountainId: prauId,
          slug: 'prau-patak-banteng',
          name: 'Prau via Patak Banteng',
          startingPoint: 'Basecamp Patak Banteng, Dieng',
          difficulty: DifficultyLevel.EASY,
          status: ContentStatus.PUBLISHED,
        },
      ];

      const routeMap = new Map<string, string>();
      for (const r of routesData) {
        const record = await database.route.upsert({
          where: {
            mountainId_slug: { mountainId: r.mountainId, slug: r.slug },
          },
          create: r,
          update: {
            name: r.name,
            startingPoint: r.startingPoint,
            difficulty: r.difficulty,
            status: r.status,
          },
        });
        routeMap.set(r.slug, record.id);
      }

      // 8. Official Meeting Points
      const meetingPoints = [
        {
          name: 'Halte UKI / Cawang Jakarta',
          city: 'Jakarta Timur',
          address: 'Halte TransJakarta Cawang UKI, Mayjen Sutoyo',
          status: EntityStatus.ACTIVE,
        },
        {
          name: 'Basecamp Palutungan Kuningan',
          city: 'Kuningan',
          address: 'Jl. Palutungan, Cisantana, Cigugur, Kuningan',
          status: EntityStatus.ACTIVE,
        },
        {
          name: 'Basecamp Patak Banteng Dieng',
          city: 'Wonosobo',
          address: 'Jl. Dieng Km 24, Patakbanteng, Kejajar, Wonosobo',
          status: EntityStatus.ACTIVE,
        },
      ];

      const meetingPointMap = new Map<string, string>();
      for (const mp of meetingPoints) {
        const existing = await database.meetingPoint.findFirst({
          where: { name: mp.name },
        });
        if (existing) {
          meetingPointMap.set(mp.name, existing.id);
        } else {
          const created = await database.meetingPoint.create({
            data: mp,
          });
          meetingPointMap.set(mp.name, created.id);
        }
      }

      // 9. Official Production Trip: Open Trip Gunung Ciremai 2D1N
      const ciremaiRouteId = routeMap.get('ciremai-palutungan')!;
      const ciremaiTrip = await database.trip.upsert({
        where: { slug: 'open-trip-ciremai-palutungan' },
        create: {
          mountainId: ciremaiId,
          routeId: ciremaiRouteId,
          name: 'Open Trip Gunung Ciremai 2D1N Via Palutungan',
          slug: 'open-trip-ciremai-palutungan',
          tripType: TripType.OPEN_TRIP,
          durationDays: 2,
          durationNights: 1,
          difficulty: DifficultyLevel.MODERATE,
          beginnerFriendly: true,
          healthCertificateRequired: true,
          minimumAge: 15,
          maximumAge: 55,
          status: ContentStatus.PUBLISHED,
          featured: true,
          publishedAt: new Date(),
          createdBy: admin.id,
          shortDescription:
            'Menapaki atap tertinggi Jawa Barat (3.078 mdpl) via jalur legendaris Palutungan dengan camp nyaman dan pendampingan crew profesional.',
          description:
            'Gunung Ciremai merupakan gunung soliter tertinggi di Jawa Barat. Ekspedisi 2D1N ini dirancang dengan standar keselamatan tinggi, mencakup izin simaksi resmi, makan bergizi, sop buah segar, serta perlengkapan darurat medis.',
          seoTitle: 'Open Trip Gunung Ciremai 2D1N Via Palutungan | Wildera',
          seoDescription:
            'Daftar open trip Gunung Ciremai 2D1N resmi bersama Wildera Adventure. Pemandu berlisensi, simaksi, makan, dan dokumentasi.',
        },
        update: {
          status: ContentStatus.PUBLISHED,
          featured: true,
        },
      });

      // Itineraries for Ciremai
      const ciremaiItineraries = [
        {
          dayNumber: 1,
          title: 'Perjalanan & Camp Pos Cigowang / Pos Ketinggian',
          description:
            'Pemberangkatan dari Meeting Point Cawang UKI pukul 20.00 WIB menuju Kuningan. Tiba di Basecamp Palutungan subuh, istirahat, sarapan, briefing medis, dan memulai pendakian santai menuju camp area.',
          sortOrder: 1,
        },
        {
          dayNumber: 2,
          title: 'Summit Attack Atap Jawa Barat & Kembali ke Jakarta',
          description:
            'Pukul 02.30 WIB summit attack menuju Puncak Kawah Ciremai 3.078 mdpl. Menikmati sunrise spektakuler dan lanskap Jawa Barat, turun kembali ke basecamp untuk sop buah dan makan bersama, lalu kembali ke Jakarta.',
          sortOrder: 2,
        },
      ];

      for (const it of ciremaiItineraries) {
        await database.tripItinerary.upsert({
          where: {
            tripId_dayNumber: {
              tripId: ciremaiTrip.id,
              dayNumber: it.dayNumber,
            },
          },
          create: { ...it, tripId: ciremaiTrip.id },
          update: { title: it.title, description: it.description },
        });
      }

      // Facilities for Ciremai
      const ciremaiFacilities = [
        {
          facilityType: FacilityType.INCLUDE,
          name: 'Simaksi & Asuransi TNGC',
          description:
            'Izin masuk dan asuransi resmi Taman Nasional Gunung Ciremai.',
        },
        {
          facilityType: FacilityType.INCLUDE,
          name: 'Transportasi PP AC',
          description:
            'Elf / HiAce pariwisata dari Meeting Point Jakarta ke Basecamp PP + Tol.',
        },
        {
          facilityType: FacilityType.INCLUDE,
          name: 'Makan 1x & Sop Buah Segar',
          description:
            'Konsumsi prasmanan bernutrisi setelah turun pendakian di basecamp.',
        },
        {
          facilityType: FacilityType.INCLUDE,
          name: 'Experienced Crew & Dokumentasi',
          description:
            'Pemandu berlisensi, dokumentasi foto trip, dan koordinasi lapangan.',
        },
        {
          facilityType: FacilityType.INCLUDE,
          name: 'Standard First Aid & Oksigen',
          description:
            'P3K darurat dan tabung oksigen portabel selama di jalur.',
        },
        {
          facilityType: FacilityType.EXCLUDE,
          name: 'Perlengkapan Pribadi',
          description: 'Sepatu trekking, jaket hangat, tas, dan pakaian ganti.',
        },
        {
          facilityType: FacilityType.EXCLUDE,
          name: 'Obat Pribadi Khusus',
          description: 'Obat resep dokter di luar P3K standar yang disediakan.',
        },
      ];

      for (let i = 0; i < ciremaiFacilities.length; i++) {
        const fac = ciremaiFacilities[i]!;
        const existing = await database.tripFacility.findFirst({
          where: { tripId: ciremaiTrip.id, name: fac.name },
        });
        if (!existing) {
          await database.tripFacility.create({
            data: {
              tripId: ciremaiTrip.id,
              facilityType: fac.facilityType,
              name: fac.name,
              description: fac.description,
              sortOrder: i + 1,
            },
          });
        }
      }

      // Gears for Ciremai
      const ciremaiGears = [
        {
          gearType: GearType.MANDATORY,
          name: 'Sepatu Trekking Ber-grip',
          description: 'Wajib ber-grip baik untuk medan tanah dan bebatuan.',
        },
        {
          gearType: GearType.MANDATORY,
          name: 'Jaket Windproof / Warm Jacket',
          description: 'Menahan suhu malam dan dini hari hingga 5–10 derajat.',
        },
        {
          gearType: GearType.MANDATORY,
          name: 'Headlamp & Baterai Cadangan',
          description: 'Wajib untuk aktivitas summit attack subuh.',
        },
        {
          gearType: GearType.MANDATORY,
          name: 'Surat Keterangan Sehat',
          description: 'Wajib dari dokter/klinik sesuai regulasi TNGC.',
        },
        {
          gearType: GearType.RECOMMENDED,
          name: 'Trekking Pole / Tongkat Pendaki',
          description:
            'Sangat direkomendasikan untuk stabilitas lutut saat menanjak dan turun.',
        },
      ];

      for (const g of ciremaiGears) {
        const existing = await database.tripGear.findFirst({
          where: { tripId: ciremaiTrip.id, name: g.name },
        });
        if (!existing) {
          await database.tripGear.create({
            data: {
              tripId: ciremaiTrip.id,
              gearType: g.gearType,
              name: g.name,
              description: g.description,
            },
          });
        }
      }

      // 10. Official Real Photography & Media Assets
      const ciremaiMediaAssets = [
        {
          objectKey: 'wildera/ciremai-summit-ridge.jpg',
          url: '/images/wildera/IMG_5448.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: BigInt(1250000),
          widthPx: 1920,
          heightPx: 1080,
          altText:
            'Puncak Gunung Ciremai 3078 mdpl ekspedisi Wildera Adventure',
        },
        {
          objectKey: 'wildera/ciremai-pos-pendakian.jpg',
          url: '/images/wildera/IMG_5447.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: BigInt(1150000),
          widthPx: 1920,
          heightPx: 1080,
          altText: 'Jalur pendakian Palutungan Ciremai Wildera Adventure',
        },
        {
          objectKey: 'wildera/ciremai-team-camp.jpg',
          url: '/images/wildera/IMG_5435.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: BigInt(1100000),
          widthPx: 1920,
          heightPx: 1080,
          altText: 'Tim dan peserta pendakian Wildera Adventure di camp',
        },
      ];

      const mediaAssetMap = new Map<string, string>();
      for (const asset of ciremaiMediaAssets) {
        const media = await database.mediaAsset.upsert({
          where: { objectKey: asset.objectKey },
          create: {
            ...asset,
            createdBy: admin.id,
          },
          update: {
            url: asset.url,
            altText: asset.altText,
          },
        });
        mediaAssetMap.set(asset.objectKey, media.id);
      }

      // Connect Mountain Media
      const heroMediaId = mediaAssetMap.get('wildera/ciremai-summit-ridge.jpg');
      if (heroMediaId) {
        const existingMountainMedia = await database.mountainMedia.findFirst({
          where: { mountainId: ciremaiId, mediaId: heroMediaId },
        });
        if (!existingMountainMedia) {
          await database.mountainMedia.create({
            data: {
              mountainId: ciremaiId,
              mediaId: heroMediaId,
              mediaRole: MediaRole.COVER,
              sortOrder: 1,
            },
          });
        }

        const existingTripMedia = await database.tripMedia.findFirst({
          where: { tripId: ciremaiTrip.id, mediaId: heroMediaId },
        });
        if (!existingTripMedia) {
          await database.tripMedia.create({
            data: {
              tripId: ciremaiTrip.id,
              mediaId: heroMediaId,
              mediaRole: MediaRole.COVER,
              sortOrder: 1,
            },
          });
        }
      }

      // 11. Official Real Schedules & Pricing Packages
      const existingSchedule = await database.tripSchedule.findFirst({
        where: {
          tripId: ciremaiTrip.id,
          startDate: new Date('2026-10-10T00:00:00.000Z'),
        },
      });

      let ciremaiScheduleId = existingSchedule?.id;
      if (!ciremaiScheduleId) {
        const createdSchedule = await database.tripSchedule.create({
          data: {
            tripId: ciremaiTrip.id,
            startDate: new Date('2026-10-10T00:00:00.000Z'),
            endDate: new Date('2026-10-11T00:00:00.000Z'),
            registrationDeadline: new Date('2026-10-07T17:00:00.000Z'),
            capacity: 18,
            minimumParticipants: 10,
            status: ScheduleStatus.OPEN,
            notes: 'Jadwal Open Trip Resmi weekend puncak Gunung Ciremai.',
            createdBy: admin.id,
          },
        });
        ciremaiScheduleId = createdSchedule.id;

        const cawangMeetingPointId = meetingPointMap.get(
          'Halte UKI / Cawang Jakarta',
        );
        const palutunganMeetingPointId = meetingPointMap.get(
          'Basecamp Palutungan Kuningan',
        );

        await database.schedulePackage.createMany({
          data: [
            {
              scheduleId: ciremaiScheduleId,
              meetingPointId: cawangMeetingPointId,
              name: 'Paket All-In Meeting Point Jakarta',
              description:
                'Transportasi Elf AC PP Jakarta-Kuningan via Tol, Simaksi & Asuransi TNGC, Makan 1x Prasmanan, Sop Buah Segar, Tenda Dome Kelompok, Crew & P3K Standar.',
              price: 650000,
              sortOrder: 1,
              status: EntityStatus.ACTIVE,
            },
            {
              scheduleId: ciremaiScheduleId,
              meetingPointId: palutunganMeetingPointId,
              name: 'Paket Basecamp Palutungan Kuningan',
              description:
                'Tiket Simaksi & Asuransi TNGC, Tenda Dome Kelompok, Makan 1x Prasmanan, Sop Buah Segar, Crew Pemandu Berlisensi & P3K Standar (tanpa transportasi antar-kota).',
              price: 375000,
              sortOrder: 2,
              status: EntityStatus.ACTIVE,
            },
          ],
        });
      }

      // 12. Official Real FAQs
      const productionFaqs = [
        {
          category: 'Tentang Wildera',
          question: 'Apa itu Wildera Adventure?',
          answer:
            'Wildera Adventure adalah operator ekspedisi dan perjalanan alam terbuka yang menghadirkan pengalaman pendakian gunung di Indonesia dengan standar kenyamanan, keamanan medis tinggi, dan berkesan.',
          sortOrder: 1,
        },
        {
          category: 'Persiapan & Fisik',
          question: 'Apakah trip Wildera Adventure bisa diikuti oleh pemula?',
          answer:
            'Bisa. Kami memiliki pilihan trip berkategori Santai (Easy) seperti Gunung Prau dan Papandayan, serta pendampingan crew berlisensi yang siap memandu ritme pendakian.',
          sortOrder: 2,
        },
        {
          category: 'Fasilitas & Layanan',
          question: 'Apa saja fasilitas yang termasuk dalam paket open trip?',
          answer:
            'Fasilitas meliputi tiket Simaksi & asuransi resmi, transportasi PP dari meeting point tertentu (termasuk tol), makan 1x setelah pendakian, sop buah segar, tenda kelompok, crew pendamping, dokumentasi foto, dan P3K darurat.',
          sortOrder: 3,
        },
        {
          category: 'Pemesanan & Jadwal',
          question: 'Bagaimana alur pendaftaran dan booking trip?',
          answer:
            'Pilih destinasi dan jadwal di katalog website, klik Hubungi WhatsApp untuk konfirmasi kuota kursi ke customer service kami, lalu lengkapi data peserta dan pembayaran invoice resmi.',
          sortOrder: 4,
        },
        {
          category: 'Keselamatan & Medis',
          question: 'Apakah peserta wajib membawa surat keterangan sehat?',
          answer:
            'Ya, untuk destinasi dengan regulasi ketat seperti Taman Nasional Gunung Ciremai dan Semeru, surat keterangan sehat dokter wajib dibawa demi keselamatan peserta.',
          sortOrder: 5,
        },
        {
          category: 'Cuaca & Force Majeure',
          question:
            'Bagaimana kebijakan jika jalur pendakian ditutup resmi pengelola?',
          answer:
            'Jika terjadi penutupan jalur akibat erupsi, kebakaran hutan, atau cuaca ekstrem (force majeure), peserta dapat melakukan penjadwalan ulang (reschedule) tanpa potongan sesuai SOP pembatalan resmi kami.',
          sortOrder: 6,
        },
      ];

      for (const item of productionFaqs) {
        const existingFaq = await database.faq.findFirst({
          where: { question: item.question },
        });

        if (existingFaq) {
          await database.faq.update({
            where: { id: existingFaq.id },
            data: {
              category: item.category,
              answer: item.answer,
              sortOrder: item.sortOrder,
              status: ContentStatus.PUBLISHED,
            },
          });
        } else {
          await database.faq.create({
            data: {
              category: item.category,
              question: item.question,
              answer: item.answer,
              sortOrder: item.sortOrder,
              status: ContentStatus.PUBLISHED,
            },
          });
        }
      }
    });

    console.log(
      'Production database seeded successfully with authentic Wildera Adventure business content.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

seedProduction().catch((error) => {
  console.error('Failed to seed production database:', error);
  process.exit(1);
});
