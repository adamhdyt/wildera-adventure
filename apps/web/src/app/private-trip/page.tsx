import type { Metadata } from 'next';
import {
  fetchPublicMountains,
  fetchPublicSiteSettings,
} from '../../lib/public-api';
import { Navbar } from '../../components/public/navbar';
import { Footer } from '../../components/public/footer';
import { PrivateTripClient } from './private-trip-client';

export const metadata: Metadata = {
  title: 'Rencanakan Private Trip Pendakian Gunung | Wildera Adventure',
  description:
    'Kustomisasi jadwal, rute, porter, dan fasilitas eksklusif pendakian gunung impianmu bersama tim profesional Wildera Adventure.',
  alternates: {
    canonical: 'https://wildera.id/private-trip',
  },
  openGraph: {
    title: 'Rencanakan Private Trip Pendakian Gunung | Wildera Adventure',
    description:
      'Kustomisasi jadwal, rute, porter, dan fasilitas eksklusif pendakian gunung impianmu bersama tim profesional Wildera Adventure.',
    url: 'https://wildera.id/private-trip',
    siteName: 'Wildera Adventure',
    locale: 'id_ID',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function PrivateTripPage() {
  const [siteSettings, mountains] = await Promise.all([
    fetchPublicSiteSettings(),
    fetchPublicMountains(),
  ]);

  const whatsappNumber =
    (siteSettings?.contact_whatsapp as string) ||
    (siteSettings?.whatsapp_number as string) ||
    (siteSettings?.contactWhatsapp as string) ||
    '6281234567890';
  const email =
    (siteSettings?.contact_email as string) ||
    (siteSettings?.contactEmail as string) ||
    'info@wildera.id';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar whatsappNumber={whatsappNumber} />
      <main className="flex-1 pt-28 md:pt-36 pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-block px-3.5 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
              Eksklusif & Kustom
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Rancang Private Trip Impianmu
            </h1>
            <p className="mt-4 text-base md:text-lg text-foreground/75 max-w-2xl mx-auto">
              Tentukan sendiri tanggal pendakian, ukuran rombongan, fasilitas
              camp, serta layanan porter dan logistik private tanpa digabung
              dengan grup lain.
            </p>
          </div>

          {/* Form Client */}
          <PrivateTripClient
            mountains={mountains}
            defaultWhatsappNumber={whatsappNumber}
          />
        </div>
      </main>
      <Footer whatsappNumber={whatsappNumber} email={email} />
    </div>
  );
}
