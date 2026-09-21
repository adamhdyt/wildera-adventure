'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { trackViewHome } from '@/lib/analytics';

interface HeroSlide {
  url: string;
  alt: string;
  caption: string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop',
    alt: 'Pemandangan puncak Gunung Rinjani dan Danau Segara Anak',
    caption: 'Gunung Rinjani, Nusa Tenggara Barat',
  },
  {
    url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2071&auto=format&fit=crop',
    alt: 'Samudra awan matahari terbit Gunung Prau Dieng',
    caption: 'Gunung Prau, Dataran Tinggi Dieng',
  },
  {
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop',
    alt: 'Kaldera dan savana Taman Nasional Bromo Tengger Semeru',
    caption: 'Bromo Tengger Semeru, Jawa Timur',
  },
  {
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop',
    alt: 'Gugusan pegunungan dan panorama alam bebas',
    caption: 'Atap Indonesia',
  },
];

const SLIDE_DURATION = 4500;

export function Hero() {
  const [activeIdx, setActiveIdx] = useState(0);
  const brandRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    trackViewHome();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % DEFAULT_SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [activeIdx]);

  return (
    <section
      aria-label="Hero section"
      className="relative w-full h-svh min-h-[600px] overflow-hidden flex flex-col justify-end mb-16 md:mb-24"
    >
      {/* Background Decorative Ambient Radial Gradients */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none mask-[linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]"
      >
        <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-9/10 md:w-6/10 aspect-square rounded-full opacity-20 [background:radial-gradient(circle_at_center,var(--color-background-accent)_35%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-9/10 md:w-6/10 aspect-square rounded-full opacity-20 [background:radial-gradient(circle_at_center,var(--color-background-accent)_35%,transparent_70%)]" />
      </div>

      {/* Background Slides */}
      {DEFAULT_SLIDES.map((slide, idx) => {
        const isActive = idx === activeIdx;
        return (
          <div
            key={slide.url}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-700 ${
              isActive
                ? 'opacity-100 z-0 scale-100'
                : 'opacity-0 pointer-events-none scale-105'
            } transition-transform ease-out duration-1000`}
          >
            {/* Dark overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.url}
              alt={slide.alt}
              className="min-h-0 absolute inset-0 w-full h-full object-cover rounded-none"
            />
          </div>
        );
      })}

      {/* Backdrop blur gradient overlay on lower half */}
      <div
        aria-hidden="true"
        className="absolute z-10 w-full h-[50svh] md:h-[70svh] left-0 bottom-0 backdrop-blur-md mask-[linear-gradient(to_bottom,transparent,black_60%)] pointer-events-none"
      />

      {/* Foreground Hero Content */}
      <div className="relative z-20 w-content-width mx-auto pb-6 md:pb-10">
        <div className="flex flex-col">
          {/* Tagline & Call-to-actions row */}
          <div className="w-full flex flex-col md:flex-row md:justify-between items-start md:items-end gap-5">
            <div className="w-full md:w-3/5 flex flex-col gap-2">
              <span className="inline-block text-xs md:text-sm font-semibold tracking-wider uppercase text-amber-200/90 drop-shadow">
                Wildera • Luxury & Expedition Mountain Journey
              </span>
              <p className="text-lg md:text-2xl text-balance font-normal text-white leading-snug drop-shadow-sm">
                Temukan perjalanan gunungmu. Open Trip & Private Trip ke
                berbagai gunung terbaik di Indonesia dengan standar keamanan
                tinggi dan kenyamanan maksimal.
              </p>
            </div>

            <div className="w-full md:w-2/5 flex justify-start md:justify-end">
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/trip"
                  className="group flex items-center justify-between gap-2 h-11 px-6 text-sm font-semibold rounded-xl cursor-pointer primary-button text-primary-cta-text hover:opacity-95 transition-all shadow-lg"
                >
                  <span className="truncate md:transition-transform md:duration-300 md:ease-out md:group-hover:translate-x-1">
                    Jelajahi Trip
                  </span>
                  <div className="size-6 flex items-center justify-center rounded-lg secondary-button text-secondary-cta-text">
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
                        d="M5 12h14m-7-7 7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>

                <Link
                  href="/private-trip"
                  className="group flex items-center justify-between gap-2 h-11 px-6 text-sm font-semibold rounded-xl cursor-pointer secondary-button text-secondary-cta-text hover:opacity-95 transition-all shadow-md"
                >
                  <span className="truncate md:transition-transform md:duration-300 md:ease-out md:group-hover:translate-x-1">
                    Private Trip
                  </span>
                  <div className="size-6 flex items-center justify-center rounded-lg primary-button text-primary-cta-text">
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
                        d="M5 12h14m-7-7 7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Massive Brand Headline */}
          <div className="w-full min-w-0 flex-1 py-4 md:py-8 overflow-hidden">
            <h1
              ref={brandRef}
              className="whitespace-nowrap font-bold text-white tracking-tight uppercase select-none text-[17vw] leading-[0.85] opacity-95"
            >
              Wildera
            </h1>
          </div>

          {/* Carousel Slide Progress Bars */}
          <div className="flex items-center gap-3 pt-2">
            {DEFAULT_SLIDES.map((slide, i) => {
              const isActive = i === activeIdx;
              const isPast = i < activeIdx;
              return (
                <button
                  key={slide.url}
                  type="button"
                  aria-label={`Lihat slide ${i + 1}: ${slide.caption}`}
                  onClick={() => setActiveIdx(i)}
                  className="relative h-1.5 flex-1 rounded-full overflow-hidden bg-white/25 cursor-pointer hover:bg-white/40 transition-colors"
                >
                  <div
                    className={`absolute inset-0 bg-white rounded-full origin-left ${
                      isActive
                        ? 'animate-progress'
                        : isPast
                          ? 'scale-x-100'
                          : 'scale-x-0'
                    }`}
                    style={{
                      animationDuration: `${SLIDE_DURATION}ms`,
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
