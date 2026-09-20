import type { Metadata } from 'next';
import {
  fetchPublicContentPage,
  fetchPublicSiteSettings,
} from '../../lib/public-api';
import { Navbar } from '../../components/public/navbar';
import { Footer } from '../../components/public/footer';
import { ContentPageView } from '../../components/public/content-page-view';

export const metadata: Metadata = {
  title: 'Tentang Kami | Wildera Adventure',
  description:
    'Mengenal Wildera Adventure, penyedia perjalanan dan open trip outdoor pendakian gunung yang nyaman, aman, dan berkesan.',
  alternates: {
    canonical: 'https://wildera.id/tentang',
  },
  openGraph: {
    title: 'Tentang Kami | Wildera Adventure',
    description:
      'Mengenal Wildera Adventure, penyedia perjalanan dan open trip outdoor pendakian gunung yang nyaman, aman, dan berkesan.',
    url: 'https://wildera.id/tentang',
    siteName: 'Wildera Adventure',
    locale: 'id_ID',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const FALLBACK_CONTENT = `Wildera Adventure adalah penyedia perjalanan dan trip outdoor yang menghadirkan pengalaman pendakian dan perjalanan alam dengan konsep yang nyaman, aman, dan berkesan.

Visi & Nilai Kami:
• Keselamatan Sebagai Prioritas Utama: Setiap pendakian dipandu oleh crew berpengalaman dan dibekali SOP manajemen risiko serta dukungan P3K.
• Kenyamanan Logistik: Menghadirkan fasilitas menyeluruh mulai dari simaksi, konsumsi bergizi, sop buah segar di pos pendakian, hingga opsi transportasi pulang-pergi.
• Kelestarian Alam: Menerapkan prinsip Leave No Trace dan etika pendakian bertanggung jawab demi kelestarian alam pegunungan Indonesia.

Kantor & Informasi Kontak:
• Alamat: Jl. Re. Martadinata Cijoho, Kuningan, Jawa Barat, 45513.
• WhatsApp: +62 823-1987-2790
• Email: wilderaadventure.id@gmail.com
• Instagram: @wilderaadventure.id
• TikTok: @wilderaadventure.id`;

export default async function AboutPage() {
  const [siteSettings, page] = await Promise.all([
    fetchPublicSiteSettings(),
    fetchPublicContentPage('about'),
  ]);

  const whatsappNumber =
    (siteSettings?.contact_whatsapp as string) ||
    (siteSettings?.whatsapp_number as string) ||
    '6282319872790';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar whatsappNumber={whatsappNumber} />
      <main className="flex-1">
        <ContentPageView
          page={page}
          fallbackTitle="Tentang Wildera Adventure"
          fallbackSubtitle="Menghadirkan pengalaman petualangan gunung yang berkesan dengan standar kenyamanan dan keselamatan terdepan."
          fallbackContent={FALLBACK_CONTENT}
          currentSlug="tentang"
        />
      </main>
      <Footer
        siteName="Wildera Adventure"
        whatsappNumber={whatsappNumber}
        email="wilderaadventure.id@gmail.com"
        instagramHandle="@wilderaadventure.id"
      />
    </div>
  );
}
