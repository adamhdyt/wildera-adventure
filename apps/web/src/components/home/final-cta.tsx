'use client';

import Link from 'next/link';
import {
  buildGlobalWhatsAppMessage,
  buildWhatsAppUrl,
  trackWhatsAppClick,
} from '@/lib/whatsapp';

interface FinalCtaProps {
  whatsappNumber?: string;
}

export function FinalCta({ whatsappNumber = '6281234567890' }: FinalCtaProps) {
  const waUrl = buildWhatsAppUrl(whatsappNumber, buildGlobalWhatsAppMessage());

  return (
    <section aria-label="Final CTA" className="py-20 md:py-28">
      <div className="w-content-width mx-auto">
        <div className="relative overflow-hidden rounded-3xl p-10 md:p-16 card border border-black/10 shadow-xl text-center flex flex-col items-center gap-6">
          {/* Ambient Glow */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-25 [background:radial-gradient(circle_at_center,var(--color-background-accent)_20%,transparent_65%)]"
          />

          <div className="relative z-10 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase card rounded-full w-fit text-accent">
            Mulai Petualangan
          </div>

          <h2 className="relative z-10 text-3xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-3xl text-foreground text-balance">
            Siap Menapaki Puncak Impianmu Bersama Wildera?
          </h2>

          <p className="relative z-10 max-w-xl text-base md:text-lg text-foreground/80 leading-relaxed text-balance">
            Ketinggian bukan lagi halangan ketika kamu didampingi tim
            berpengalaman. Amankan kuotamu sekarang dan jadilah bagian dari
            cerita di atas awan.
          </p>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 pt-2">
            <Link
              href="/trip"
              className="w-full sm:w-auto h-12 px-8 flex items-center justify-center text-sm font-semibold rounded-xl primary-button text-primary-cta-text hover:opacity-95 transition-opacity shadow-lg"
            >
              Jelajahi Semua Trip
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackWhatsAppClick('click_global_whatsapp', {
                  source: 'final_cta',
                })
              }
              className="w-full sm:w-auto h-12 px-8 flex items-center justify-center text-sm font-semibold rounded-xl secondary-button text-secondary-cta-text hover:opacity-95 transition-opacity shadow-sm"
            >
              Konsultasi via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
