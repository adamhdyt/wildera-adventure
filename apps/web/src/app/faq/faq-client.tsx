'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { PublicFaq } from '@wildera/types';

interface FaqClientProps {
  initialFaqs: PublicFaq[];
  whatsappNumber: string;
}

export function FaqClient({ initialFaqs, whatsappNumber }: FaqClientProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [openIndices, setOpenIndices] = useState<Record<number, boolean>>({
    0: true, // open first by default
  });

  const categories = [
    'ALL',
    ...Array.from(new Set(initialFaqs.map((f) => f.category).filter(Boolean))),
  ] as string[];

  const filteredFaqs = initialFaqs.filter((f) => {
    if (selectedCategory !== 'ALL' && f.category !== selectedCategory) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function toggleIndex(idx: number) {
    setOpenIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }

  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    'Halo Admin Wildera Adventure, saya ingin bertanya seputar trip...',
  )}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-36 pb-16 md:pb-24">
      {/* Hero Heading */}
      <div className="text-center mb-12">
        <span className="inline-block px-3.5 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-accent/10 text-accent mb-3">
          Pusat Bantuan & Tanya Jawab
        </span>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
          Frequently Asked Questions (FAQ)
        </h1>
        <p className="mt-4 text-base md:text-lg text-foreground/75 max-w-2xl mx-auto">
          Temukan jawaban atas pertanyaan umum seputar persiapan pendakian, alur
          booking, logistik, dan fasilitas open trip Wildera Adventure.
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-xl mx-auto relative">
          <input
            type="text"
            placeholder="Cari pertanyaan... (misal: booking, pemula, simaksi, sop buah)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 py-3.5 rounded-2xl border border-black/15 bg-card shadow-xs text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Category Badges */}
        {categories.length > 1 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selectedCategory === cat
                    ? 'bg-accent text-white shadow-xs'
                    : 'bg-black/5 text-foreground/70 hover:bg-black/10'
                }`}
              >
                {cat === 'ALL' ? 'Semua Pertanyaan' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Accordion FAQ List */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-black/15 bg-card">
            <p className="text-foreground/70 text-sm">
              Tidak ada pertanyaan yang sesuai dengan pencarian &quot;{search}
              &quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
              }}
              className="mt-4 text-xs font-semibold text-accent hover:underline"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = !!openIndices[idx];
            return (
              <div
                key={faq.id || idx}
                className="rounded-2xl border border-black/10 bg-card overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-black/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    {faq.category && (
                      <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-black/5 text-foreground/70">
                        {faq.category}
                      </span>
                    )}
                    <span className="font-semibold text-base text-foreground">
                      {faq.question}
                    </span>
                  </div>
                  <span
                    className={`transform transition-transform text-foreground/50 text-xl font-mono ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  >
                    ▾
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-foreground/80 leading-relaxed border-t border-black/5 whitespace-pre-line">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Direct Contact CTA */}
      <div className="mt-16 p-8 rounded-3xl bg-card border border-black/10 text-center space-y-4 shadow-sm">
        <h3 className="text-xl font-bold text-foreground">
          Masih Memiliki Pertanyaan Lain?
        </h3>
        <p className="text-sm text-foreground/75 max-w-lg mx-auto">
          Tim Customer Care Wildera Adventure siap menjawab pertanyaanmu seputar
          kuota pendakian, rekomendasi gunung untuk pemula, hingga konsultasi
          kesehatan fisik.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-xs"
          >
            Chat WhatsApp Admin
          </a>
          <Link
            href="/private-trip"
            className="px-6 py-3 rounded-xl border border-black/15 hover:bg-black/5 font-semibold text-sm transition-colors"
          >
            Konsultasi Private Trip
          </Link>
        </div>
      </div>
    </div>
  );
}
