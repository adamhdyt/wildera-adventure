import Link from 'next/link';
import type { PublicTripSummary } from '@wildera/types';

interface UpcomingTripsProps {
  trips?: PublicTripSummary[];
}

const FALLBACK_TRIPS: PublicTripSummary[] = [
  {
    id: 'prau-fallback',
    name: 'Open Trip Gunung Prau 2D1N Golden Sunrise',
    slug: 'open-trip-gunung-prau-2d1n',
    tripType: 'OPEN_TRIP',
    difficulty: 'MODERATE',
    beginnerFriendly: true,
    duration: { days: 2, nights: 1 },
    mountain: { name: 'Gunung Prau', slug: 'gunung-prau', altitudeM: 2565 },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
      alt: 'Pemandangan golden sunrise Gunung Prau Dieng',
    },
    nextSchedule: {
      id: 'sch-1',
      startDate: '2026-10-10',
      endDate: '2026-10-11',
      capacity: 20,
      confirmedSeats: 14,
      availableSeats: 6,
      availabilityStatus: 'AVAILABLE',
      startingPrice: 950000,
    },
  },
  {
    id: 'rinjani-fallback',
    name: 'Open Trip Gunung Rinjani 4D3N Summit & Segara Anak',
    slug: 'open-trip-gunung-rinjani-4d3n',
    tripType: 'OPEN_TRIP',
    difficulty: 'HARD',
    beginnerFriendly: false,
    duration: { days: 4, nights: 3 },
    mountain: {
      name: 'Gunung Rinjani',
      slug: 'gunung-rinjani',
      altitudeM: 3726,
    },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
      alt: 'Kaldera dan danau kawah Segara Anak Gunung Rinjani',
    },
    nextSchedule: {
      id: 'sch-2',
      startDate: '2026-10-15',
      endDate: '2026-10-18',
      capacity: 16,
      confirmedSeats: 13,
      availableSeats: 3,
      availabilityStatus: 'ALMOST_FULL',
      startingPrice: 2650000,
    },
  },
  {
    id: 'semeru-fallback',
    name: 'Open Trip Semeru Mahameru 3D2N Ranu Kumbolo',
    slug: 'open-trip-semeru-mahameru-3d2n',
    tripType: 'OPEN_TRIP',
    difficulty: 'HARD',
    beginnerFriendly: false,
    duration: { days: 3, nights: 2 },
    mountain: { name: 'Gunung Semeru', slug: 'gunung-semeru', altitudeM: 3676 },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
      alt: 'Puncak Mahameru dan savana Oro-oro Ombo Semeru',
    },
    nextSchedule: {
      id: 'sch-3',
      startDate: '2026-10-24',
      endDate: '2026-10-26',
      capacity: 18,
      confirmedSeats: 10,
      availableSeats: 8,
      availabilityStatus: 'AVAILABLE',
      startingPrice: 1850000,
    },
  },
  {
    id: 'gede-fallback',
    name: 'Open Trip Gunung Gede Pangrango 2D1N Surya Kencana',
    slug: 'open-trip-gunung-gede-2d1n',
    tripType: 'OPEN_TRIP',
    difficulty: 'MODERATE',
    beginnerFriendly: true,
    duration: { days: 2, nights: 1 },
    mountain: { name: 'Gunung Gede', slug: 'gunung-gede', altitudeM: 2958 },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1200&auto=format&fit=crop',
      alt: 'Alun-alun Surya Kencana bunga edelweiss Gunung Gede',
    },
    nextSchedule: {
      id: 'sch-4',
      startDate: '2026-11-07',
      endDate: '2026-11-08',
      capacity: 20,
      confirmedSeats: 15,
      availableSeats: 5,
      availabilityStatus: 'AVAILABLE',
      startingPrice: 850000,
    },
  },
];

