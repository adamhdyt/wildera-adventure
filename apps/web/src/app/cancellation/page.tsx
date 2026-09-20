import type { Metadata } from 'next';
import {
  fetchPublicContentPage,
  fetchPublicSiteSettings,
} from '../../lib/public-api';
import { Navbar } from '../../components/public/navbar';
import { Footer } from '../../components/public/footer';
import { ContentPageView } from '../../components/public/content-page-view';

export const metadata: Metadata = {
  title: 'Kebijakan Pembatalan & Refund | Wildera Adventure',
  description:
    'Ketentuan pembatalan oleh peserta, jadwal pengembalian dana, penggantian nama peserta, dan pembatalan akibat kondisi cuaca ekstrem.',
  alternates: {
    canonical: 'https://wildera.id/cancellation',
  },
  openGraph: {
    title: 'Kebijakan Pembatalan & Refund | Wildera Adventure',
    description:
      'Ketentuan pembatalan oleh peserta, jadwal pengembalian dana, penggantian nama peserta, dan pembatalan akibat kondisi cuaca ekstrem.',
    url: 'https://wildera.id/cancellation',
    siteName: 'Wildera Adventure',
    locale: 'id_ID',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const FALLBACK_CONTENT = `Kebijakan pembatalan ini dibuat untuk memberikan kejelasan mengenai pembatalan booking, penggantian peserta, pengembalian dana, serta perubahan jadwal perjalanan.

1. Pembatalan oleh Peserta
Dengan melakukan pembayaran, peserta menyetujui ketentuan alokasi biaya operasional yang telah disiapkan sebelum hari H:
• H-14 atau lebih sebelum keberangkatan:
  Peserta dapat mengajukan pembatalan. Pengembalian dana akan disesuaikan dengan biaya simaksi/transportasi yang sudah dibayarkan dan potongan administrasi.
• H-13 sampai H-7 sebelum keberangkatan:
  Pengembalian dana terbatas maksimal 50% setelah dikurangi biaya operasional yang telah dikeluarkan.
• H-6 sampai hari H keberangkatan:
  Biaya yang telah dibayarkan tidak dapat dikembalikan (non-refundable) karena seluruh logistik, transportasi, dan perizinan telah difinalisasi.

2. Penggantian Peserta
• Peserta diperbolehkan mencari dan mengajukan pengganti nama peserta dengan memberi tahu admin maksimal H-3 sebelum keberangkatan.
• Peserta pengganti wajib melengkapi seluruh data identitas dan mematuhi syarat kesehatan yang berlaku.

3. Ketidakhadiran (No-Show) & Keterlambatan
• Peserta yang tidak hadir di meeting point pada waktu yang telah ditentukan tanpa konfirmasi dianggap mengundurkan diri (no-show), dan hak slot hangus tanpa pengembalian dana.
• Apabila terjadi keterlambatan dari jam keberangkatan, biaya tambahan untuk menyusul ke basecamp menjadi tanggung jawab pribadi peserta.

4. Pembatalan atau Penundaan oleh Pihak Wildera Adventure
Keselamatan peserta adalah prioritas utama. Apabila terjadi force majeure seperti bencana alam, status penutupan jalur oleh balai taman nasional, atau cuaca ekstrem yang membahayakan jiwa:
• Wildera Adventure berhak menjadwalkan ulang (reschedule) keberangkatan atau mengalihkan ke destinasi alternatif yang aman sesuai kesepakatan kelompok.
• Jika trip dibatalkan total oleh pengelola tanpa opsi pengganti, pengembalian dana akan diproses secara transparan sesuai biaya murni yang belum terpakai.`;

export default async function CancellationPage() {
  const [siteSettings, page] = await Promise.all([
    fetchPublicSiteSettings(),
    fetchPublicContentPage('cancellation'),
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
          fallbackTitle="Kebijakan Pembatalan & Refund"
          fallbackSubtitle="Informasi transparan mengenai batas waktu pembatalan, mekanisme pengalihan peserta, dan penanganan kondisi cuaca ekstrem."
          fallbackContent={FALLBACK_CONTENT}
          currentSlug="cancellation"
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
