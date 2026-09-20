import type { Metadata } from 'next';
import {
  fetchPublicContentPage,
  fetchPublicSiteSettings,
} from '../../lib/public-api';
import { Navbar } from '../../components/public/navbar';
import { Footer } from '../../components/public/footer';
import { ContentPageView } from '../../components/public/content-page-view';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan | Wildera Adventure',
  description:
    'Syarat dan ketentuan pendaftaran peserta, pembayaran, jadwal, dan aturan perjalanan bersama Wildera Adventure.',
  alternates: {
    canonical: 'https://wildera.id/terms',
  },
  openGraph: {
    title: 'Syarat & Ketentuan | Wildera Adventure',
    description:
      'Syarat dan ketentuan pendaftaran peserta, pembayaran, jadwal, dan aturan perjalanan bersama Wildera Adventure.',
    url: 'https://wildera.id/terms',
    siteName: 'Wildera Adventure',
    locale: 'id_ID',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const FALLBACK_CONTENT = `Dengan melakukan pendaftaran dan pembayaran untuk mengikuti trip Wildera Adventure, peserta dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan berikut.

1. Pendaftaran Peserta
• Peserta wajib memberikan data diri yang benar, lengkap, dan dapat dipertanggungjawabkan.
• Peserta wajib memberikan informasi yang relevan mengenai kondisi kesehatan, alergi, riwayat cedera, atau kebutuhan khusus yang dapat memengaruhi perjalanan.
• Pendaftaran dinyatakan sah setelah peserta memenuhi ketentuan pembayaran yang telah ditetapkan.
• Slot peserta bersifat terbatas dan hanya dapat dipastikan setelah pembayaran diterima sesuai ketentuan yang berlaku.
• Peserta wajib memastikan seluruh data yang diberikan kepada Wildera Adventure telah benar sebelum keberangkatan.

2. Pembayaran
• Pembayaran dilakukan sesuai nominal dan metode pembayaran yang diinformasikan oleh admin Wildera Adventure.
• Ketentuan mengenai DP, pelunasan, dan batas waktu pembayaran akan disampaikan pada saat proses booking.
• Peserta yang belum menyelesaikan pembayaran sesuai batas waktu dapat kehilangan hak atas slot yang telah dipesan.
• Bukti pembayaran wajib disimpan oleh peserta sampai trip selesai.

3. Ketentuan & SOP Peserta
• Peserta wajib memenuhi persyaratan yang ditentukan oleh Wildera Adventure dan/atau pengelola kawasan pendakian.
• Peserta wajib membawa identitas diri asli dan dokumen lain yang diperlukan (seperti surat keterangan sehat jika disyaratkan).
• Peserta wajib mempersiapkan kondisi fisik dan perlengkapan pribadi sesuai dengan karakteristik perjalanan.
• Peserta bertanggung jawab atas barang pribadi yang dibawa selama perjalanan.
• Peserta wajib mengikuti arahan crew Wildera Adventure selama trip berlangsung.
• Peserta dilarang melakukan tindakan yang dapat membahayakan diri sendiri, peserta lain, crew, maupun lingkungan sekitar.

4. Jadwal dan Itinerary
• Waktu keberangkatan, meeting point, itinerary, dan estimasi perjalanan akan diinformasikan sebelum keberangkatan.
• Itinerary dapat mengalami perubahan karena kondisi cuaca ekstrem, kondisi jalur, kepadatan lalu lintas, kebijakan pengelola kawasan, atau faktor keselamatan. Perubahan itinerary yang dilakukan demi keselamatan peserta tidak dianggap sebagai kelalaian Wildera Adventure.
• Peserta wajib hadir di meeting point tepat waktu sesuai ketentuan. Keterlambatan peserta yang menyebabkan tertinggal dari rombongan menjadi tanggung jawab peserta.`;

export default async function TermsPage() {
  const [siteSettings, page] = await Promise.all([
    fetchPublicSiteSettings(),
    fetchPublicContentPage('terms'),
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
          fallbackTitle="Syarat & Ketentuan"
          fallbackSubtitle="Ketentuan resmi pendaftaran, hak, dan kewajiban peserta selama mengikuti kegiatan ekspedisi Wildera Adventure."
          fallbackContent={FALLBACK_CONTENT}
          currentSlug="terms"
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