function formatIdr(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateRange(startDateStr?: string, endDateStr?: string) {
  if (!startDateStr) return 'Jadwal Reguler';
  const start = new Date(startDateStr);
  const end = endDateStr ? new Date(endDateStr) : null;
  const startDay = start.getDate();
  const startMonth = start.toLocaleDateString('id-ID', { month: 'short' });
  if (end) {
    const endDay = end.getDate();
    const endMonth = end.toLocaleDateString('id-ID', { month: 'short' });
    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  }
  return `${startDay} ${startMonth}`;
}

export function UpcomingTrips({ trips }: UpcomingTripsProps) {
  const displayTrips = trips && trips.length > 0 ? trips : FALLBACK_TRIPS;

  return (
    <section aria-label="Upcoming Trips" className="py-16 md:py-24">
      <div className="flex flex-col gap-8 md:gap-12">
        {/* Section Header */}
        <div className="flex flex-col items-center w-content-width mx-auto gap-3 text-center">
          <div className="px-3.5 py-1 text-xs font-semibold tracking-wider uppercase card rounded-full w-fit text-accent">
            Upcoming Trips
          </div>
          <h2 className="bg-gradient-to-r from-foreground to-primary-cta bg-clip-text text-transparent text-4xl md:text-6xl font-bold leading-tight text-balance">
            Jadwal Pendakian Terdekat
          </h2>
          <p className="max-w-2xl text-base md:text-lg leading-relaxed text-foreground/80 text-balance">
            Pilihan open trip dengan kepastian kuota berangkat. Dilengkapi guide
            bersertifikat dan logistik camp premium.
          </p>
        </div>

        {/* Trips Grid */}
        <div className="w-content-width mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayTrips.slice(0, 4).map((trip) => {
              const schedule = trip.nextSchedule;
              const dateRange = formatDateRange(
                schedule?.startDate,
                schedule?.endDate,
              );
              const priceText = schedule?.startingPrice
                ? formatIdr(schedule.startingPrice)
                : 'Hubungi Kami';
              const availableSeats = schedule?.availableSeats;
              const coverUrl =
                trip.coverImage?.url && trip.coverImage.url.trim() !== ''
                  ? trip.coverImage.url
                  : 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop';

              return (
                <div
                  key={trip.id}
                  className="flex flex-col h-full card rounded-3xl overflow-hidden group border border-black/5 hover:border-black/15 transition-all duration-300 shadow-sm hover:shadow-lg"
                >
                  {/* Trip Card Image & Badges */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverUrl}
                      alt={trip.coverImage?.alt || trip.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />

                    {/* Difficulty Badge Top-Left */}
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 text-2xs font-semibold rounded-full bg-black/60 backdrop-blur-sm text-white uppercase tracking-wider">
                        {trip.difficulty}
                      </span>
                      {trip.beginnerFriendly && (
                        <span className="px-2.5 py-1 text-2xs font-semibold rounded-full bg-emerald-600/90 backdrop-blur-sm text-white uppercase tracking-wider">
                          Pemula
                        </span>
                      )}
                    </div>

                    {/* Seat Availability Badge Bottom-Right */}
                    {availableSeats !== undefined && (
                      <div className="absolute bottom-3 right-3">
                        <span
                          className={`px-2.5 py-1 text-2xs font-bold rounded-full backdrop-blur-md text-white shadow ${
                            availableSeats <= 3
                              ? 'bg-amber-600/90'
                              : 'bg-black/60'
                          }`}
                        >
                          {availableSeats <= 3
                            ? `Sisa ${availableSeats} seat`
                            : `${availableSeats} seat tersisa`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Trip Content Body */}
                  <div className="flex flex-col flex-1 p-5 gap-3 justify-between">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs text-foreground/60 font-medium">
                        <span>
                          {trip.mountain.name} ({trip.mountain.altitudeM} mdpl)
                        </span>
                        <span>
                          {trip.duration.days}D{trip.duration.nights}N
                        </span>
                      </div>
                      <h3 className="text-lg font-bold leading-snug line-clamp-2 text-foreground group-hover:text-accent transition-colors">
                        {trip.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-semibold text-accent/90 mt-1">
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{dateRange}</span>
                      </div>
                    </div>

                    {/* Price & Detail CTA */}
                    <div className="pt-3 border-t border-foreground/10 flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-2xs uppercase tracking-wider text-foreground/60 block">
                          Mulai
                        </span>
                        <span className="text-base font-bold text-foreground">
                          {priceText}
                        </span>
                      </div>
                      <Link
                        href={`/trip/${trip.slug}`}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl primary-button text-primary-cta-text"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section Footer / View All Link */}
          <div className="mt-10 flex justify-center">
            <Link
              href="/trip"
              className="group inline-flex items-center justify-between gap-3 px-7 py-3 text-sm font-semibold rounded-xl secondary-button text-secondary-cta-text shadow-sm"
            >
              <span className="truncate md:transition-transform md:duration-300 md:ease-out md:group-hover:translate-x-2">
                Lihat Semua Jadwal Trip ({displayTrips.length}+)
              </span>
              <div className="size-5 flex items-center justify-center rounded-lg md:transition-all md:duration-300 md:ease-out md:group-hover:scale-[0.2] md:group-hover:rotate-90 primary-button text-primary-cta-text">
                <svg
                  className="size-3 md:transition-opacity md:duration-700 md:group-hover:opacity-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
