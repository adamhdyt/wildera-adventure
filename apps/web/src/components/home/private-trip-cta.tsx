'use client';

import Link from 'next/link';
import {
  buildPrivateTripWhatsAppMessage,
  buildWhatsAppUrl,
  trackWhatsAppClick,
} from '@/lib/whatsapp';

interface PrivateTripCtaProps {
  whatsappNumber?: string;
}

export function PrivateTripCta({
  whatsappNumber = '6281234567890',
}: PrivateTripCtaProps) {
  const waUrl = buildWhatsAppUrl(
    whatsappNumber,
    buildPrivateTripWhatsAppMessage(),
  );

  return (
    <section aria-label="Private Trip CTA" className="py-16 md:py-24">
      <div className="w-content-width mx-auto">
        <div className="relative overflow-hidden rounded-3xl p-8 md:p-14 card border border-black/10 shadow-lg">
          {/* Decorative ambient background */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 rounded-full opacity-20 pointer-events-none [background:radial-gradient(circle_at_center,var(--color-background-accent)_40%,transparent_70%)]"
          />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex flex-col gap-4 max-w-2xl">
              <div className="px-3.5 py-1 text-xs font-semibold tracking-wider uppercase card rounded-full w-fit text-accent">
                Eksklusif & Kustom
              </div>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight text-foreground text-balance">
                Punya Rombongan & Jadwal Sendiri?
              </h2>
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
                Rancang petualangan gunung impian bersama keluarga, rekan
                kantor, atau lingkaran sahabatmu. Tentukan tanggal
                keberangkatan, rute, fasilitas tenda private, hingga menu
                makanan sesuai preferensimu.
              </p>

              {/* Badges / Highlights */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/5 text-foreground/80">
                  ✓ Jadwal Fleksibel
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/5 text-foreground/80">
                  ✓ Dedicated Guide & Porter
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/5 text-foreground/80">
                  ✓ Custom Camp Logistics
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/5 text-foreground/80">
                  ✓ Private Transport
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
              <Link
                href="/private-trip"
                className="flex items-center justify-center h-12 px-7 text-sm font-semibold rounded-xl primary-button text-primary-cta-text shadow-md text-center"
              >
                Rencanakan Private Trip
              </Link>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackWhatsAppClick('click_global_whatsapp', {
                    source: 'private_trip_cta',
                  })
                }
                className="flex items-center justify-center h-12 px-7 text-sm font-semibold rounded-xl secondary-button text-secondary-cta-text shadow-sm text-center"
              >
                Konsultasi WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
