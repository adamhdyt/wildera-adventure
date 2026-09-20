import type { Metadata } from 'next';
import {
  fetchPublicDestinations,
  fetchPublicFaqs,
  fetchPublicSiteSettings,
  fetchPublicTrips,
} from '../lib/public-api';
import { Navbar } from '../components/public/navbar';
import { Hero } from '../components/home/hero';
import { UpcomingTrips } from '../components/home/upcoming-trips';
import { Destinations } from '../components/home/destinations';
import { WhyWildera } from '../components/home/why-wildera';
import { HowItWorks } from '../components/home/how-it-works';
import { PrivateTripCta } from '../components/home/private-trip-cta';
import { FaqSection } from '../components/home/faq-section';
import { FinalCta } from '../components/home/final-cta';
import { Footer } from '../components/public/footer';

export const metadata: Metadata = {
  title: 'Wildera Adventure | Ekspedisi & Open Trip Gunung Indonesia',
  description:
    'Layanan open trip dan private trip mendaki gunung di Indonesia dengan standar keselamatan medis, pemandu bersertifikat, dan logistik camp premium.',
  keywords: [
    'open trip gunung',
    'private trip rinjani',
    'pendakian gunung prau',
    'trip semeru',
    'operator pendakian gunung',
    'wildera adventure',
  ],
  openGraph: {
    title: 'Wildera Adventure | Ekspedisi & Open Trip Gunung Indonesia',
    description:
      'Temukan perjalanan gunungmu. Open trip & private trip dengan kenyamanan dan keamanan terbaik.',
    url: 'https://wildera.id',
    siteName: 'Wildera Adventure',
    locale: 'id_ID',
    type: 'website',
  },
  alternates: {
    canonical: 'https://wildera.id',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function HomePage() {
  // Concurrent data fetching with graceful resilience
  const [trips, destinations, faqs, settings] = await Promise.all([
    fetchPublicTrips(),
    fetchPublicDestinations(),
    fetchPublicFaqs(),
    fetchPublicSiteSettings(),
  ]);

  const whatsappNumber =
    (settings?.contact_whatsapp as string) ||
    (settings?.whatsapp_number as string) ||
    '6281234567890';
  const email = (settings?.contact_email as string) || 'info@wildera.id';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-accent selection:text-white">
      {/* 1. Header / Navbar */}
      <Navbar whatsappNumber={whatsappNumber} />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. Upcoming Trips Section (Real API data) */}
        <UpcomingTrips trips={trips} />

        {/* 4. Explore Destinations Section */}
        <Destinations destinations={destinations} />

        {/* 5. Why Wildera Section */}
        <WhyWildera />

        {/* 6. How It Works Section */}
        <HowItWorks />

        {/* 7. Private Trip CTA */}
        <PrivateTripCta whatsappNumber={whatsappNumber} />

        {/* 8. FAQ Section */}
        <FaqSection faqs={faqs} />

        {/* 9. Final CTA */}
        <FinalCta whatsappNumber={whatsappNumber} />
      </main>

      {/* 10. Footer */}
      <Footer whatsappNumber={whatsappNumber} email={email} />
    </div>
  );
}
