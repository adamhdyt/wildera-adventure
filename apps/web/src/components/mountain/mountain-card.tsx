import Link from 'next/link';
import type { PublicMountainSummary } from '@wildera/types';

interface MountainCardProps {
  mountain: PublicMountainSummary;
}

const FALLBACK_MOUNTAIN_COVER =
  'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80';

const DIFFICULTY_MAP: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  EASY: {
    label: 'Santai (Easy)',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    dotClass: 'bg-emerald-500',
  },
  MODERATE: {
    label: 'Sedang (Moderate)',
    badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    dotClass: 'bg-amber-500',
  },
  HARD: {
    label: 'Menantang (Hard)',
    badgeClass: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    dotClass: 'bg-orange-500',
  },
  EXTREME: {
    label: 'Ekstrem (Extreme)',
    badgeClass: 'bg-red-500/10 text-red-700 border-red-500/20',
    dotClass: 'bg-red-500',
  },
};

export function MountainCard({ mountain }: MountainCardProps) {
  const coverUrl = mountain.coverImage?.url || FALLBACK_MOUNTAIN_COVER;
  const diffConfig = DIFFICULTY_MAP[mountain.defaultDifficulty] ?? {
    label: 'Sedang (Moderate)',
    badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    dotClass: 'bg-amber-500',
  };

  return (
    <article
      data-testid="mountain-card"
      data-mountain-slug={mountain.slug}
      className="group flex flex-col rounded overflow-hidden border border-border/40 bg-card hover:border-accent/40 transition-all duration-300 hover:shadow-lg"
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={mountain.coverImage?.alt || mountain.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Altitude badge top-left */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded text-xs font-mono font-medium border border-white/20 flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          <span>{mountain.altitudeM.toLocaleString('id-ID')} mdpl</span>
        </div>

        {/* Difficulty badge top-right */}
        <div
          className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[11px] font-semibold border backdrop-blur-sm ${diffConfig.badgeClass} bg-black/60`}
        >
          {diffConfig.label}
        </div>

        {/* Destination bottom-left */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 text-white/90 text-xs font-medium">
          <svg
            className="w-3.5 h-3.5 text-amber-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="truncate">{mountain.destination?.name}</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div>
          <h3 className="text-xl font-serif font-bold text-foreground group-hover:text-accent transition-colors leading-tight">
            Gunung {mountain.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Puncak atap kepulauan dengan lanskap panorama spektakuler.
          </p>
        </div>

        {/* Action Link */}
        <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Panduan & Jalur
          </span>
          <Link
            href={`/gunung/${mountain.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
          >
            <span>Lihat Detail</span>
            <svg
              className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
