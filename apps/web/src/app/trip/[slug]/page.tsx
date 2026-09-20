import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PublicTripDetail } from '@wildera/types';
import {
  fetchPublicSiteSettings,
  fetchPublicTripDetail,
} from '../../../lib/public-api';
import { Navbar } from '../../../components/public/navbar';
import { Footer } from '../../../components/public/footer';
import { TripDetailClient } from '../../../components/trip-detail/trip-detail-client';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const FALLBACK_TRIP_DETAILS: Record<string, PublicTripDetail> = {
  'open-trip-rinjani-summit-4d3n': {
    id: 'trip-rinjani-summit',
    name: 'Open Trip Rinjani Summit & Segara Anak 4D3N',
    slug: 'open-trip-rinjani-summit-4d3n',
    tripType: 'OPEN_TRIP',
    shortDescription:
      'Ekspedisi lengkap mendaki puncak Rinjani 3.726 mdpl, menjelajahi Danau Segara Anak, dan menikmati pemandian air panas alami Aik Kalak.',
    description:
      'Rasakan sensasi petualangan legendaris menaklukkan salah satu kaldera gunung berapi termegah di dunia. Bersama tim pemandu bersertifikat APGI dan porter lokal profesional, Anda akan diajak melewati savana Sembalun, menyaksikan lautan awan dari Plawangan, hingga berdiri di titik tertinggi Pulau Lombok saat sunrise menyinari Danau Segara Anak.',
    highlights: [
      'Puncak Rinjani 3.726 mdpl saat golden sunrise',
      'Camping tepi Danau Segara Anak dengan pemandangan Gunung Barujari',
      'Pemandian air panas alami Aik Kalak untuk relaksasi otot',
      'Jalur eksotis Sembalun dan keasrian hutan tropis Senaru',
    ],
    difficulty: 'HARD',
    beginnerFriendly: false,
    healthCertificateRequired: true,
    minimumAge: 15,
    maximumAge: 55,
    duration: { days: 4, nights: 3 },
    mountain: {
      id: 'mt-rinjani',
      name: 'Rinjani',
      slug: 'rinjani',
      altitudeM: 3726,
      destination: { name: 'Lombok, Nusa Tenggara Barat' },
    },
    route: {
      id: 'route-sembalun',
      name: 'Sembalun',
    },
    media: {
      cover: {
        url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=80',
        alt: 'Gunung Rinjani dan Segara Anak',
      },
      gallery: [
        {
          url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
          alt: 'Danau Segara Anak',
        },
        {
          url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
          alt: 'Sunrise Puncak Dewi Anjani',
        },
      ],
    },
    schedules: [
      {
        id: 'sched-rinjani-1',
        startDate: '2026-10-15',
        endDate: '2026-10-18',
        registrationDeadline: '2026-10-10T23:59:59.000Z',
        lifecycleStatus: 'OPEN',
        capacity: 15,
        confirmedSeats: 9,
        availableSeats: 6,
        availabilityStatus: 'AVAILABLE',
        bookable: true,
        packages: [
          {
            id: 'pkg-rinjani-jakarta',
            name: 'Paket Start Jakarta (All-in)',
            description:
              'Termasuk tiket pesawat PP Jakarta–Lombok, akomodasi hotel H-1, logistik full board, dan perlengkapan camp premium.',
            price: 4850000,
            meetingPoint: {
              id: 'mp-cgk',
              name: 'Bandara Soekarno-Hatta Terminal 2',
              city: 'Tangerang / Jakarta',
              address: 'Terminal 2F Gate Keberangkatan',
            },
            meetingDatetime: '2026-10-15T05:00:00.000Z',
          },
          {
            id: 'pkg-rinjani-lombok',
            name: 'Paket Start Lombok (Meeting Point Bandara)',
            description:
              'Penjemputan di Bandara Internasional Lombok (LOP), transportasi darat ke Sembalun, tenda, matras, dan konsumsi penuh.',
            price: 3250000,
            meetingPoint: {
              id: 'mp-lop',
              name: 'Bandara Internasional Lombok (BIL/LOP)',
              city: 'Praya, Lombok Tengah',
              address: 'Area Penjemputan Kedatangan Domestik',
            },
            meetingDatetime: '2026-10-15T09:00:00.000Z',
          },
        ],
      },
      {
        id: 'sched-rinjani-2',
        startDate: '2026-10-22',
        endDate: '2026-10-25',
        registrationDeadline: '2026-10-18T23:59:59.000Z',
        lifecycleStatus: 'OPEN',
        capacity: 15,
        confirmedSeats: 13,
        availableSeats: 2,
        availabilityStatus: 'ALMOST_FULL',
        bookable: true,
        packages: [
          {
            id: 'pkg-rinjani-lombok-2',
            name: 'Paket Start Lombok',
            description:
              'Penjemputan Bandara LOP dan seluruh fasilitas pendakian.',
            price: 3250000,
            meetingPoint: {
              id: 'mp-lop-2',
              name: 'Bandara Internasional Lombok',
              city: 'Lombok',
              address: 'Kedatangan Domestik LOP',
            },
            meetingDatetime: '2026-10-22T09:00:00.000Z',
          },
        ],
      },
    ],
    itinerary: [
      {
        id: 'it-1',
        dayNumber: 1,
        title: 'Meeting Point Lombok & Perjalanan ke Basecamp Sembalun',
        description:
          'Kumpul di meeting point Bandara Internasional Lombok. Perjalanan darat menuju Sembalun (sekitar 3 jam). Check-in homestay, medical check, pengecekan perlengkapan, dan welcome dinner bersama tim guide.',
      },
      {
        id: 'it-2',
        dayNumber: 2,
        title: 'Trekking Sembalun Menuju Plawangan Sembalun (Camp 1)',
        description:
          'Pemeriksaan simaksi di Pos Sembalun. Trekking melalui padang savana melewati Pos 1, Pos 2 (makan siang), Pos 3, dan mendaki Bukit Penyesalan menuju Pelawangan Sembalun (2.639 mdpl). Bermalam di tenda dengan panorama matahari terbenam.',
      },
      {
        id: 'it-3',
        dayNumber: 3,
        title: 'Summit Attack 3.726 mdpl & Turun ke Danau Segara Anak',
        description:
          'Pukul 02.00 bangun untuk summit attack menuju Puncak Dewi Anjani (3.726 mdpl). Menyaksikan golden sunrise spektakuler. Kembali ke camp, sarapan, lalu melanjutkan perjalanan turun ke Danau Segara Anak (2.000 mdpl). Relaksasi di pemandian air panas Aik Kalak.',
      },
      {
        id: 'it-4',
        dayNumber: 4,
        title: 'Segara Anak - Jalur Senaru & Penutupan Ekspedisi',
        description:
          'Trekking santai melalui jalur asri hutan tropis Senaru. Melewati Pos 3 dan Pos 2 Senaru. Tiba di pintu rimba Senaru sore hari, santap makan siang penutup, serah terima sertifikat pendakian, dan transfer kembali ke Bandara Lombok.',
      },
    ],
    includes: [
      {
        id: 'inc-1',
        item: 'Mountain Guide Bersertifikat APGI',
        description: 'Rasio aman 1 guide untuk setiap 5 peserta.',
      },
      {
        id: 'inc-2',
        item: 'Tim Porter Berpengalaman',
        description:
          'Membawa perlengkapan kelompok, tenda, bahan makanan, dan air bersih.',
      },
      {
        id: 'inc-3',
        item: 'Tenda Dome Premium & Matras Tebal',
        description: 'Kapasitas 3 orang per tenda berisolasi angin kencang.',
      },
      {
        id: 'inc-4',
        item: 'Konsumsi Full Board Selama Pendakian',
        description:
          'Makan 3 kali sehari menu bernutrisi tinggi plus snack dan teh hangat.',
      },
      {
        id: 'inc-5',
        item: 'Tiket TNGR & Asuransi Resmi',
        description: 'Simaksi online resmi Taman Nasional Gunung Rinjani.',
      },
      {
        id: 'inc-6',
        item: 'P3K Standar Alpine & Oksigen Portabel',
        description: 'Peralatan pertolongan pertama dan pulse oximeter.',
      },
    ],
    excludes: [
      {
        id: 'exc-1',
        item: 'Perlengkapan Pakaian & Sleeping Bag Pribadi',
        description:
          'Peserta wajib membawa pakaian hangat dan sleeping bag sendiri.',
      },
      {
        id: 'exc-2',
        item: 'Porter Pribadi',
        description:
          'Dapat disewa tambahan Rp350.000/hari untuk beban ransel pribadi.',
      },
      {
        id: 'exc-3',
        item: 'Pengeluaran Pribadi & Tips Kru',
        description: 'Tip untuk guide dan porter bersifat sukarela.',
      },
    ],
    mandatoryGear: [
      {
        id: 'gear-1',
        gearName: 'Sepatu Trekking Ber-grip',
        specification:
          'Wajib sol bergerigi tebal, tidak licin di medan berpasir/bebatuan.',
      },
      {
        id: 'gear-2',
        gearName: 'Jaket Gunung & Fleece',
        specification: 'Bahan windproof dan penahan dingin hingga suhu 5°C.',
      },
      {
        id: 'gear-3',
        gearName: 'Headlamp dengan Baterai Cadangan',
        specification: 'Untuk kebutuhan summit attack tengah malam.',
      },
      {
        id: 'gear-4',
        gearName: 'Jas Hujan Setelan / Ponco',
        specification: 'Bahan kuat dan tidak mudah sobek oleh ranting.',
      },
    ],
    recommendedGear: [
      {
        id: 'gear-5',
        gearName: 'Trekking Pole',
        specification: 'Sangat membantu menopang lutut saat turun medan curam.',
      },
      {
        id: 'gear-6',
        gearName: 'Gaiter Kaki',
        specification:
          'Mencegah pasir dan kerikil masuk ke dalam sepatu di letter E.',
      },
      {
        id: 'gear-7',
        gearName: 'Pakaian Renang / Ganti',
        specification: 'Untuk berendam di sumber air panas Aik Kalak.',
      },
    ],
    faqs: [
      {
        id: 'faq-1',
        question: 'Apakah rute Rinjani cocok untuk pendaki pemula?',
        answer:
          'Jalur Rinjani memiliki tingkat kesulitan HARD dengan elevasi curam dan durasi panjang. Pemula yang memiliki kesiapan fisik kardio baik (rutin jogging 3x seminggu) dapat mengikutinya, namun sangat disarankan berkonsultasi terlebih dahulu dengan tim konsultan Wildera.',
      },
      {
        id: 'faq-2',
        question:
          'Bagaimana penanganan jika peserta mengalami hipotermia atau cedera?',
        answer:
          'Setiap pemandu kami bersertifikat APGI dan dibekali pelatihan pertolongan pertama gawat darurat (Wilderness First Aid), oximeter, selimut termal, serta tabung oksigen portabel. Tim memiliki jalur koordinasi evakuasi resmi bersama pihak Balai TNGR.',
      },
    ],
    seo: {
      title: 'Open Trip Rinjani Summit & Segara Anak 4D3N | Wildera',
      description:
        'Paket pendakian Gunung Rinjani 3.726 mdpl via Sembalun. Layanan all-inclusive, guide APGI, porter, tenda dome, dan jadwal terjamin.',
    },
  },
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const trip =
    (await fetchPublicTripDetail(slug).catch(() => null)) ||
    FALLBACK_TRIP_DETAILS[slug];

  if (!trip) {
    return {
      title: 'Trip Tidak Ditemukan | Wildera Adventure',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const isPublished = (trip as { status?: string }).status
    ? (trip as { status?: string }).status === 'PUBLISHED'
    : true;
  const canonicalUrl = `https://wildera.id/trip/${slug}`;
  const title =
    trip.seo?.title ||
    `${trip.name} - Info & Jadwal Pendakian | Wildera Adventure`;
  const description =
    trip.seo?.description ||
    trip.shortDescription ||
    `Detail perjalanan ${trip.name} bersama Wildera Adventure.`;
  const coverUrl = trip.media?.cover?.url;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Wildera Adventure',
      images: coverUrl ? [{ url: coverUrl, alt: trip.name }] : undefined,
      locale: 'id_ID',
      type: 'website',
    },
    robots: {
      index: isPublished,
      follow: isPublished,
    },
  };
}

