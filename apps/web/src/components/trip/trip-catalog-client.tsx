'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PublicTripSummary } from '@wildera/types';
import { TripCard } from './trip-card';
import { TripFilterSidebar } from './trip-filter-sidebar';
import { TripFilterBottomSheet } from './trip-filter-bottom-sheet';
import {
  buildGlobalWhatsAppMessage,
  buildWhatsAppUrl,
  trackWhatsAppClick,
} from '@/lib/whatsapp';
import { trackViewTripList } from '@/lib/analytics';

interface TripCatalogClientProps {
  initialTrips: PublicTripSummary[];
  whatsappNumber?: string;
}

interface FilterState {
  search: string;
  month: string;
  type: string;
  difficulty: string;
  availability: string;
  sort: string;
  order: string;
}

const SORT_OPTIONS = [
  { value: 'startDate:asc', label: 'Keberangkatan Terdekat' },
  { value: 'price:asc', label: 'Harga: Terendah ke Tertinggi' },
  { value: 'price:desc', label: 'Harga: Tertinggi ke Terendah' },
  { value: 'createdAt:desc', label: 'Terbaru Ditambahkan' },
];

export function TripCatalogClient({
  initialTrips,
  whatsappNumber = '6281234567890',
}: TripCatalogClientProps) {
  const searchParams = useSearchParams();

  // Initialize filters from URL search params
  const [filters, setFilters] = useState<FilterState>(() => {
    const sortParam = searchParams.get('sort') || 'startDate';
    const orderParam = searchParams.get('order') || 'asc';
    return {
      search: searchParams.get('search') || '',
      month: searchParams.get('month') || '',
      type: searchParams.get('type') || '',
      difficulty: searchParams.get('difficulty') || '',
      availability: searchParams.get('availability') || '',
      sort: sortParam,
      order: orderParam,
    };
  });

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading] = useState(false);

  useEffect(() => {
    trackViewTripList();
  }, []);

  // Calculate active filter count (excluding default sort & empty search)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.month) count++;
    if (filters.type) count++;
    if (filters.difficulty) count++;
    if (filters.availability) count++;
    return count;
  }, [filters]);

  // Sync state and URL query params in an effect
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.month) params.set('month', filters.month);
    if (filters.type) params.set('type', filters.type);
    if (filters.difficulty) params.set('difficulty', filters.difficulty);
    if (filters.availability) params.set('availability', filters.availability);
    if (filters.sort && filters.sort !== 'startDate')
      params.set('sort', filters.sort);
    if (filters.order && filters.order !== 'asc')
      params.set('order', filters.order);

    const qs = params.toString();
    const nextUrl = qs ? `/trip?${qs}` : '/trip';
    window.history.replaceState(null, '', nextUrl);
  }, [filters]);

  const updateFilters = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleReset = () => {
    setFilters({
      search: '',
      month: '',
      type: '',
      difficulty: '',
      availability: '',
      sort: 'startDate',
      order: 'asc',
    });
  };

  // Filter and sort trips
  const filteredTrips = useMemo(() => {
    let result = [...initialTrips];

    // 1. Search filter
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.mountain?.name.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q),
      );
    }

    // 2. Month filter
    if (filters.month) {
      const [y, m] = filters.month.split('-');
      result = result.filter((t) => {
        if (!t.nextSchedule?.startDate) return false;
        const d = new Date(t.nextSchedule.startDate);
        return (
          d.getUTCFullYear() === Number(y) && d.getUTCMonth() + 1 === Number(m)
        );
      });
    }

    // 3. Trip Type filter
    if (filters.type) {
      result = result.filter((t) => t.tripType === filters.type);
    }

    // 4. Difficulty filter
    if (filters.difficulty) {
      result = result.filter((t) => t.difficulty === filters.difficulty);
    }

    // 5. Availability filter
    if (filters.availability) {
      result = result.filter(
        (t) => t.nextSchedule?.availabilityStatus === filters.availability,
      );
    }

    // 6. Sorting
    result.sort((a, b) => {
      if (filters.sort === 'price') {
        const priceA = a.nextSchedule?.startingPrice || 0;
        const priceB = b.nextSchedule?.startingPrice || 0;
        return filters.order === 'desc' ? priceB - priceA : priceA - priceB;
      }

      if (filters.sort === 'startDate') {
        const dateA = a.nextSchedule?.startDate
          ? new Date(a.nextSchedule.startDate).getTime()
          : Infinity;
        const dateB = b.nextSchedule?.startDate
          ? new Date(b.nextSchedule.startDate).getTime()
          : Infinity;
        return filters.order === 'desc' ? dateB - dateA : dateA - dateB;
      }

      return 0;
    });

    return result;
  }, [initialTrips, filters]);

  const waUrl = buildWhatsAppUrl(whatsappNumber, buildGlobalWhatsAppMessage());

  return (
    <div className="w-content-width mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Page Header */}
      <div className="flex flex-col gap-3 mb-8 md:mb-12">
        <div className="px-3.5 py-1 text-xs font-semibold rounded-full card border border-border/60 w-fit">
          <span>Katalog Pendakian</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight">
          Explore Trip
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
          Temukan jadwal perjalanan berikutnya ke puncak-puncak terindah di
          Indonesia. Terbuka untuk open trip dan private trip dengan kurasi
          aman.
        </p>
      </div>

      {/* Search & Mobile Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-8">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="search"
            data-testid="search-trip-input"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            placeholder="Cari nama gunung, trip, atau destinasi..."
            className="w-full pl-11 pr-4 py-3 text-sm rounded-xl card border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <svg
            className="size-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          {filters.search && (
            <button
              type="button"
              onClick={() => updateFilters({ search: '' })}
              aria-label="Hapus pencarian"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Mobile Filter Button */}
        <div className="flex items-center gap-2 lg:hidden mobile-filter-bar">
          <button
            type="button"
            data-testid="mobile-filter-button"
            onClick={() => setIsBottomSheetOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl card border border-border/60 font-semibold text-sm text-foreground hover:bg-muted"
          >
            <svg
              className="size-4 text-accent"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
              />
            </svg>
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span
                data-testid="mobile-active-filter-badge"
                className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent text-white"
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Layout: Sidebar + Trip Grid */}
      <div className="catalog-main-layout flex flex-col lg:flex-row gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <TripFilterSidebar
          filters={filters}
          onFilterChange={updateFilters}
          onReset={handleReset}
          activeFilterCount={activeFilterCount}
        />

        {/* Content Area */}
        <div className="flex-1 w-full flex flex-col gap-6">
          {/* Top Controls Bar: Counter & Sort Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span
                data-testid="trip-count-indicator"
                className="text-sm md:text-base font-bold text-foreground"
              >
                {filteredTrips.length} Trip ditemukan
              </span>
              {activeFilterCount > 0 && (
                <span className="hidden sm:inline-block text-xs text-muted-foreground">
                  (difilter)
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <label
                htmlFor="sort-select"
                className="text-xs font-medium text-muted-foreground shrink-0"
              >
                Urutkan:
              </label>
              <select
                id="sort-select"
                data-testid="sort-select"
                value={`${filters.sort}:${filters.order}`}
                onChange={(e) => {
                  const [s, o] = e.target.value.split(':');
                  updateFilters({ sort: s, order: o });
                }}
                className="text-xs md:text-sm py-2 px-3 rounded-lg card border border-border/60 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error State */}
          {hasError && (
            <div
              data-testid="error-state"
              className="p-8 text-center card rounded-2xl border border-red-200/60 bg-red-50/30 flex flex-col items-center gap-4 my-6"
            >
              <div className="p-3 rounded-full bg-red-100 text-red-700">
                <svg
                  className="size-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-lg font-bold text-foreground">
                  Gagal Memuat Jadwal Trip
                </h4>
                <p className="text-sm text-muted-foreground max-w-md">
                  Terjadi gangguan saat mengambil data dari server. Silakan coba
                  beberapa saat lagi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHasError(false)}
                className="px-5 py-2 text-xs font-semibold rounded primary-button"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div
              data-testid="loading-state"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="card rounded-2xl p-4 flex flex-col gap-4 animate-pulse border border-border/40"
                >
                  <div className="aspect-16/10 bg-muted/60 rounded-xl" />
                  <div className="h-4 bg-muted/60 rounded w-3/4" />
                  <div className="h-4 bg-muted/40 rounded w-1/2" />
                  <div className="h-10 bg-muted/50 rounded-xl mt-4" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State per UX spec section 25 */}
          {!isLoading && !hasError && filteredTrips.length === 0 && (
            <div
              data-testid="empty-state"
              className="p-10 md:p-16 text-center card rounded-2xl border border-border/50 flex flex-col items-center gap-5 my-6"
            >
              <div className="p-4 rounded-full bg-accent/10 text-accent">
                <svg
                  className="size-10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                  />
                </svg>
              </div>

              <div className="flex flex-col gap-2 max-w-md">
                <h4 className="text-2xl font-bold text-foreground">
                  Belum ada trip yang cocok.
                </h4>
                <p className="text-sm text-muted-foreground">
                  Coba ubah tanggal atau filter pencarianmu untuk melihat jadwal
                  pendakian lainnya.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                <button
                  type="button"
                  data-testid="empty-reset-button"
                  onClick={handleReset}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl card border border-border/60 text-foreground hover:bg-muted transition-colors"
                >
                  Reset Filter
                </button>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackWhatsAppClick('click_global_whatsapp', {
                      source: 'trip_catalog_empty_state',
                    })
                  }
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl primary-button"
                >
                  Hubungi Wildera
                </a>
              </div>
            </div>
          )}

          {/* Results Trip Cards Grid */}
          {!isLoading && !hasError && filteredTrips.length > 0 && (
            <div
              data-testid="trip-catalog-grid"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {filteredTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <TripFilterBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        filters={filters}
        onFilterChange={updateFilters}
        onReset={handleReset}
        activeFilterCount={activeFilterCount}
      />
    </div>
  );
}
