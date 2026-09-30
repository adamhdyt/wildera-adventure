/**
 * Fills the development database with placeholder mountain copy and Pexels
 * stock photos so the public site does not look empty while real Wildera
 * photography is still being collected. Idempotent, and it never overwrites a
 * mountain that already has a description or a cover photo.
 *
 * Usage: node scripts/seed-stock-content.mts
 * Photo credits: see apps/web/public/images/pexels/CREDITS.md (Pexels License).
 */
import { existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'));
if (process.env.NODE_ENV === 'production') {
  throw new Error('Stock content is for development only.');
}
const source = process.env.DATABASE_URL;
if (!source) throw new Error('DATABASE_URL is required.');
const url = new URL(source);
url.search = '';

interface Photo {
  id: string;
  alt: string;
  credit: string;
}
interface MountainContent {
  slug: string;
  shortDescription: string;
  description: string;
  bestSeason: string;
  seoTitle: string;
  seoDescription: string;
  photos: Photo[]; // first one is the cover
}

const content: MountainContent[] = [
  {
    slug: 'gunung-merbabu',
    shortDescription:
      'Gunung savana di Jawa Tengah dengan padang rumput luas dan panorama Merapi, Sindoro, dan Sumbing.',
    description:
      'Gunung Merbabu (3.142 mdpl) berada di perbatasan Boyolali, Magelang, dan Semarang. Jalurnya terkenal landai dengan hamparan savana di sepanjang punggungan, sehingga cocok untuk pendaki yang ingin pemandangan terbuka tanpa medan ekstrem. Dari puncak, Merapi, Merbabu, Sindoro, dan Sumbing tampak berjajar saat cuaca cerah. Jalur populer meliputi Selo, Suwanting, Wekas, dan Thekelan.',
    bestSeason: 'Mei – Oktober (musim kemarau)',
    seoTitle: 'Pendakian Gunung Merbabu 3.142 mdpl | Wildera Adventure',
    seoDescription:
      'Open trip Gunung Merbabu bersama Wildera Adventure: savana luas, panorama Merapi, pemandu berpengalaman, dan standar keselamatan ketat.',
    photos: [
      {
        id: '36665312',
        alt: 'Lereng hijau Gunung Merbabu diselimuti awan dan permukiman di kaki gunung',
        credit: 'egisj',
      },
      {
        id: '38905713',
        alt: 'Matahari terbenam dari punggungan Merbabu dengan siluet pepohonan',
        credit: 'bakekokman',
      },
      {
        id: '38905708',
        alt: 'Pendaki menatap lanskap pegunungan dari Merbabu saat fajar',
        credit: 'bakekokman',
      },
    ],
  },
  {
    slug: 'gunung-papandayan',
    shortDescription:
      'Gunung ramah pemula di Garut dengan kawah aktif, hutan mati, dan padang edelweiss Tegal Alun.',
    description:
      'Gunung Papandayan (2.665 mdpl) di Garut, Jawa Barat, menawarkan kawah belerang aktif, fumarol, hutan mati, dan padang edelweiss di Tegal Alun. Jalur dari Camp David relatif singkat dengan tanjakan bertahap, sehingga sering dipilih untuk pendakian pertama atau perjalanan santai akhir pekan. Hindari area sekitar kawah saat aktivitas gas meningkat dan ikuti arahan pemandu.',
    bestSeason: 'Mei – Oktober (musim kemarau)',
    seoTitle: 'Pendakian Gunung Papandayan 2.665 mdpl | Wildera Adventure',
    seoDescription:
      'Open trip Gunung Papandayan untuk pemula: kawah aktif, hutan mati, dan Tegal Alun bersama pemandu Wildera Adventure.',
    photos: [
      {
        id: '35875324',
        alt: 'Kawah belerang Gunung Papandayan dengan jalur setapak para pendaki',
        credit: 'Noursakina',
      },
      {
        id: '35875316',
        alt: 'Rombongan pendaki menaiki jalur berbatu Gunung Papandayan yang berkabut',
        credit: 'Noursakina',
      },
      {
        id: '36050446',
        alt: 'Pendaki berpose di area kawah Papandayan yang berbatu kekuningan',
        credit: 'Irma Sjachlan',
      },
    ],
  },
  {
    slug: 'gunung-semeru',
    shortDescription:
      'Puncak tertinggi Pulau Jawa (Mahameru) dengan jalur Ranu Pani, Ranu Kumbolo, dan Kalimati.',
    description:
      'Gunung Semeru (3.676 mdpl) adalah puncak tertinggi di Pulau Jawa, berada di kawasan Taman Nasional Bromo Tengger Semeru, Jawa Timur. Pendakian umumnya dimulai dari Ranu Pani melewati Ranu Kumbolo dan Kalimati sebelum menuju Mahameru. Semeru adalah gunung api aktif: akses, batas pendakian, dan kuota mengikuti ketentuan TNBTS serta status aktivitas dari PVMBG, sehingga jadwal dapat berubah sewaktu-waktu.',
    bestSeason: 'April – Oktober (ikuti ketentuan buka-tutup TNBTS)',
    seoTitle: 'Pendakian Gunung Semeru 3.676 mdpl | Wildera Adventure',
    seoDescription:
      'Ekspedisi Gunung Semeru bersama Wildera Adventure: jalur Ranu Pani–Ranu Kumbolo–Kalimati dengan pengurusan izin dan pemandu berpengalaman.',
    photos: [
      {
        id: '38730351',
        alt: 'Gunung Semeru menjulang di atas hutan hijau dan air terjun di Jawa Timur',
        credit: 'felix-fang',
      },
      {
        id: '35232865',
        alt: 'Gunung Semeru mengeluarkan asap tipis di bawah langit biru',
        credit: 'wictor-sparrow',
      },
    ],
  },
  {
    slug: 'gunung-prau',
    shortDescription:
      'Gunung favorit sunrise di Dieng, Wonosobo, dengan bukit-bukit hijau dan panorama Sindoro–Sumbing.',
    description:
      'Gunung Prau (2.590 mdpl) di dataran tinggi Dieng, Wonosobo, terkenal dengan matahari terbit keemasan dan hamparan bukit hijau di puncaknya. Jalur Patak Banteng hanya membutuhkan sekitar 2–3 jam pendakian sehingga cocok untuk pendaki pemula yang fit. Malam hari bisa sangat dingin, bahkan mendekati titik beku saat musim kemarau, jadi siapkan pakaian hangat.',
    bestSeason: 'Mei – September (musim kemarau)',
    seoTitle: 'Pendakian Gunung Prau 2.590 mdpl | Wildera Adventure',
    seoDescription:
      'Open trip Gunung Prau via Patak Banteng: golden sunrise Dieng, pemandu berpengalaman, dan perlengkapan camp dari Wildera Adventure.',
    photos: [
      {
        id: '5019717',
        alt: 'Matahari terbit di atas punggungan Gunung Prau dengan Sindoro dan Sumbing di kejauhan',
        credit: 'Ifans Hek',
      },
      {
        id: '33236327',
        alt: 'Pendaki berdiri di tebing dengan lereng hijau Gunung Prau di bawahnya',
        credit: 'ericjo',
      },
      {
        id: '2870346',
        alt: 'Dua pendaki menikmati lautan awan dan gunung di pagi hari',
        credit: 'Muhammad Syahroyni',
      },
    ],
  },
];

const tripCovers: Record<string, string> = { 'open-trip-prau': '5019717' };

const db = new pg.Client({ connectionString: url.toString() });
await db.connect();
try {
  await db.query('BEGIN');
  const adminRow = await db.query(
    `SELECT id FROM admin_users ORDER BY created_at LIMIT 1`,
  );
  const adminId = adminRow.rows[0]?.id as string | undefined;
  if (!adminId) throw new Error('Tidak ada admin_users; jalankan seed dulu.');

  const assetId = new Map<string, string>();
  async function ensureAsset(photo: Photo): Promise<string> {
    const cached = assetId.get(photo.id);
    if (cached) return cached;
    const file = join(root, 'apps/web/public/images/pexels', `${photo.id}.jpg`);
    if (!existsSync(file)) throw new Error(`Berkas hilang: ${file}`);
    const objectKey = `pexels/${photo.id}.jpg`;
    const found = await db.query(
      `SELECT id FROM media_assets WHERE object_key = $1`,
      [objectKey],
    );
    let id = found.rows[0]?.id as string | undefined;
    if (!id) {
      const inserted = await db.query(
        `INSERT INTO media_assets(object_key, url, mime_type, file_size_bytes, alt_text, created_by)
         VALUES ($1,$2,'image/jpeg',$3,$4,$5) RETURNING id`,
        [
          objectKey,
          `/images/pexels/${photo.id}.jpg`,
          statSync(file).size,
          `${photo.alt} (foto: ${photo.credit} / Pexels)`.slice(0, 255),
          adminId,
        ],
      );
      id = inserted.rows[0].id as string;
    }
    assetId.set(photo.id, id!);
    return id!;
  }

  for (const m of content) {
    const row = await db.query(
      `SELECT id, description FROM mountains WHERE slug = $1 AND deleted_at IS NULL`,
      [m.slug],
    );
    const mountain = row.rows[0];
    if (!mountain) {
      console.log(`skip ${m.slug}: tidak ada di database`);
      continue;
    }
    if (!mountain.description) {
      await db.query(
        `UPDATE mountains SET short_description=$2, description=$3, best_season=$4,
           seo_title=COALESCE(seo_title,$5), seo_description=COALESCE(seo_description,$6)
         WHERE id=$1`,
        [
          mountain.id,
          m.shortDescription,
          m.description,
          m.bestSeason,
          m.seoTitle,
          m.seoDescription,
        ],
      );
      console.log(`teks ${m.slug}`);
    }
    const hasMedia = await db.query(
      `SELECT 1 FROM mountain_media WHERE mountain_id = $1 LIMIT 1`,
      [mountain.id],
    );
    if (hasMedia.rowCount) {
      console.log(`foto ${m.slug}: sudah ada, dilewati`);
      continue;
    }
    for (const [i, photo] of m.photos.entries()) {
      await db.query(
        `INSERT INTO mountain_media(mountain_id, media_id, media_role, sort_order)
         VALUES ($1,$2,$3,$4)`,
        [
          mountain.id,
          await ensureAsset(photo),
          i === 0 ? 'COVER' : 'GALLERY',
          i === 0 ? 0 : i,
        ],
      );
    }
    console.log(`foto ${m.slug}: ${m.photos.length}`);
  }

  for (const [slug, photoId] of Object.entries(tripCovers)) {
    const trip = await db.query(`SELECT id FROM trips WHERE slug = $1`, [slug]);
    if (!trip.rows[0]) continue;
    const has = await db.query(
      `SELECT 1 FROM trip_media WHERE trip_id = $1 LIMIT 1`,
      [trip.rows[0].id],
    );
    if (has.rowCount) continue;
    const photo = content
      .flatMap((c) => c.photos)
      .find((p) => p.id === photoId)!;
    await db.query(
      `INSERT INTO trip_media(trip_id, media_id, media_role, sort_order) VALUES ($1,$2,'COVER',0)`,
      [trip.rows[0].id, await ensureAsset(photo)],
    );
    console.log(`foto trip ${slug}`);
  }
  await db.query('COMMIT');
} catch (error) {
  await db.query('ROLLBACK');
  throw error;
} finally {
  await db.end();
}
