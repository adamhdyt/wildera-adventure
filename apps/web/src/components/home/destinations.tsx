import Link from 'next/link';
import type { PublicDestination } from '@wildera/types';

interface DestinationsProps {
  destinations?: PublicDestination[];
}

interface DestinationCardItem {
  id: string;
  title: string;
  subtitle: string;
  region: string;
  altitude: string;
  image: string;
  slug: string;
}

const FALLBACK_DESTINATIONS: DestinationCardItem[] = [
  {
    id: 'rinjani',
    title: 'Gunung Rinjani',
    subtitle: 'Atap Nusa Tenggara & Danau Segara Anak',
    region: 'Lombok, NTB',
    altitude: '3.726 mdpl',
    image:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
    slug: 'rinjani',
  },
  {
    id: 'prau',
    title: 'Gunung Prau',
    subtitle: 'Golden Sunrise & Lanskap Dataran Tinggi Dieng',
    region: 'Wonosobo, Jawa Tengah',
    altitude: '2.565 mdpl',
    image:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    slug: 'prau',
  },
  {
    id: 'semeru',
    title: 'Gunung Semeru',
    subtitle: 'Puncak Abadi Para Dewa & Ranu Kumbolo',
    region: 'Lumajang, Jawa Timur',
    altitude: '3.676 mdpl',
    image:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    slug: 'semeru',
  },
  {
    id: 'gede',
    title: 'Gunung Gede Pangrango',
    subtitle: 'Alun-Alun Surya Kencana & Kanopi Hutan Tropis',
    region: 'Cianjur, Jawa Barat',
    altitude: '2.958 mdpl',
    image:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
    slug: 'gede-pangrango',
  },
];

export function Destinations({ destinations }: DestinationsProps) {
  // Map API destinations if available, otherwise use curated luxury fallback
  const cards: DestinationCardItem[] =
    destinations && destinations.length > 0
      ? destinations.slice(0, 4).map((d, i) => {
          const fallback =
            FALLBACK_DESTINATIONS[i % FALLBACK_DESTINATIONS.length]!;
          return {
            id: d.id,
            title: d.name,
            subtitle: d.province ? `Kawasan ${d.province}` : fallback.subtitle,
            region: d.province || fallback.region,
            altitude: fallback.altitude,
            image: fallback.image,
            slug: d.slug,
          };
        })
      : FALLBACK_DESTINATIONS;

  return (
    <section aria-label="Explore Destinations" className="py-16 md:py-24">
      <div className="flex flex-col gap-8 md:gap-12">
        {/* Section Header */}
        <div className="flex flex-col items-center w-content-width mx-auto gap-3 text-center">
          <div className="px-3.5 py-1 text-xs font-semibold tracking-wider uppercase card rounded-full w-fit text-accent">
            Destinasi
          </div>
          <h2 className="bg-gradient-to-r from-foreground to-primary-cta bg-clip-text text-transparent text-4xl md:text-6xl font-bold leading-tight text-balance">
            Eksplorasi Puncak Ikonik
          </h2>
          <p className="max-w-2xl text-base md:text-lg leading-relaxed text-foreground/80 text-balance">
            Dari kaldera vulkanik Lombok hingga punggungan hijau di tanah Jawa.
            Temukan rute pendakian terbaik yang siap ditaklukkan.
          </p>
        </div>

        {/* Destination Cards Grid */}
        <div className="w-content-width mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((dest) => (
              <Link
                key={dest.id}
                href={`/gunung/${dest.slug}`}
                className="group relative h-96 rounded-3xl overflow-hidden card shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col justify-end p-6 border border-black/5"
              >
                {/* Background Image with Zoom on Hover */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dest.image}
                  alt={dest.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent group-hover:from-black/90 transition-colors duration-300" />

                {/* Top Badge: Altitude */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                    {dest.altitude}
                  </span>
                </div>

                {/* Card Information */}
                <div className="relative z-10 flex flex-col gap-1.5 text-white">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
                    {dest.region}
                  </span>
                  <h3 className="text-2xl font-bold leading-tight drop-shadow-sm group-hover:text-amber-200 transition-colors">
                    {dest.title}
                  </h3>
                  <p className="text-xs md:text-sm text-white/80 line-clamp-2 leading-relaxed">
                    {dest.subtitle}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-white/90 group-hover:translate-x-1 transition-transform">
                    <span>Lihat Rute & Jadwal</span>
                    <svg
                      className="size-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
