'use client';

interface FilterState {
  search: string;
  month: string;
  type: string;
  difficulty: string;
  availability: string;
  sort: string;
  order: string;
}

interface FilterSidebarProps {
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

export function TripFilterSidebar({
  filters,
  onFilterChange,
  onReset,
  activeFilterCount,
}: FilterSidebarProps) {
  return (
    <aside
      aria-label="Filter sidebar"
      className="hidden lg:flex desktop-sidebar flex-col gap-6 p-6 card rounded border border-border/40 shrink-0 w-72 sticky top-28 h-fit"
    >
      {/* Header with Title, Count, & Reset Button */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-base text-foreground">Filter</h3>
          {activeFilterCount > 0 && (
            <span
              data-testid="desktop-active-filter-badge"
              className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent text-white"
            >
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-accent hover:underline focus:outline-none"
          >
            Reset Semua
          </button>
        )}
      </div>

      {/* Month Filter */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Bulan Keberangkatan
        </label>
        <div className="flex flex-col gap-1.5">
          {MONTH_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 text-sm cursor-pointer hover:text-accent select-none"
            >
              <input
                type="radio"
                name="desktop-month"
                checked={filters.month === opt.value}
                onChange={() => onFilterChange({ month: opt.value })}
                className="size-4 text-accent focus:ring-accent"
              />
              <span
                className={
                  filters.month === opt.value
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground'
                }
              >
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Trip Type Filter */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Tipe Perjalanan
        </label>
        <div className="flex flex-col gap-1.5">
          {TRIP_TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 text-sm cursor-pointer hover:text-accent select-none"
            >
              <input
                type="radio"
                name="desktop-type"
                checked={filters.type === opt.value}
                onChange={() => onFilterChange({ type: opt.value })}
                className="size-4 text-accent focus:ring-accent"
              />
              <span
                className={
                  filters.type === opt.value
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground'
                }
              >
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Tingkat Kesulitan
        </label>
        <div className="flex flex-col gap-1.5">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 text-sm cursor-pointer hover:text-accent select-none"
            >
              <input
                type="radio"
                name="desktop-difficulty"
                checked={filters.difficulty === opt.value}
                onChange={() => onFilterChange({ difficulty: opt.value })}
                className="size-4 text-accent focus:ring-accent"
              />
              <span
                className={
                  filters.difficulty === opt.value
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground'
                }
              >
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability Filter */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Ketersediaan Kuota
        </label>
        <div className="flex flex-col gap-1.5">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 text-sm cursor-pointer hover:text-accent select-none"
            >
              <input
                type="radio"
                name="desktop-availability"
                checked={filters.availability === opt.value}
                onChange={() => onFilterChange({ availability: opt.value })}
                className="size-4 text-accent focus:ring-accent"
              />
              <span
                className={
                  filters.availability === opt.value
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground'
                }
              >
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
