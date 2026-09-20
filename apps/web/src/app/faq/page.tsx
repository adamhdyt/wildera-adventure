import type { Metadata } from 'next';
import { fetchPublicFaqs, fetchPublicSiteSettings } from '../../lib/public-api';
import { Navbar } from '../../components/public/navbar';
import { Footer } from '../../components/public/footer';
import { FaqClient } from './faq-client';
import type { PublicFaq } from '@wildera/types';

export const metadata: Metadata = {
  title: 'Tanya Jawab (FAQ) & Panduan Pendakian | Wildera Adventure',
  description:
    'Pertanyaan yang sering diajukan seputar open trip pendakian gunung, persiapan pemula, fasilitas, simaksi, dan cara booking bersama Wildera Adventure.',
  alternates: {
    canonical: 'https://wildera.id/faq',
  },
  openGraph: {
    title: 'Tanya Jawab (FAQ) & Panduan Pendakian | Wildera Adventure',
    description:
      'Pertanyaan yang sering diajukan seputar open trip pendakian gunung, persiapan pemula, fasilitas, simaksi, dan cara booking bersama Wildera Adventure.',
    url: 'https://wildera.id/faq',
    siteName: 'Wildera Adventure',
    locale: 'id_ID',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const OFFICIAL_FAQS: PublicFaq[] = [
  {
    id: 'faq-1',
    category: 'Umum',
    question: 'Apa itu Wildera Adventure?',
    answer:
      'Wildera Adventure adalah penyedia perjalanan dan trip outdoor yang menghadirkan pengalaman pendakian dan perjalanan alam dengan konsep yang nyaman, aman, dan berkesan.',
    sortOrder: 1,
  },
  {
    id: 'faq-2',
    category: 'Trip',
    question: 'Trip apa saja yang tersedia di Wildera Adventure?',
    answer:
      'Saat ini Wildera Adventure menyediakan beberapa pilihan trip, di antaranya Gunung Ciremai Via Palutungan, Gunung Merbabu Via Thekelan, Gunung Prau Via Patak Banteng, dan Gunung Papandayan Via Cikahuripan. Pilihan gunung, jalur, serta paket dapat disesuaikan dengan jadwal trip yang sedang dibuka.',
    sortOrder: 2,
  },
  {
    id: 'faq-3',
    category: 'Persiapan',
    question: 'Apakah trip Wildera Adventure bisa diikuti pemula?',
    answer:
      'Bisa. Namun, setiap peserta wajib menyesuaikan pilihan trip dengan kondisi fisik dan kemampuan masing-masing. Informasi mengenai tingkat kesulitan dan kebutuhan perjalanan akan disampaikan sebelum keberangkatan.',
    sortOrder: 3,
  },
  {
    id: 'faq-4',
    category: 'Fasilitas',
    question: 'Apa saja yang sudah termasuk dalam harga trip?',
    answer:
      'Fasilitas yang termasuk dalam paket trip meliputi: Simaksi resmi perizinan; Makan 1×; Sop buah segar 1×; Transportasi pulang-pergi untuk paket dengan meeting point tertentu; dan Biaya tol. Untuk paket dengan meeting point basecamp, transportasi PP tidak termasuk karena peserta langsung berkumpul di basecamp.',
    sortOrder: 4,
  },
  {
    id: 'faq-5',
    category: 'Logistik',
    question: 'Apakah perlengkapan pendakian sudah disediakan?',
    answer:
      'Perlengkapan pribadi peserta seperti sepatu, pakaian hangat, tas, jas hujan, dan obat pribadi pada dasarnya menjadi tanggung jawab masing-masing peserta. Perlengkapan kelompok atau gear tertentu yang disediakan Wildera Adventure diinformasikan pada detail masing-masing paket.',
    sortOrder: 5,
  },
  {
    id: 'faq-6',
    category: 'Kesehatan',
    question: 'Apakah peserta wajib membawa surat kesehatan?',
    answer:
      'Peserta dapat diwajibkan membawa surat keterangan sehat sesuai ketentuan trip, regulasi lokasi pendakian/taman nasional yang berlaku. Ketentuan tersebut akan diinformasikan oleh admin sebelum keberangkatan.',
    sortOrder: 6,
  },
  {
    id: 'faq-7',
    category: 'Booking',
    question: 'Bagaimana cara booking trip?',
    answer:
      'Booking dapat dilakukan langsung melalui website Wildera Adventure atau WhatsApp resmi kami. Admin akan memberikan rincian ketersediaan slot, formulir manifest peserta, nomor rekening pembayaran, serta panduan trip.',
    sortOrder: 7,
  },
  {
    id: 'faq-8',
    category: 'Pembayaran',
    question: 'Apakah harus melakukan pembayaran penuh saat booking?',
    answer:
      'Ketentuan pembayaran, termasuk besaran DP dan batas waktu pelunasan, disampaikan pada saat proses booking sesuai paket trip yang dipilih.',
    sortOrder: 8,
  },
  {
    id: 'faq-9',
    category: 'Booking',
    question: 'Apakah bisa booking untuk rombongan atau grup sendiri?',
    answer:
      'Bisa. Anda dapat mendaftarkan diri secara individu maupun bersama rombongan, atau memilih opsi Private Trip untuk jadwal dan fasilitas yang sepenuhnya eksklusif.',
    sortOrder: 9,
  },
  {
    id: 'faq-10',
    category: 'Keselamatan',
    question: 'Bagaimana jika cuaca buruk saat hari keberangkatan?',
    answer:
      'Keselamatan peserta menjadi prioritas mutlak. Apabila kondisi cuaca atau jalur dinilai tidak aman oleh otoritas taman nasional, Wildera Adventure dapat melakukan penyesuaian itinerary, penundaan jadwal, atau pengalihan rute demi keselamatan.',
    sortOrder: 10,
  },
];

export default async function FaqPage() {
  const [siteSettings, apiFaqs] = await Promise.all([
    fetchPublicSiteSettings(),
    fetchPublicFaqs(),
  ]);

  const whatsappNumber =
    (siteSettings?.contact_whatsapp as string) ||
    (siteSettings?.whatsapp_number as string) ||
    '6282319872790';

  const faqs = apiFaqs && apiFaqs.length > 0 ? apiFaqs : OFFICIAL_FAQS;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar whatsappNumber={whatsappNumber} />
      <main className="flex-1">
        <FaqClient initialFaqs={faqs} whatsappNumber={whatsappNumber} />
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
