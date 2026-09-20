import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { PublicMountainDetail, PublicTripSummary } from '@wildera/types';
import {
  fetchPublicMountainDetail,
  fetchPublicSiteSettings,
} from '../../../lib/public-api';
import {
  buildPrivateTripWhatsAppMessage,
  buildWhatsAppUrl,
} from '../../../lib/whatsapp';
import { Navbar } from '../../../components/public/navbar';
import { Footer } from '../../../components/public/footer';
import { TripCard } from '../../../components/trip/trip-card';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const DIFFICULTY_MAP: Record<
  string,
  { label: string; badgeClass: string; desc: string }
> = {
  EASY: {
    label: 'Santai (Easy)',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    desc: 'Medan relatif landai dengan waktu tempuh singkat. Cocok untuk pemula dan pendaki keluarga.',
  },
  MODERATE: {
    label: 'Sedang (Moderate)',
    badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    desc: 'Kombinasi jalur hutan dan tanjakan berkelanjutan. Memerlukan daya tahan kardio dan fisik prima.',
  },
  HARD: {
    label: 'Menantang (Hard)',
    badgeClass: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    desc: 'Medan teknis dengan elevasi ekstrem, kontur terjal berbatu atau berpasir, dan durasi pendakian panjang.',
  },
  EXTREME: {
    label: 'Ekstrem (Extreme)',
    badgeClass: 'bg-red-500/10 text-red-700 border-red-500/20',
    desc: 'Tantangan puncak tertinggi dengan paparan cuaca ekstrem, jurang terbuka, dan rute navigasi intensif.',
  },
};

