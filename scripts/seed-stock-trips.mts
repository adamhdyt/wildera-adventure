/**
 * Adds sample open trips, routes, schedules and packages for the stock
 * mountains so the public catalog is not empty during development.
 * Idempotent (skips trips that already exist) and development only.
 * Run scripts/seed-stock-content.mts first so mountains have cover photos.
 *
 * Usage: node scripts/seed-stock-trips.mts
 * Prices, dates and quotas are sample values, not real offers.
 */
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'));
if (process.env.NODE_ENV === 'production') {
  throw new Error('Sample trips are for development only.');
}
const source = process.env.DATABASE_URL;
if (!source) throw new Error('DATABASE_URL is required.');
const url = new URL(source);
url.search = '';

interface Sample {
  mountainSlug: string;
  route: { name: string; slug: string; startingPoint: string; hours: number };
  trip: {
    name: string;
    slug: string;
    type: 'OPEN_TRIP';
    days: number;
    nights: number;
    difficulty: 'EASY' | 'MODERATE' | 'HARD';
    beginner: boolean;
    minAge: number;
    maxAge: number;
    short: string;
    description: string;
    featured: boolean;
  };
  meetingPoint: { name: string; city: string; address: string };
  prices: { basecamp: number; meeting: number };
  capacity: number;
  minimum: number;
  offsets: number[]; // days from today for each departure
  itinerary: [string, string][];
  extraInclude: string[];
  exclude: string[];
  gear: ['MANDATORY' | 'RECOMMENDED', string][];
  faqs: [string, string][];
  notes: string;
}

const commonInclude = [
  'Simaksi & asuransi pendakian',
  'Pemandu berlisensi & crew pendamping',
  'Tenda dome kelompok & matras',
  'Makan sesuai itinerary & air minum camp',
  'P3K standar & dokumentasi tim',
];
const commonExclude = [
  'Perlengkapan pribadi',
  'Porter pribadi & tips',
  'Pengeluaran di luar itinerary',
];

