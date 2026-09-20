import type { Metadata } from 'next';
import {
  fetchPublicContentPage,
  fetchPublicSiteSettings,
} from '../../lib/public-api';
import { Navbar } from '../../components/public/navbar';
import { Footer } from '../../components/public/footer';
import { ContentPageView } from '../../components/public/content-page-view';

export const metadata: Metadata = {
  title: 'Standar Keselamatan (SOP) | Wildera Adventure',
  description:
    'Protokol keselamatan pendakian, kualifikasi guide APGI, kesiapan fisik peserta, dan penanganan medis darurat di gunung.',
  alternates: {
    canonical: 'https://wildera.id/safety',
  },
  openGraph: {
    title: 'Standar Keselamatan (SOP) | Wildera Adventure',
    description:
      'Protokol keselamatan pendakian, kualifikasi guide APGI, kesiapan fisik peserta, dan penanganan medis darurat di gunung.',
    url: 'https://wildera.id/safety',
    siteName: 'Wildera Adventure',
    locale: 'id_ID',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const FALLBACK_CONTENT = `Keselamatan merupakan prioritas mutlak dalam setiap ekspedisi bersama Wildera Adventure. Kegiatan pendakian alam bebas memiliki risiko objektif dan subjektif, sehingga seluruh peserta wajib mematuhi pedoman keselamatan berikut:

1. Kesiapan Fisik & Kesehatan
• Peserta wajib memastikan kondisi fisik prima dan cukup istirahat sebelum hari keberangkatan.
• Peserta wajib jujur menginformasikan riwayat penyakit kronis, asma, alergi makanan/obat, atau riwayat cedera sendi kepada tim sebelum mendaki.
• Peserta disarankan membawa obat-obatan pribadi yang biasa dikonsumsi.

2. Rasio Pemandu & Kualifikasi Crew
• Seluruh pendakian Wildera didampingi oleh lead guide dan sweeper berpengalaman bersertifikasi kepemanduan (APGI/KEMNAKER).
• Rasio pemandu terhadap peserta dijaga ketat agar setiap peserta terpantau secara individual di jalur pendakian.
• Tim dibekali perlengkapan medis P3K standar outdoor darurat.

3. Disiplin di Jalur Pendakian
• Peserta dilarang mendahului lead guide dan dilarang tertinggal di belakang sweeper.
• Apabila merasa lelah, pusing, sesak napas, atau mengalami gejala awal hipotermia/AMS, peserta wajib segera memberitahu crew terdekat.
• Keputusan lead guide mengenai keselamatan (termasuk keputusan putar balik demi keselamatan sebelum mencapai puncak) bersifat mutlak dan tidak dapat diganggu gugat.

4. Etika Kelestarian (Leave No Trace)
• Dilarang membuang sampah sembarangan; seluruh sampah pribadi dan kelompok wajib dibawa turun kembali ke basecamp.
• Menghormati kearifan lokal masyarakat lereng gunung dan mematuhi zona larangan adat/konservasi setempat.`;

export default async function SafetyPage() {
  const [siteSettings, page] = await Promise.all([
    fetchPublicSiteSettings(),
    fetchPublicContentPage('safety'),
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
          fallbackTitle="Standar Keselamatan & SOP"
          fallbackSubtitle="Manajemen risiko, kualifikasi pemandu profesional, dan protokol medis darurat demi pengalaman pendakian yang aman."
          fallbackContent={FALLBACK_CONTENT}
          currentSlug="safety"
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
