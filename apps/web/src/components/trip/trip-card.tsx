import Link from 'next/link';
import type { PublicTripSummary } from '@wildera/types';

interface TripCardProps {
  trip: PublicTripSummary;
}

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateRange(startDateStr?: string, endDateStr?: string): string {
  if (!startDateStr) return 'Jadwal Reguler Terbuka';
  try {
    const s = new Date(startDateStr);
    const e = endDateStr ? new Date(endDateStr) : null;
    const startDay = s.getDate();
    const startMonth = s.toLocaleDateString('id-ID', { month: 'short' });
    const startYear = s.getFullYear();

    if (!e || isNaN(e.getTime())) {
      return `${startDay} ${startMonth} ${startYear}`;
    }

    const endDay = e.getDate();
    const endMonth = e.toLocaleDateString('id-ID', { month: 'short' });
    const endYear = e.getFullYear();

    if (startMonth === endMonth && startYear === endYear) {
      return `${startDay}–${endDay} ${startMonth} ${startYear}`;
    }
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`;
  } catch {
    return startDateStr;
  }
}

export function TripCard({ trip }: TripCardProps) {
  const coverUrl =
    trip.coverImage?.url && trip.coverImage.url.trim() !== ''
      ? trip.coverImage.url
      : FALLBACK_COVER;

  const schedule = trip.nextSchedule;
  const availableSeats = schedule?.availableSeats;
  const startingPrice = schedule?.startingPrice || 0;

  // Seat display per UX spec section 24: Avoid false urgency
  let seatBadge = null;
  if (schedule) {
    if (availableSeats !== undefined && availableSeats <= 0) {
      seatBadge = (
        <span className="px-2.5 py-1 text-xs font-semibold rounded bg-red-100 text-red-700 border border-red-200">
          Sold Out
        </span>
      );
    } else if (availableSeats !== undefined && availableSeats <= 3) {
      seatBadge = (
        <span className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-200">
          Tersisa {availableSeats} seat
        </span>
      );
    } else if (availableSeats !== undefined) {
      seatBadge = (
        <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
          {availableSeats} seat tersedia
        </span>
      );
    }
  }

  const difficultyLabels: Record<string, { label: string; color: string }> = {
    EASY: {
      label: 'Santai (Easy)',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    MODERATE: {
      label: 'Moderate',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    HARD: {
      label: 'Menantang (Hard)',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
    },
    EXTREME: {
      label: 'Ekstrem',
      color: 'bg-red-50 text-red-800 border-red-200',
    },
  };

  const diffConfig = difficultyLabels[trip.difficulty] || {
    label: trip.difficulty,
    color: 'bg-stone-100 text-stone-800 border-stone-200',
  };

  return (
    <article
      data-testid={`trip-card-${trip.slug}`}
      className="flex flex-col h-full card rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 group border border-border/40"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={trip.coverImage?.alt || trip.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="px-2.5 py-1 text-xs font-bold tracking-wider uppercase rounded backdrop-blur-md bg-foreground/80 text-background shadow">
            {trip.tripType === 'OPEN_TRIP' ? 'Open Trip' : 'Private Trip'}
          </span>
          {seatBadge}
        </div>

        {/* Altitude Pill if available */}
        {trip.mountain?.altitudeM && (
          <div className="absolute bottom-2.5 right-3 pointer-events-none">
            <span className="px-2 py-0.5 text-xs font-medium rounded backdrop-blur-md bg-background/85 text-foreground shadow-sm">
              {trip.mountain.altitudeM.toLocaleString('id-ID')} mdpl
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-4 md:p-5 justify-between gap-4">
        <div className="flex flex-col gap-2">
          {/* Mountain Context */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <svg
              className="size-3.5 text-accent shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 19.5l7.5-15 7.5 15M9 13.5l3-3 3 3"
              />
            </svg>
            <span>{trip.mountain?.name || 'Pegunungan Indonesia'}</span>
          </div>

          {/* Trip Title */}
          <h3 className="text-xl font-bold text-foreground leading-snug group-hover:text-accent transition-colors line-clamp-2">
            <Link href={`/trip/${trip.slug}`} className="focus:outline-none">
              {trip.name}
            </Link>
          </h3>

          {/* Schedule & Duration Info */}
          <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg
                className="size-3.5 shrink-0 text-accent/70"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
              <span className="font-medium text-foreground">
                {formatDateRange(schedule?.startDate, schedule?.endDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="size-3.5 shrink-0 text-accent/70"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {trip.duration.days} Hari {trip.duration.nights} Malam
              </span>
            </div>
          </div>

          {/* Difficulty & Beginner Friendly Tag */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded border ${diffConfig.color}`}
            >
              {diffConfig.label}
            </span>
            {trip.beginnerFriendly && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-teal-50 text-teal-800 border border-teal-200">
                Ramah Pemula
              </span>
            )}
          </div>
        </div>

        {/* Footer: Price & CTA */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Mulai dari
            </span>
            <span className="text-lg font-bold text-foreground">
              {startingPrice > 0 ? formatRupiah(startingPrice) : 'Hubungi Kami'}
            </span>
          </div>

          <Link
            href={`/trip/${trip.slug}`}
            className="px-4 py-2 text-xs font-semibold rounded primary-button transition-transform active:scale-95 shrink-0"
          >
            Lihat Detail
          </Link>
        </div>
      </div>
    </article>
  );
}
