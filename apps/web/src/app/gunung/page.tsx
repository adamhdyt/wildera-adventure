import { Suspense } from 'react';
import type { Metadata } from 'next';
import type { PublicMountainSummary } from '@wildera/types';
import {
  fetchPublicMountains,
  fetchPublicSiteSettings,
} from '../../lib/public-api';
import { Navbar } from '../../components/public/navbar';
import { Footer } from '../../components/public/footer';
import { MountainDirectoryClient } from '../../components/mountain/mountain-directory-client';

export const metadata: Metadata = {
  title: 'Direktori Gunung Indonesia | Wildera Adventure',
  description:
    'Eksplorasi puncak-puncak megah Indonesia. Temukan informasi elevasi, tingkat kesulitan, jalur pendakian resmi, dan jadwal trip aktif.',
  alternates: {
    canonical: 'https://wildera.id/gunung',
  },
  openGraph: {
    title: 'Direktori Gunung Indonesia | Wildera Adventure',
    description:
      'Eksplorasi puncak-puncak megah Indonesia. Temukan informasi elevasi, tingkat kesulitan, jalur pendakian resmi, dan jadwal trip aktif.',
    url: 'https://wildera.id/gunung',
    siteName: 'Wildera Adventure',
    locale: 'id_ID',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const FALLBACK_MOUNTAINS: PublicMountainSummary[] = [
  {
    id: 'mt-rinjani',
    name: 'Rinjani',
    slug: 'rinjani',
    altitudeM: 3726,
    defaultDifficulty: 'HARD',
    destination: { name: 'Lombok, Nusa Tenggara Barat' },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
      alt: 'Gunung Rinjani',
    },
  },
  {
    id: 'mt-prau',
    name: 'Prau',
    slug: 'prau',
    altitudeM: 2590,
    defaultDifficulty: 'EASY',
    destination: { name: 'Dieng, Jawa Tengah' },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      alt: 'Gunung Prau',
    },
  },
  {
    id: 'mt-semeru',
    name: 'Semeru',
    slug: 'semeru',
    altitudeM: 3676,
    defaultDifficulty: 'EXTREME',
    destination: { name: 'Lumajang, Jawa Timur' },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      alt: 'Gunung Semeru',
    },
  },
  {
    id: 'mt-bromo',
    name: 'Bromo',
    slug: 'bromo',
    altitudeM: 2329,
    defaultDifficulty: 'EASY',
    destination: { name: 'Tengger, Jawa Timur' },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
      alt: 'Gunung Bromo',
    },
  },
  {
    id: 'mt-merbabu',
    name: 'Merbabu',
    slug: 'merbabu',
    altitudeM: 3142,
    defaultDifficulty: 'MODERATE',
    destination: { name: 'Magelang, Jawa Tengah' },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      alt: 'Gunung Merbabu',
    },
  },
];

export default async function MountainDirectoryPage() {
  const [apiMountains, settings] = await Promise.all([
    fetchPublicMountains().catch(() => []),
    fetchPublicSiteSettings().catch(() => null),
  ]);

  const mountains = apiMountains.length > 0 ? apiMountains : FALLBACK_MOUNTAINS;
  const whatsappNumber =
    (typeof settings?.contactWhatsapp === 'string'
      ? settings.contactWhatsapp
      : '') ||
    (typeof settings?.bookingWhatsapp === 'string'
      ? settings.bookingWhatsapp
      : '') ||
    '6281234567890';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      {/* Header */}
      <Navbar whatsappNumber={whatsappNumber} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 flex flex-col gap-10">
        {/* Editorial Hero Header */}
        <section
          aria-label="Mountain Directory Hero"
          className="flex flex-col gap-3"
        >
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>Puncak Nusantara</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-foreground tracking-tight">
            Direktori Gunung Indonesia
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
            Panduan lengkap ketinggian, jalur pendakian resmi, karakter medan,
            dan jadwal open trip terkurasi untuk setiap puncak impianmu.
          </p>
        </section>

        {/* Directory Explorer Component */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded h-80 bg-card border border-border/40"
                />
              ))}
            </div>
          }
        >
          <MountainDirectoryClient initialMountains={mountains} />
        </Suspense>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
