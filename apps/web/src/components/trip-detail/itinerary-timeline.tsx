'use client';

import { useState } from 'react';

interface ItineraryItem {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
}

interface ItineraryTimelineProps {
  itineraries: ItineraryItem[];
}

export function ItineraryTimeline({ itineraries }: ItineraryTimelineProps) {
  // Allow toggling specific days or expanded all
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({
    1: true,
  });

  const toggleDay = (day: number) => {
    setExpandedDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    itineraries.forEach((it) => {
      all[it.dayNumber] = true;
    });
    setExpandedDays(all);
  };

  const collapseAll = () => {
    setExpandedDays({});
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-2">
        <span>Rincian aktivitas per hari</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={expandAll}
            className="hover:text-accent transition-colors"
          >
            Buka Semua
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="hover:text-accent transition-colors"
          >
            Tutup Semua
          </button>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="relative border-l-2 border-accent/30 ml-3 pl-6 flex flex-col gap-6 py-2">
        {itineraries.map((it) => {
          const isExpanded = expandedDays[it.dayNumber] ?? false;

          return (
            <div
              key={it.id}
              data-testid={`itinerary-day-${it.dayNumber}`}
              className="relative flex flex-col gap-2"
            >
              {/* Dot marker */}
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-accent border-2 border-background ring-2 ring-accent/20" />

              {/* Day Header Accordion Trigger */}
              <button
                type="button"
                onClick={() => toggleDay(it.dayNumber)}
                className="flex items-start justify-between gap-4 text-left group"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                    Hari ke-{it.dayNumber}
                  </span>
                  <h4 className="text-base sm:text-lg font-serif font-bold text-foreground group-hover:text-accent transition-colors">
                    {it.title}
                  </h4>
                </div>
                <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted/30 group-hover:bg-muted shrink-0 transition-colors">
                  {isExpanded ? 'Tutup' : 'Buka'}
                </span>
              </button>

              {/* Day Description */}
              {isExpanded && (
                <div className="pt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed card p-4 rounded border border-border/30 animate-fadeIn">
                  <p className="whitespace-pre-line">{it.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