const samples: Sample[] = [
  {
    mountainSlug: 'gunung-merbabu',
    route: {
      name: 'Merbabu via Selo',
      slug: 'merbabu-selo',
      startingPoint: 'Basecamp Selo, Boyolali',
      hours: 7,
    },
    trip: {
      name: 'Open Trip Gunung Merbabu 2D1N via Selo',
      slug: 'open-trip-merbabu-selo',
      type: 'OPEN_TRIP',
      days: 2,
      nights: 1,
      difficulty: 'MODERATE',
      beginner: true,
      minAge: 15,
      maxAge: 55,
      short:
        'Pendakian 2D1N menyusuri savana Merbabu via Selo dengan panorama Merapi dan sunrise dari puncak.',
      description:
        'Jalur Selo membawa peserta melewati hutan, punggungan, dan savana luas menuju puncak Merbabu (3.142 mdpl). Program 2D1N ini mencakup simaksi, pemandu berlisensi, camp nyaman, dan makan sesuai itinerary. Cocok untuk pendaki yang sudah terbiasa berjalan 6–8 jam dengan kondisi fisik prima.',
      featured: true,
    },
    meetingPoint: {
      name: 'Basecamp Selo Boyolali',
      city: 'Boyolali',
      address: 'Basecamp pendakian Selo, Kecamatan Selo, Boyolali',
    },
    prices: { basecamp: 350000, meeting: 575000 },
    capacity: 20,
    minimum: 8,
    offsets: [21, 42],
    itinerary: [
      [
        'Basecamp Selo menuju area camp',
        'Briefing keselamatan, registrasi, lalu mendaki melewati hutan dan savana menuju area camp. Makan malam dan istirahat.',
      ],
      [
        'Summit attack & turun',
        'Dini hari menuju puncak untuk sunrise, sarapan di camp, packing, lalu turun kembali ke basecamp.',
      ],
    ],
    extraInclude: [],
    exclude: [],
    gear: [
      ['MANDATORY', 'Sepatu trekking ber-grip'],
      ['MANDATORY', 'Jaket hangat & windproof'],
      ['MANDATORY', 'Headlamp & baterai cadangan'],
      ['MANDATORY', 'Jas hujan / ponco'],
      ['RECOMMENDED', 'Trekking pole'],
      ['RECOMMENDED', 'Buff & sarung tangan'],
    ],
    faqs: [
      [
        'Apakah Merbabu cocok untuk pemula?',
        'Cocok untuk pemula dengan kondisi fisik baik. Jalurnya panjang, jadi disarankan berlatih jalan kaki atau jogging beberapa minggu sebelumnya.',
      ],
      [
        'Bagaimana jika hujan?',
        'Jadwal mengikuti keputusan pemandu berdasarkan cuaca dan keselamatan. Peserta disarankan membawa jas hujan.',
      ],
    ],
    notes: 'Jadwal contoh untuk pengembangan website.',
  },
  {
    mountainSlug: 'gunung-papandayan',
    route: {
      name: 'Papandayan via Camp David',
      slug: 'papandayan-camp-david',
      startingPoint: 'Camp David, Cisurupan, Garut',
      hours: 4,
    },
    trip: {
      name: 'Open Trip Gunung Papandayan Tektok via Camp David',
      slug: 'open-trip-papandayan-tektok',
      type: 'OPEN_TRIP',
      days: 1,
      nights: 0,
      difficulty: 'EASY',
      beginner: true,
      minAge: 10,
      maxAge: 60,
      short:
        'Tektok 1 hari ke kawah aktif, hutan mati, dan Tegal Alun. Ramah pemula dan keluarga.',
      description:
        'Papandayan (2.665 mdpl) cocok untuk pendakian pertama. Peserta menyusuri kawah belerang, hutan mati, dan padang edelweiss Tegal Alun dalam satu hari, didampingi pemandu berlisensi. Area kawah mengeluarkan gas; ikuti arahan pemandu dan gunakan masker.',
      featured: false,
    },
    meetingPoint: {
      name: 'Camp David Papandayan Garut',
      city: 'Garut',
      address: 'Camp David, Desa Sirnajaya, Cisurupan, Garut',
    },
    prices: { basecamp: 250000, meeting: 425000 },
    capacity: 25,
    minimum: 6,
    offsets: [14, 35],
    itinerary: [
      [
        'Camp David – kawah – Tegal Alun',
        'Pemanasan dan briefing, menyusuri kawah dan hutan mati menuju Tegal Alun, makan siang, lalu turun kembali ke Camp David.',
      ],
    ],
    extraInclude: [],
    exclude: [],
    gear: [
      ['MANDATORY', 'Sepatu trekking / sepatu tertutup ber-grip'],
      ['MANDATORY', 'Masker & buff (gas belerang)'],
      ['MANDATORY', 'Jaket tipis windproof'],
      ['RECOMMENDED', 'Topi & kacamata hitam'],
      ['RECOMMENDED', 'Tabir surya'],
    ],
    faqs: [
      [
        'Apakah aman untuk anak-anak?',
        'Usia minimal 10 tahun dengan pendampingan orang tua. Area kawah mengeluarkan gas sehingga anak harus selalu berada dalam pengawasan.',
      ],
    ],
    notes: 'Jadwal contoh untuk pengembangan website.',
  },
  {
    mountainSlug: 'gunung-semeru',
    route: {
      name: 'Semeru via Ranu Pani',
      slug: 'semeru-ranu-pani',
      startingPoint: 'Ranu Pani, Lumajang',
      hours: 14,
    },
    trip: {
      name: 'Ekspedisi Gunung Semeru 3D2N via Ranu Pani',
      slug: 'open-trip-semeru-ranu-pani',
      type: 'OPEN_TRIP',
      days: 3,
      nights: 2,
      difficulty: 'HARD',
      beginner: false,
      minAge: 17,
      maxAge: 50,
      short:
        'Ekspedisi 3D2N ke Mahameru (3.676 mdpl) via Ranu Kumbolo dan Kalimati dengan pemandu berpengalaman.',
      description:
        'Pendakian ke puncak tertinggi Pulau Jawa melewati Ranu Pani, Ranu Kumbolo, dan Kalimati. Akses, kuota, dan batas pendakian mengikuti ketentuan TNBTS serta status aktivitas dari PVMBG sehingga jadwal dapat berubah atau dibatalkan demi keselamatan. Surat sehat dan kondisi fisik prima wajib.',
      featured: true,
    },
    meetingPoint: {
      name: 'Basecamp Ranu Pani Lumajang',
      city: 'Lumajang',
      address: 'Desa Ranu Pani, Senduro, Lumajang',
    },
    prices: { basecamp: 1150000, meeting: 1650000 },
    capacity: 15,
    minimum: 8,
    offsets: [28, 56],
    itinerary: [
      [
        'Ranu Pani menuju Ranu Kumbolo',
        'Registrasi dan briefing, trekking melewati Landengan Dowo dan Watu Rejeng hingga Ranu Kumbolo. Camp dan makan malam.',
      ],
      [
        'Kalimati & persiapan summit',
        'Melewati Tanjakan Cinta dan Oro-oro Ombo menuju Kalimati. Istirahat dan persiapan summit attack tengah malam.',
      ],
      [
        'Summit Mahameru & turun',
        'Menuju puncak Mahameru sesuai kondisi aktivitas, lalu turun ke Kalimati dan kembali ke Ranu Pani.',
      ],
    ],
    extraInclude: ['Pengurusan izin TNBTS'],
    exclude: [],
    gear: [
      ['MANDATORY', 'Sepatu gunung ber-grip'],
      ['MANDATORY', 'Jaket down / hangat & windproof'],
      ['MANDATORY', 'Headlamp & baterai cadangan'],
      ['MANDATORY', 'Masker / buff & kacamata pelindung debu'],
      ['RECOMMENDED', 'Trekking pole'],
      ['RECOMMENDED', 'Gaiter'],
    ],
    faqs: [
      [
        'Apakah jadwal bisa berubah?',
        'Ya. Semeru adalah gunung api aktif dan pendakian mengikuti ketentuan TNBTS serta status dari PVMBG. Jika pendakian ditutup, peserta akan diberi opsi jadwal ulang sesuai kebijakan pembatalan.',
      ],
      [
        'Apakah wajib surat sehat?',
        'Wajib. Bawa surat keterangan sehat yang masih berlaku saat registrasi.',
      ],
    ],
    notes:
      'Jadwal contoh untuk pengembangan website; kuota mengikuti ketentuan TNBTS.',
  },
  {
    mountainSlug: 'gunung-prau',
    route: {
      name: 'Prau via Patak Banteng',
      slug: 'patak-banteng',
      startingPoint: 'Basecamp Patak Banteng, Wonosobo',
      hours: 3,
    },
    trip: {
      name: 'Open Trip Gunung Prau 2D1N via Patak Banteng',
      slug: 'open-trip-prau-patak-banteng',
      type: 'OPEN_TRIP',
      days: 2,
      nights: 1,
      difficulty: 'MODERATE',
      beginner: true,
      minAge: 12,
      maxAge: 55,
      short:
        'Camp di bukit Prau, sunrise keemasan Dieng, dan panorama Sindoro–Sumbing dalam 2 hari 1 malam.',
      description:
        'Jalur Patak Banteng relatif singkat (sekitar 2–3 jam) sehingga pas untuk pendaki pemula yang fit. Nikmati sunset, camp di hamparan bukit, lalu sunrise Dieng keesokan paginya. Malam bisa sangat dingin, jadi bawa pakaian hangat.',
      featured: false,
    },
    meetingPoint: {
      name: 'Basecamp Patak Banteng Dieng',
      city: 'Wonosobo',
      address: 'Jl. Dieng Km 24, Patakbanteng, Kejajar, Wonosobo',
    },
    prices: { basecamp: 300000, meeting: 475000 },
    capacity: 25,
    minimum: 8,
    offsets: [10, 24, 45],
    itinerary: [
      [
        'Patak Banteng menuju camp Prau',
        'Briefing, mendaki sekitar 2–3 jam menuju area camp, mendirikan tenda, sunset dan makan malam.',
      ],
      [
        'Sunrise & turun',
        'Menikmati sunrise Dieng, sarapan, bersantai di bukit, lalu turun ke basecamp.',
      ],
    ],
    extraInclude: [],
    exclude: [],
    gear: [
      ['MANDATORY', 'Jaket tebal & penutup kepala (suhu sangat dingin)'],
      ['MANDATORY', 'Sepatu trekking ber-grip'],
      ['MANDATORY', 'Headlamp & baterai cadangan'],
      ['RECOMMENDED', 'Sarung tangan & kaus kaki tebal'],
      ['RECOMMENDED', 'Sleeping bag pribadi'],
    ],
    faqs: [
      [
        'Seberapa dingin di puncak Prau?',
        'Saat musim kemarau suhu malam bisa mendekati titik beku. Bawa jaket tebal, sarung tangan, dan kaus kaki hangat.',
      ],
    ],
    notes: 'Jadwal contoh untuk pengembangan website.',
  },
];

