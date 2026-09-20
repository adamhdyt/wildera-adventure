'use client';

import { useMemo, useState } from 'react';
import type { PublicMountainSummary } from '@wildera/types';
import { MountainCard } from './mountain-card';

interface MountainDirectoryClientProps {
  initialMountains: PublicMountainSummary[];
}

export function MountainDirectoryClient({
  initialMountains,
}: MountainDirectoryClientProps) {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sortBy, setSortBy] = useState<'altitude' | 'name'>('altitude');

  const filteredMountains = useMemo(() => {
    let list = [...initialMountains];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.destination?.name.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q),
      );
    }

    // Difficulty filter
    if (difficulty) {
      list = list.filter((m) => m.defaultDifficulty === difficulty);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'id');
      }
      return (b.altitudeM || 0) - (a.altitudeM || 0);
    });

    return list;
  }, [initialMountains, search, difficulty, sortBy]);

  const handleReset = () => {
    setSearch('');
    setDifficulty('');
    setSortBy('altitude');
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-6 rounded card border border-border/40 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama gunung atau wilayah..."
            aria-label="Cari gunung"
            className="w-full pl-10 pr-4 py-2.5 rounded bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* Difficulty selector */}
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            aria-label="Filter tingkat kesulitan"
            className="px-3 py-2.5 rounded bg-background border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent"
          >
            <option value="">Semua Tingkat</option>
            <option value="EASY">Santai (Easy)</option>
            <option value="MODERATE">Sedang (Moderate)</option>
            <option value="HARD">Menantang (Hard)</option>
            <option value="EXTREME">Ekstrem (Extreme)</option>
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'altitude' | 'name')}
            aria-label="Urutkan gunung"
            className="px-3 py-2.5 rounded bg-background border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent"
          >
            <option value="altitude">Elevasi Tertinggi</option>
            <option value="name">Nama (A-Z)</option>
          </select>

          {(search || difficulty) && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold text-accent hover:underline shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results Header / Counter */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {filteredMountains.length} Gunung terdaftar
        </span>
      </div>

      {/* Grid or Empty State */}
      {filteredMountains.length > 0 ? (
        <div
          data-testid="mountain-directory-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredMountains.map((mountain) => (
            <MountainCard key={mountain.id} mountain={mountain} />
          ))}
        </div>
      ) : (
        <div
          data-testid="mountain-empty-state"
          className="p-12 text-center rounded card border border-border/40 flex flex-col items-center gap-3 max-w-md mx-auto my-8"
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h4 className="text-base font-serif font-bold text-foreground">
            Gunung tidak ditemukan
          </h4>
          <p className="text-xs text-muted-foreground">
            Tidak ada gunung yang cocok dengan kriteria pencarianmu. Coba ganti
            kata kunci atau reset filter.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-2 px-4 py-2 rounded bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors"
          >
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
}
