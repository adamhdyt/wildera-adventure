import type { Metadata } from 'next';
import {
  fetchPublicContentPage,
  fetchPublicSiteSettings,
} from '../../lib/public-api';
import { Navbar } from '../../components/public/navbar';
import { Footer } from '../../components/public/footer';
import { ContentPageView } from '../../components/public/content-page-view';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi | Wildera Adventure',
  description:
    'Kebijakan perlindungan data pribadi, informasi medis, dan privasi peserta Wildera Adventure.',
  alternates: {
    canonical: 'https://wildera.id/privacy',
  },
  openGraph: {
    title: 'Kebijakan Privasi | Wildera Adventure',
    description:
      'Kebijakan perlindungan data pribadi, informasi medis, dan privasi peserta Wildera Adventure.',
    url: 'https://wildera.id/privacy',
    siteName: 'Wildera Adventure',
    locale: 'id_ID',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const FALLBACK_CONTENT = `Wildera Adventure menghargai dan menjaga privasi setiap peserta, calon peserta, serta pengunjung website. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi yang diberikan kepada kami.

1. Informasi yang Kami Kumpulkan
Dalam proses booking dan penyelenggaraan trip, Wildera Adventure dapat meminta informasi meliputi:
• Nama lengkap sesuai identitas resmi
• Usia atau tanggal lahir, dan jenis kelamin
• Nomor WhatsApp dan kontak aktif
• Alamat domisili
• Kontak darurat (nama, nomor telepon, dan hubungan)
• Informasi riwayat kesehatan atau alergi yang relevan dengan keselamatan pendakian
• Bukti transaksi pembayaran untuk verifikasi administrasi

2. Tujuan Penggunaan Data
Informasi peserta digunakan semata-mata untuk:
• Memproses pendaftaran, alokasi kursi, dan penerbitan tiket booking
• Keperluan simaksi atau pendaftaran resmi di pos pengelola taman nasional / balai konservasi
• Membantu crew medis dalam pendampingan dan penanganan keadaan darurat di lapangan
• Koordinasi jadwal, meeting point, dan perubahan informasi perjalanan via WhatsApp

3. Perlindungan Informasi Medis & Kesehatan
Informasi riwayat medis diperlakukan secara rahasia dan hanya diakses oleh pihak yang berwenang (lead guide / tim medis lapangan) demi keselamatan peserta selama ekspedisi.

4. Dokumentasi Kegiatan (Foto & Video)
Selama kegiatan berlangsung, tim dokumentasi dapat mengambil foto dan video perjalanan. Apabila peserta tidak berkenan foto atau videonya dipublikasikan di materi promosi media sosial atau website, peserta dapat menyampaikan keberatan tertulis kepada admin sebelum keberangkatan.`;

export default async function PrivacyPage() {
  const [siteSettings, page] = await Promise.all([
    fetchPublicSiteSettings(),
    fetchPublicContentPage('privacy'),
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
          fallbackTitle="Kebijakan Privasi"
          fallbackSubtitle="Komitmen Wildera Adventure dalam melindungi kerahasiaan identitas dan data pribadi peserta."
          fallbackContent={FALLBACK_CONTENT}
          currentSlug="privacy"
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
