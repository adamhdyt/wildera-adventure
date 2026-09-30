import { Suspense } from 'react';
import type { Metadata } from 'next';
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

export default async function TripCatalogPage() {
  const [apiTrips, settings] = await Promise.all([
    fetchPublicTrips(),
    fetchPublicSiteSettings(),
  ]);

  const trips = apiTrips ?? [];

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
