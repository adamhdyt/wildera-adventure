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
  siteName = 'Wildera',
  whatsappNumber = '6281234567890',
  email = 'info@wildera.id',
  instagramHandle = '@wildera.adventure',
}: FooterProps) {
  const waUrl = buildWhatsAppUrl(whatsappNumber, buildGlobalWhatsAppMessage());

  return (
    <footer
      aria-label="Site footer"
      className="relative w-full pt-16 pb-12"
      data-section="footer"
    >
      <div className="flex flex-col w-content-width mx-auto px-6 md:px-12 py-10 rounded-3xl card border border-black/5 shadow-md">
        {/* Massive Brand Title */}
        <div className="w-full min-w-0 flex-1 py-4 md:py-8 overflow-hidden select-none">
          <span className="block whitespace-nowrap font-bold text-foreground/90 tracking-tight uppercase text-[15vw] leading-[0.8]">
            {siteName}
          </span>
        </div>

        {/* Divider line */}
        <div className="h-px w-full my-8 bg-foreground/15" />

        {/* Navigation & Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-foreground/80 text-sm">
          {/* Column 1: About */}
          <div className="flex flex-col gap-3">
            <h4 className="text-base font-bold text-foreground">
              Tentang Wildera
            </h4>
            <p className="text-xs md:text-sm leading-relaxed text-foreground/75">
              Operator ekspedisi dan perjalanan pendakian gunung di Indonesia
              yang mengedepankan keamanan medis, tim bersertifikat, dan
              kenyamanan logistik premium.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-base font-bold text-foreground">
              Navigasi Utama
            </h4>
            <Link href="/trip" className="hover:text-accent transition-colors">
              Explore Trip
            </Link>
            <Link
              href="/destinasi"
              className="hover:text-accent transition-colors"
            >
              Destinasi Gunung
            </Link>
            <Link
              href="/private-trip"
              className="hover:text-accent transition-colors"
            >
              Private Trip Eksklusif
            </Link>
            <Link
              href="/tentang"
              className="hover:text-accent transition-colors"
            >
              Tentang Kami
            </Link>
            <Link href="/faq" className="hover:text-accent transition-colors">
              FAQ & Panduan
            </Link>
          </div>

          {/* Column 3: Legal & Policies */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-base font-bold text-foreground">
              Kebijakan & Legal
            </h4>
            <Link href="/terms" className="hover:text-accent transition-colors">
              Syarat & Ketentuan
            </Link>
            <Link
              href="/privacy"
              className="hover:text-accent transition-colors"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="/cancellation"
              className="hover:text-accent transition-colors"
            >
              Kebijakan Pembatalan
            </Link>
            <Link
              href="/safety"
              className="hover:text-accent transition-colors"
            >
              Standar Keselamatan (SOP)
            </Link>
          </div>

          {/* Column 4: Contact */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-base font-bold text-foreground">
              Hubungi Kami
            </h4>
            <p className="text-xs text-foreground/75">
              Basecamp Operasional: Jakarta & Lombok, Indonesia
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackWhatsAppClick('click_global_whatsapp', {
                  source: 'footer',
                })
              }
              className="text-xs hover:text-accent transition-colors flex items-center gap-1.5"
            >
              <span>WhatsApp: +{whatsappNumber}</span>
            </a>
            <a
              href={`mailto:${email}`}
              className="text-xs hover:text-accent transition-colors"
            >
              Email: {email}
            </a>
            <span className="text-xs text-foreground/75">
              Instagram: {instagramHandle}
            </span>
          </div>
        </div>

        {/* Bottom copyright & social */}
        <div className="h-px w-full mb-6 bg-foreground/10" />
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between text-xs text-foreground/60">
          <span>
            © 2026 Wildera Adventure. All rights reserved. Crafted for outdoor
            enthusiasts.
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="hover:underline opacity-60 hover:opacity-100"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
