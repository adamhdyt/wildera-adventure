'use client';

import Link from 'next/link';
import {
  buildGlobalWhatsAppMessage,
  buildWhatsAppUrl,
  trackWhatsAppClick,
} from '@/lib/whatsapp';

interface FooterProps {
  siteName?: string;
  whatsappNumber?: string;
  email?: string;
  instagramHandle?: string;
}

export function Footer({
  whatsappNumber = '6281234567890',
  email = 'info@wildera.id',
  instagramHandle = '@wildera.adventure',
}: FooterProps) {
  const waUrl = buildWhatsAppUrl(whatsappNumber, buildGlobalWhatsAppMessage());

  return (
    <footer
      aria-label="Site footer"
      className="relative w-full pt-12 md:pt-16 pb-12"
      data-section="footer"
    >
      <div className="w-content-width mx-auto px-6 sm:px-8 md:px-12 py-10 md:py-12 rounded-3xl card border border-border/40 shadow-sm">
        {/* Main Navigation Grid */}
        <div className="footer-grid pb-10 text-sm">
          {/* Column 1: Brand & Identity */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt="Wildera Logo"
                className="w-10 h-10 rounded-lg object-cover border border-white/15 group-hover:border-accent/40 transition-colors shadow-sm"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-wider uppercase text-foreground leading-tight font-display">
                  Wildera
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase leading-none font-display">
                  Adventure
                </span>
              </div>
            </Link>

            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Penyelenggara ekspedisi & open trip gunung Indonesia dengan
              standar keselamatan medis terdepan, pendampingan guide berlisensi
              APGI, dan logistik camp premium.
            </p>

            <div className="flex items-center gap-2 text-2xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-accent" />
              <span>Leave No Trace · APGI Certified</span>
            </div>
          </div>

          {/* Column 2: Navigasi Utama */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Navigasi
            </h4>
            <Link
              href="/trip"
              className="text-xs md:text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Explore Trip
            </Link>
            <Link
              href="/gunung"
              className="text-xs md:text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Destinasi Gunung
            </Link>
            <Link
              href="/private-trip"
              className="text-xs md:text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Private Trip Eksklusif
            </Link>
            <Link
              href="/tentang"
              className="text-xs md:text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Tentang Kami
            </Link>
            <Link
              href="/faq"
              className="text-xs md:text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              FAQ & Panduan
            </Link>
          </div>

          {/* Column 3: Kebijakan & Legal */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Kebijakan
            </h4>
            <Link
              href="/terms"
              className="text-xs md:text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Syarat & Ketentuan
            </Link>
            <Link
              href="/privacy"
              className="text-xs md:text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="/cancellation"
              className="text-xs md:text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Kebijakan Pembatalan
            </Link>
            <Link
              href="/safety"
              className="text-xs md:text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Standar Keselamatan (SOP)
            </Link>
          </div>

          {/* Column 4: Kontak & Bantuan */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Kontak
            </h4>
            <div className="flex flex-col gap-2.5 text-xs md:text-sm text-muted-foreground">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackWhatsAppClick('click_global_whatsapp', {
                    source: 'footer',
                  })
                }
                className="hover:text-accent transition-colors flex items-center gap-2 font-medium text-foreground group"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20">
                  <svg
                    className="size-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <span>+{whatsappNumber}</span>
              </a>

              <a
                href={`mailto:${email}`}
                className="hover:text-accent transition-colors"
              >
                {email}
              </a>

              <span>Instagram: {instagramHandle}</span>

              <p className="text-2xs text-muted-foreground/80 pt-1 border-t border-border/20">
                Basecamp: Jakarta & Lombok · Layanan: 08.00–21.00 WIB
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row gap-4 items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 Wildera Adventure. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