export default async function TripDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const [apiTrip, settings] = await Promise.all([
    fetchPublicTripDetail(slug).catch(() => null),
    fetchPublicSiteSettings().catch(() => null),
  ]);

  const trip = apiTrip || FALLBACK_TRIP_DETAILS[slug];

  if (!trip) {
    notFound();
  }

  const whatsappNumber =
    (typeof settings?.contactWhatsapp === 'string'
      ? settings.contactWhatsapp
      : '') ||
    (typeof settings?.bookingWhatsapp === 'string'
      ? settings.bookingWhatsapp
      : '') ||
    '6281234567890';

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Beranda',
        item: 'https://wildera.id',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Trip',
        item: 'https://wildera.id/trip',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: trip.name,
        item: `https://wildera.id/trip/${slug}`,
      },
    ],
  };

  const lowestPrice =
    trip.schedules
      ?.flatMap((s) => s.packages || [])
      .map((p) => p.price)
      .filter((price) => typeof price === 'number' && price > 0)
      .sort((a, b) => a - b)[0] || 0;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: trip.name,
    description: trip.shortDescription || trip.name,
    image: trip.media?.cover?.url,
    offers: {
      '@type': 'Offer',
      price: lowestPrice,
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
      url: `https://wildera.id/trip/${slug}`,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased pb-16 lg:pb-0">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Header */}
      <Navbar whatsappNumber={whatsappNumber} />

      {/* Main Interactive Trip View */}
      <TripDetailClient trip={trip} whatsappNumber={whatsappNumber} />

      {/* Footer */}
      <Footer />
    </div>
  );
}