const db = new pg.Client({ connectionString: url.toString() });
await db.connect();
try {
  await db.query('BEGIN');
  const adminId = (
    await db.query(`SELECT id FROM admin_users ORDER BY created_at LIMIT 1`)
  ).rows[0]?.id as string | undefined;
  if (!adminId) throw new Error('Tidak ada admin_users; jalankan seed dulu.');

  for (const s of samples) {
    const exists = await db.query(`SELECT 1 FROM trips WHERE slug = $1`, [
      s.trip.slug,
    ]);
    if (exists.rowCount) {
      console.log(`skip ${s.trip.slug}: sudah ada`);
      continue;
    }
    const mountain = (
      await db.query(
        `SELECT id FROM mountains WHERE slug = $1 AND deleted_at IS NULL`,
        [s.mountainSlug],
      )
    ).rows[0];
    if (!mountain) {
      console.log(`skip ${s.trip.slug}: gunung tidak ada`);
      continue;
    }

    const route = (
      await db.query(
        `INSERT INTO routes(mountain_id,name,slug,difficulty,starting_point,estimated_duration_hours,status)
         VALUES ($1,$2,$3,$4,$5,$6,'PUBLISHED')
         ON CONFLICT (mountain_id, slug) DO UPDATE SET status='PUBLISHED', deleted_at=NULL,
           estimated_duration_hours=COALESCE(routes.estimated_duration_hours, EXCLUDED.estimated_duration_hours)
         RETURNING id`,
        [
          mountain.id,
          s.route.name,
          s.route.slug,
          s.trip.difficulty,
          s.route.startingPoint,
          s.route.hours,
        ],
      )
    ).rows[0];

    const trip = (
      await db.query(
        `INSERT INTO trips(mountain_id,route_id,name,slug,trip_type,short_description,description,
           duration_days,duration_nights,difficulty,beginner_friendly,health_certificate_required,
           minimum_age,maximum_age,status,featured,seo_title,seo_description,published_at,created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,$12,$13,'PUBLISHED',$14,$15,$16,now(),$17)
         RETURNING id`,
        [
          mountain.id,
          route.id,
          s.trip.name,
          s.trip.slug,
          s.trip.type,
          s.trip.short,
          s.trip.description,
          s.trip.days,
          s.trip.nights,
          s.trip.difficulty,
          s.trip.beginner,
          s.trip.minAge,
          s.trip.maxAge,
          s.trip.featured,
          `${s.trip.name} | Wildera`.slice(0, 160),
          s.trip.short.slice(0, 320),
          adminId,
        ],
      )
    ).rows[0];

    for (const [i, [title, description]] of s.itinerary.entries()) {
      await db.query(
        `INSERT INTO trip_itineraries(trip_id,day_number,title,description,sort_order) VALUES ($1,$2,$3,$4,$2)`,
        [trip.id, i + 1, title, description],
      );
    }
    let order = 0;
    for (const name of [...commonInclude, ...s.extraInclude]) {
      await db.query(
        `INSERT INTO trip_facilities(trip_id,facility_type,name,sort_order) VALUES ($1,'INCLUDE',$2,$3)`,
        [trip.id, name, order++],
      );
    }
    for (const name of [...commonExclude, ...s.exclude]) {
      await db.query(
        `INSERT INTO trip_facilities(trip_id,facility_type,name,sort_order) VALUES ($1,'EXCLUDE',$2,$3)`,
        [trip.id, name, order++],
      );
    }
    for (const [i, [type, name]] of s.gear.entries()) {
      await db.query(
        `INSERT INTO trip_gears(trip_id,gear_type,name,sort_order) VALUES ($1,$2,$3,$4)`,
        [trip.id, type, name, i],
      );
    }
    for (const [i, [question, answer]] of s.faqs.entries()) {
      await db.query(
        `INSERT INTO trip_faqs(trip_id,question,answer,sort_order,status) VALUES ($1,$2,$3,$4,'PUBLISHED')`,
        [trip.id, question, answer, i],
      );
    }

    // Reuse the mountain's photos for the trip.
    const media = await db.query(
      `SELECT media_id, media_role, sort_order FROM mountain_media WHERE mountain_id = $1`,
      [mountain.id],
    );
    for (const m of media.rows) {
      await db.query(
        `INSERT INTO trip_media(trip_id,media_id,media_role,sort_order) VALUES ($1,$2,$3,$4)`,
        [trip.id, m.media_id, m.media_role, m.sort_order],
      );
    }

    const meeting =
      (
        await db.query(
          `SELECT id FROM meeting_points WHERE name = $1 LIMIT 1`,
          [s.meetingPoint.name],
        )
      ).rows[0] ??
      (
        await db.query(
          `INSERT INTO meeting_points(name,city,address,status) VALUES ($1,$2,$3,'ACTIVE') RETURNING id`,
          [s.meetingPoint.name, s.meetingPoint.city, s.meetingPoint.address],
        )
      ).rows[0];

    for (const offset of s.offsets) {
      const schedule = (
        await db.query(
          `INSERT INTO trip_schedules(trip_id,start_date,end_date,registration_deadline,capacity,minimum_participants,status,notes,created_by)
           VALUES ($1, CURRENT_DATE + $2::int, CURRENT_DATE + $2::int + $3::int, (CURRENT_DATE + $2::int - 3)::timestamptz, $4, $5, 'OPEN', $6, $7)
           RETURNING id`,
          [
            trip.id,
            offset,
            s.trip.days - 1,
            s.capacity,
            s.minimum,
            s.notes,
            adminId,
          ],
        )
      ).rows[0];
      await db.query(
        `INSERT INTO schedule_packages(schedule_id,meeting_point_id,name,description,price,status,sort_order)
         VALUES ($1,$2,$3,$4,$5,'ACTIVE',0), ($1,NULL,$6,$7,$8,'ACTIVE',1)`,
        [
          schedule.id,
          meeting.id,
          `Paket Meeting Point ${s.meetingPoint.city}`,
          `Sudah termasuk fasilitas utama dan transportasi dari meeting point ${s.meetingPoint.name} (harga contoh).`,
          s.prices.meeting,
          `Paket Basecamp ${s.meetingPoint.city}`,
          'Peserta menuju basecamp sendiri; fasilitas pendakian sudah termasuk (harga contoh).',
          s.prices.basecamp,
        ],
      );
    }
    console.log(`trip ${s.trip.slug}: ${s.offsets.length} jadwal`);
  }
  await db.query('COMMIT');
} catch (error) {
  await db.query('ROLLBACK');
  throw error;
} finally {
  await db.end();
}