const FALLBACK_MOUNTAIN_DETAILS: Record<string, PublicMountainDetail> = {
  rinjani: {
    id: 'mt-rinjani',
    name: 'Rinjani',
    slug: 'rinjani',
    altitudeM: 3726,
    defaultDifficulty: 'HARD',
    description:
      'Gunung Rinjani adalah gunung berapi kedua tertinggi di Indonesia yang terletak di Pulau Lombok. Terkenal secara global berkat keindahan Danau Segara Anak di kalderanya serta pemandangan matahari terbit spektakuler dari puncak Dewi Anjani.',
    bestSeason: 'April – November (Musim Kemarau)',
    destination: {
      id: 'dest-lombok',
      name: 'Lombok, Nusa Tenggara Barat',
      slug: 'lombok',
    },
    routes: [
      {
        id: 'r-sembalun',
        name: 'Jalur Sembalun',
        slug: 'sembalun',
        distanceKm: 16.5,
        elevationGainM: 2500,
        estimatedHours: 9,
      },
      {
        id: 'r-senaru',
        name: 'Jalur Senaru',
        slug: 'senaru',
        distanceKm: 14.2,
        elevationGainM: 2100,
        estimatedHours: 8,
      },
      {
        id: 'r-torean',
        name: 'Jalur Torean',
        slug: 'torean',
        distanceKm: 18.0,
        elevationGainM: 2200,
        estimatedHours: 10,
      },
    ],
    media: {
      cover: {
        url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=80',
        alt: 'Gunung Rinjani dan Danau Segara Anak',
      },
      gallery: [
        {
          url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
          alt: 'Kaldera Danau Segara Anak',
        },
        {
          url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
          alt: 'Sunrise Puncak Rinjani',
        },
      ],
    },
    upcomingTrips: [
      {
        id: 'trip-rinjani-summit',
        name: 'Open Trip Rinjani Summit & Segara Anak 4D3N',
        slug: 'open-trip-rinjani-summit-4d3n',
        tripType: 'OPEN_TRIP',
        difficulty: 'HARD',
        beginnerFriendly: false,
        duration: { days: 4, nights: 3 },
        mountain: { name: 'Rinjani', slug: 'rinjani', altitudeM: 3726 },
        coverImage: {
          url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
          alt: 'Open Trip Rinjani',
        },
        nextSchedule: {
          id: 'sched-rinjani-1',
          startDate: '2026-10-15',
          endDate: '2026-10-18',
          capacity: 15,
          confirmedSeats: 8,
          availableSeats: 7,
          availabilityStatus: 'AVAILABLE',
          startingPrice: 3250000,
        },
      },
    ],
    seo: {
      title: 'Gunung Rinjani 3.726 mdpl - Info Pendakian & Open Trip | Wildera',
      description:
        'Panduan lengkap pendakian Gunung Rinjani Lombok. Ketinggian 3.726 mdpl, jalur Sembalun/Senaru/Torean, dan paket open trip all-inclusive.',
    },
  },
  prau: {
    id: 'mt-prau',
    name: 'Prau',
    slug: 'prau',
    altitudeM: 2590,
    defaultDifficulty: 'EASY',
    description:
      'Gunung Prau di Dataran Tinggi Dieng menyajikan pemandangan bukit Teletubbies dan panorama jajaran gunung kembar Sindoro-Sumbing. Jalur pendakian yang relatif singkat menjadikannya destinasi favorit pendaki pemula.',
    bestSeason: 'Mei – Oktober',
    destination: {
      id: 'dest-dieng',
      name: 'Dieng, Jawa Tengah',
      slug: 'dieng',
    },
    routes: [
      {
        id: 'r-patak-banteng',
        name: 'Jalur Patak Banteng',
        slug: 'patak-banteng',
        distanceKm: 4.5,
        elevationGainM: 600,
        estimatedHours: 3.5,
      },
      {
        id: 'r-dieng-kulon',
        name: 'Jalur Dieng Kulon',
        slug: 'dieng-kulon',
        distanceKm: 5.0,
        elevationGainM: 550,
        estimatedHours: 4.0,
      },
    ],
    media: {
      cover: {
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
        alt: 'Gunung Prau Sunrise',
      },
      gallery: [],
    },
    upcomingTrips: [
      {
        id: 'trip-prau-2d1n',
        name: 'Open Trip Gunung Prau Dieng 2D1N',
        slug: 'open-trip-gunung-prau-2d1n',
        tripType: 'OPEN_TRIP',
        difficulty: 'EASY',
        beginnerFriendly: true,
        duration: { days: 2, nights: 1 },
        mountain: { name: 'Prau', slug: 'prau', altitudeM: 2590 },
        coverImage: {
          url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
          alt: 'Open Trip Prau',
        },
        nextSchedule: {
          id: 'sched-prau-1',
          startDate: '2026-10-24',
          endDate: '2026-10-25',
          capacity: 20,
          confirmedSeats: 16,
          availableSeats: 4,
          availabilityStatus: 'ALMOST_FULL',
          startingPrice: 950000,
        },
      },
    ],
    seo: {
      title: 'Gunung Prau 2.590 mdpl - Info Pendakian & Open Trip | Wildera',
      description:
        'Panduan pendakian Gunung Prau Dieng. Jalur Patak Banteng, golden sunrise spektakuler, dan paket open trip ramah pemula.',
    },
  },
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const mountain =
    (await fetchPublicMountainDetail(slug).catch(() => null)) ||
    FALLBACK_MOUNTAIN_DETAILS[slug];

  if (!mountain) {
    return {
      title: 'Gunung Tidak Ditemukan | Wildera Adventure',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalUrl = `https://wildera.id/gunung/${slug}`;
  const title =
    mountain.seo?.title ||
    `Gunung ${mountain.name} ${mountain.altitudeM} mdpl | Wildera Adventure`;
  const description =
    mountain.seo?.description ||
    mountain.description ||
    `Panduan lengkap pendakian Gunung ${mountain.name}`;
  const coverUrl = mountain.media?.cover?.url;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Wildera Adventure',
      images: coverUrl ? [{ url: coverUrl, alt: mountain.name }] : undefined,
      locale: 'id_ID',
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function MountainDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const [apiMountain, settings] = await Promise.all([
    fetchPublicMountainDetail(slug).catch(() => null),
    fetchPublicSiteSettings().catch(() => null),
  ]);

  const mountain = apiMountain || FALLBACK_MOUNTAIN_DETAILS[slug];

  if (!mountain) {
    notFound();
  }

  const whatsappNumber =
    (typeof settings?.contactWhatsapp === 'string'
      ? settings.contactWhatsapp
      : '') ||
    (typeof settings?.bookingWhatsapp === 'string'
      ? settings.bookingWhatsapp
      : '') ||
    '6281234567890';
  const diffConfig = DIFFICULTY_MAP[mountain.defaultDifficulty] ?? {
    label: 'Sedang (Moderate)',
    badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    desc: 'Kombinasi jalur hutan dan tanjakan berkelanjutan. Memerlukan daya tahan kardio dan fisik prima.',
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Beranda',
        item: 'https://wildera.id',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Direktori Gunung',
        item: 'https://wildera.id/gunung',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: mountain.name,
        item: `https://wildera.id/gunung/${slug}`,
      },
    ],
  };

  const mountainJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: `Gunung ${mountain.name}`,
    description: mountain.description,
    image: mountain.media?.cover?.url,
    geo: {
      '@type': 'GeoCoordinates',
      elevation: `${mountain.altitudeM} m`,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mountainJsonLd) }}
      />

      {/* Header */}
      <Navbar whatsappNumber={whatsappNumber} />

      {/* Hero Cover Banner */}
      <header
        aria-label="Mountain Cover Banner"
        className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-black text-white"
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              mountain.media?.cover?.url ||
              'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=80'
            }
            alt={mountain.media?.cover?.alt || mountain.name}
            className="w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-black/60" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-white/70"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <Link href="/gunung" className="hover:text-white transition-colors">
              Direktori Gunung
            </Link>
            <span>/</span>
            <span className="text-white font-semibold">{mountain.name}</span>
          </nav>

          {/* Title & Badge */}
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded text-xs font-semibold border ${diffConfig.badgeClass}`}
              >
                {diffConfig.label}
              </span>
              <span className="text-xs text-white/80 font-medium">
                {mountain.destination?.name}
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white tracking-tight">
              Gunung {mountain.name}
            </h1>
          </div>

          {/* Key Metrics Bar */}
          <div
            data-testid="mountain-metrics-bar"
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded bg-black/40 backdrop-blur-md border border-white/10 max-w-3xl"
          >
            <div>
              <span className="block text-[11px] text-white/60 uppercase tracking-wider">
                Elevasi Puncak
              </span>
              <strong
                data-testid="mountain-altitude"
                className="text-lg sm:text-xl font-mono text-white"
              >
                {mountain.altitudeM.toLocaleString('id-ID')} mdpl
              </strong>
            </div>

            <div>
              <span className="block text-[11px] text-white/60 uppercase tracking-wider">
                Tingkat Kesulitan
              </span>
              <strong
                data-testid="mountain-difficulty"
                className="text-base sm:text-lg text-white"
              >
                {diffConfig.label.split(' ')[0]}
              </strong>
            </div>

            <div>
              <span className="block text-[11px] text-white/60 uppercase tracking-wider">
                Musim Pendakian
              </span>
              <strong className="text-xs sm:text-sm text-white">
                {mountain.bestSeason || 'Sepanjang Tahun'}
              </strong>
            </div>

            <div>
              <span className="block text-[11px] text-white/60 uppercase tracking-wider">
                Jalur Resmi
              </span>
              <strong className="text-lg sm:text-xl font-mono text-white">
                {mountain.routes?.length || 0} Rute
              </strong>
            </div>
          </div>
        </div>
      </header>

      {/* Main Sections */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-16">
        {/* Section 1: Overview & Altitude Detail */}
        <section
          aria-label="Mountain Overview"
          data-testid="mountain-overview-section"
          className="grid grid-cols-1 lg:grid-cols-3 gap-10"
        >
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              Tentang Gunung {mountain.name}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              {mountain.description ||
                `Gunung ${mountain.name} adalah salah satu puncak spektakuler di Indonesia dengan lanskap alam memukau, tantangan pendakian menawan, serta panorama matahari terbit tak terlupakan.`}
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Dengan ketinggian mencapai{' '}
              <strong className="text-foreground">
                {mountain.altitudeM.toLocaleString('id-ID')} meter di atas
                permukaan laut (mdpl)
              </strong>
              , pendaki disarankan mempersiapkan kondisi fisik kardio yang
              matang serta membawa perlengkapan pelindung suhu dingin berstandar
              alpine.
            </p>
          </div>

          {/* Quick Fact Card */}
          <div className="card p-6 rounded border border-border/40 flex flex-col gap-4 h-fit">
            <h3 className="text-lg font-serif font-bold text-foreground">
              Sekilas Fakta
            </h3>
            <ul className="flex flex-col gap-3 text-xs text-muted-foreground">
              <li className="flex justify-between py-1 border-b border-border/40">
                <span>Elevasi:</span>
                <span className="font-semibold text-foreground">
                  {mountain.altitudeM} mdpl
                </span>
              </li>
              <li className="flex justify-between py-1 border-b border-border/40">
                <span>Wilayah:</span>
                <span className="font-semibold text-foreground">
                  {mountain.destination?.name}
                </span>
              </li>
              <li className="flex justify-between py-1 border-b border-border/40">
                <span>Karakter Medan:</span>
                <span className="font-semibold text-foreground">
                  {diffConfig.label}
                </span>
              </li>
              <li className="flex justify-between py-1 border-b border-border/40">
                <span>Musim Terbaik:</span>
                <span className="font-semibold text-foreground">
                  {mountain.bestSeason || 'April – November'}
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2: Difficulty Details */}
        <section
          aria-label="Mountain Difficulty"
          data-testid="mountain-difficulty-section"
          className="card p-6 sm:p-8 rounded border border-border/40 flex flex-col gap-4 bg-muted/20"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                Karakteristik Medan
              </span>
              <h2 className="text-2xl font-serif font-bold text-foreground">
                Tingkat Kesulitan: {diffConfig.label}
              </h2>
            </div>
            <span
              className={`px-3 py-1 rounded text-xs font-semibold border w-fit ${diffConfig.badgeClass}`}
            >
              Standar Wildera
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            {diffConfig.desc} Setiap pendakian dipandu oleh Mountain Guide
            bersertifikat APGI dengan rasio guide aman serta dukungan tim porter
            lokal berdedikasi.
          </p>
        </section>

        {/* Section 3: Routes */}
        <section
          aria-label="Mountain Routes"
          data-testid="mountain-routes-section"
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              Jalur Pendakian Resmi
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              Pilihan Rute & Estimasi Waktu
            </h2>
            <p className="text-sm text-muted-foreground">
              Pilih rute pendakian resmi yang sesuai dengan preferensi ritme dan
              kesiapan fisikmu.
            </p>
          </div>

          {mountain.routes && mountain.routes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mountain.routes.map(
                (route: {
                  id: string;
                  name: string;
                  distanceKm?: number | null;
                  elevationGainM?: number | null;
                  estimatedHours?: number | null;
                }) => (
                  <div
                    key={route.id}
                    data-testid="mountain-route-card"
                    className="card p-5 rounded border border-border/40 flex flex-col gap-3"
                  >
                    <h3 className="text-lg font-serif font-bold text-foreground">
                      {route.name}
                    </h3>
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/40 text-center">
                      <div>
                        <span className="block text-[10px] text-muted-foreground uppercase">
                          Jarak
                        </span>
                        <strong className="text-xs sm:text-sm font-mono text-foreground">
                          {route.distanceKm ? `${route.distanceKm} km` : '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-muted-foreground uppercase">
                          Gain
                        </span>
                        <strong className="text-xs sm:text-sm font-mono text-foreground">
                          {route.elevationGainM
                            ? `+${route.elevationGainM}m`
                            : '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-muted-foreground uppercase">
                          Waktu
                        </span>
                        <strong className="text-xs sm:text-sm font-mono text-foreground">
                          {route.estimatedHours
                            ? `${route.estimatedHours}j`
                            : '—'}
                        </strong>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Jalur pendakian terkelola dengan pos istirahat dan
                      panorama bentang alam terbuka.
                    </p>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="card p-6 rounded border border-border/40 text-sm text-muted-foreground">
              Informasi detail jalur pendakian resmi sedang diperbarui oleh tim
              Wildera.
            </div>
          )}
        </section>

        {/* Section 4: Upcoming Trips */}
        <section
          aria-label="Upcoming Trips"
          data-testid="mountain-upcoming-trips-section"
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                Jadwal Tersedia
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                Trip ke Gunung {mountain.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Daftar keberangkatan Open Trip & paket petualangan terdekat.
              </p>
            </div>
            <Link
              href="/trip"
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Lihat Semua Trip</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {mountain.upcomingTrips && mountain.upcomingTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mountain.upcomingTrips.map((trip: PublicTripSummary) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          ) : (
            <div
              data-testid="no-upcoming-trips-banner"
              className="card p-8 rounded border border-border/40 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex flex-col gap-1 text-center md:text-left">
                <h3 className="text-lg font-serif font-bold text-foreground">
                  Belum ada jadwal Open Trip terdekat
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                  Ingin mendaki Gunung {mountain.name} di tanggal pilihanmu
                  sendiri bersama teman atau kolega? Ajukan Private Trip kustom
                  bersama tim Wildera.
                </p>
              </div>
              <a
                href={buildWhatsAppUrl(
                  whatsappNumber,
                  buildPrivateTripWhatsAppMessage(`Gunung ${mountain.name}`),
                )}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors whitespace-nowrap"
              >
                Konsultasi WhatsApp
              </a>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
