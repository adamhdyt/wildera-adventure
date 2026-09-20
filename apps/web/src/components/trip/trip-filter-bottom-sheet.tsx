'use client';

import { useEffect } from 'react';

interface FilterState {
  search: string;
  month: string;
  type: string;
  difficulty: string;
  availability: string;
  sort: string;
  order: string;
}

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onReset: () => void;
  activeFilterCount: number;
}

const MONTH_OPTIONS = [
  { value: '', label: 'Semua Bulan' },
  { value: '2026-09', label: 'September 2026' },
  { value: '2026-10', label: 'Oktober 2026' },
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-12', label: 'Desember 2026' },
  { value: '2027-01', label: 'Januari 2027' },
];

const TRIP_TYPE_OPTIONS = [
  { value: '', label: 'Semua Tipe' },
  { value: 'OPEN_TRIP', label: 'Open Trip' },
  { value: 'PRIVATE_TRIP', label: 'Private Trip' },
];

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Semua Tingkat' },
  { value: 'EASY', label: 'Santai (Easy)' },
  { value: 'MODERATE', label: 'Sedang (Moderate)' },
  { value: 'HARD', label: 'Menantang (Hard)' },
  { value: 'EXTREME', label: 'Ekstrem (Extreme)' },
];

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'AVAILABLE', label: 'Masih Tersedia' },
  { value: 'ALMOST_FULL', label: 'Hampir Penuh' },
];

export function TripFilterBottomSheet({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onReset,
  activeFilterCount,
}: FilterBottomSheetProps) {
  // Prevent body scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filter bottom sheet"
      className="fixed inset-0 z-1050 flex flex-col justify-end lg:hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative z-10 w-full max-h-[85vh] flex flex-col bg-background rounded-t-3xl border-t border-border/60 shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Pull Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-foreground">Filter Trip</h3>
            {activeFilterCount > 0 && (
              <span
                data-testid="bottom-sheet-active-filter-badge"
                className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent text-white"
              >
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup filter"
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none"
          >
            <svg
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Month Filter */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Bulan Keberangkatan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MONTH_OPTIONS.map((opt) => {
                const isSelected = filters.month === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onFilterChange({ month: opt.value })}
                    className={`px-3 py-2.5 text-xs font-semibold rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'bg-accent text-white border-accent'
                        : 'bg-card text-foreground border-border/60 hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trip Type Filter */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Tipe Perjalanan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TRIP_TYPE_OPTIONS.map((opt) => {
                const isSelected = filters.type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onFilterChange({ type: opt.value })}
                    className={`px-3 py-2.5 text-xs font-semibold rounded-lg border text-center transition-colors ${
                      isSelected
                        ? 'bg-accent text-white border-accent'
                        : 'bg-card text-foreground border-border/60 hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Tingkat Kesulitan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const isSelected = filters.difficulty === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onFilterChange({ difficulty: opt.value })}
                    className={`px-3 py-2.5 text-xs font-semibold rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'bg-accent text-white border-accent'
                        : 'bg-card text-foreground border-border/60 hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Availability Filter */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Ketersediaan Kuota
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABILITY_OPTIONS.map((opt) => {
                const isSelected = filters.availability === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onFilterChange({ availability: opt.value })}
                    className={`px-3 py-2.5 text-xs font-semibold rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'bg-accent text-white border-accent'
                        : 'bg-card text-foreground border-border/60 hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-border/40 flex items-center gap-3 bg-background">
          <button
            type="button"
            onClick={onReset}
            className="w-1/3 py-3 text-sm font-semibold rounded-xl border border-border/60 text-foreground hover:bg-muted focus:outline-none"
          >
            Reset Semua
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-2/3 py-3 text-sm font-semibold rounded-xl primary-button focus:outline-none"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
}
