import { Suspense } from 'react';
import type { Metadata } from 'next';
import type { PublicTripSummary } from '@wildera/types';
import {
  fetchPublicSiteSettings,
  fetchPublicTrips,
} from '../../lib/public-api';
import { Navbar } from '../../components/public/navbar';
import { Footer } from '../../components/public/footer';
import { TripCatalogClient } from '../../components/trip/trip-catalog-client';

export const metadata: Metadata = {
  title: 'Katalog Trip Pendakian Gunung | Wildera Adventure',
  description:
    'Cari dan amankan jadwal open trip dan private trip ke berbagai gunung terbaik di Indonesia. Fasilitas camp premium dan pemandu bersertifikat.',
  alternates: {
    canonical: 'https://wildera.id/trip',
  },
  openGraph: {
    title: 'Katalog Trip Pendakian Gunung | Wildera Adventure',
    description:
      'Cari dan amankan jadwal open trip dan private trip ke berbagai gunung terbaik di Indonesia. Fasilitas camp premium dan pemandu bersertifikat.',
    url: 'https://wildera.id/trip',
    siteName: 'Wildera Adventure',
    locale: 'id_ID',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const FALLBACK_CATALOG_TRIPS: PublicTripSummary[] = [
  {
    id: 'catalog-prau',
    name: 'Open Trip Gunung Prau 2D1N via Dieng',
    slug: 'open-trip-gunung-prau-2d1n',
    tripType: 'OPEN_TRIP',
    difficulty: 'EASY',
    beginnerFriendly: true,
    duration: { days: 2, nights: 1 },
    mountain: {
      name: 'Gunung Prau',
      slug: 'gunung-prau',
      altitudeM: 2565,
    },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
      alt: 'Gunung Prau',
    },
    nextSchedule: {
      id: 'sched-prau-1',
      startDate: '2026-09-26',
      endDate: '2026-09-27',
      capacity: 15,
      confirmedSeats: 7,
      availableSeats: 8,
      availabilityStatus: 'AVAILABLE',
      startingPrice: 950000,
    },
  },
  {
    id: 'catalog-rinjani',
    name: 'Open Trip Gunung Rinjani 4D3N via Sembalun',
    slug: 'open-trip-gunung-rinjani-4d3n',
    tripType: 'OPEN_TRIP',
    difficulty: 'HARD',
    beginnerFriendly: false,
    duration: { days: 4, nights: 3 },
    mountain: {
      name: 'Gunung Rinjani',
      slug: 'gunung-rinjani',
      altitudeM: 3726,
    },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
      alt: 'Gunung Rinjani',
    },
    nextSchedule: {
      id: 'sched-rinjani-1',
      startDate: '2026-10-15',
      endDate: '2026-10-18',
      capacity: 12,
      confirmedSeats: 10,
      availableSeats: 2,
      availabilityStatus: 'ALMOST_FULL',
      startingPrice: 2450000,
    },
  },
  {
    id: 'catalog-semeru',
    name: 'Private Trip Mahameru Semeru 3D2N',
    slug: 'private-trip-semeru-3d2n',
    tripType: 'PRIVATE_TRIP',
    difficulty: 'HARD',
    beginnerFriendly: false,
    duration: { days: 3, nights: 2 },
    mountain: {
      name: 'Gunung Semeru',
      slug: 'gunung-semeru',
      altitudeM: 3676,
    },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
      alt: 'Gunung Semeru',
    },
    nextSchedule: {
      id: 'sched-semeru-1',
      startDate: '2026-11-05',
      endDate: '2026-11-07',
      capacity: 10,
      confirmedSeats: 3,
      availableSeats: 7,
      availabilityStatus: 'AVAILABLE',
      startingPrice: 3200000,
    },
  },
  {
    id: 'catalog-gede',
    name: 'Open Trip Gunung Gede 2D1N via Putri',
    slug: 'open-trip-gunung-gede-2d1n',
    tripType: 'OPEN_TRIP',
    difficulty: 'MODERATE',
    beginnerFriendly: true,
    duration: { days: 2, nights: 1 },
    mountain: {
      name: 'Gunung Gede',
      slug: 'gunung-gede',
      altitudeM: 2958,
    },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1200&auto=format&fit=crop',
      alt: 'Gunung Gede',
    },
    nextSchedule: {
      id: 'sched-gede-1',
      startDate: '2026-10-24',
      endDate: '2026-10-25',
      capacity: 16,
      confirmedSeats: 16,
      availableSeats: 0,
      availabilityStatus: 'SOLD_OUT',
      startingPrice: 850000,
    },
  },
];

export default async function TripCatalogPage() {
  const [apiTrips, settings] = await Promise.all([
    fetchPublicTrips(),
    fetchPublicSiteSettings(),
  ]);

  const trips =
    apiTrips && apiTrips.length > 0 ? apiTrips : FALLBACK_CATALOG_TRIPS;

  const whatsappNumber =
    (settings?.contact_whatsapp as string) || '6281234567890';
  const email = (settings?.contact_email as string) || 'info@wildera.id';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar whatsappNumber={whatsappNumber} />

      <main className="flex-1 pt-24 md:pt-32 pb-16">
        <Suspense
          fallback={
            <div className="w-content-width mx-auto px-4 py-12 text-center text-muted-foreground animate-pulse">
              Memuat katalog trip...
            </div>
          }
        >
          <TripCatalogClient
            initialTrips={trips}
            whatsappNumber={whatsappNumber}
          />
        </Suspense>
      </main>

      <Footer whatsappNumber={whatsappNumber} email={email} />
    </div>
  );
}
