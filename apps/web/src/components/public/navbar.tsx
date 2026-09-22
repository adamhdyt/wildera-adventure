'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  buildGlobalWhatsAppMessage,
  buildWhatsAppUrl,
  trackWhatsAppClick,
} from '@/lib/whatsapp';

interface NavbarProps {
  whatsappNumber?: string;
}

export function Navbar({ whatsappNumber = '6281234567890' }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const waUrl = buildWhatsAppUrl(whatsappNumber, buildGlobalWhatsAppMessage());

  return (
    <>
      <nav
        data-section="navbar"
        className="fixed z-50 top-5 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-6xl"
      >
        <div className="flex items-center justify-between p-2 md:px-4 md:py-3 rounded-2xl backdrop-blur-md card border border-white/10 shadow-lg">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 pl-2 hover:opacity-85 transition-opacity"
            aria-label="Wildera Adventure"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="Wildera Logo"
              className="w-7 h-7 rounded-md object-cover border border-white/20"
            />
            <span className="text-lg font-bold tracking-wider uppercase text-foreground font-display">
              Wildera
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7">
            <Link
              href="/trip"
              className="relative text-sm font-medium text-foreground/90 hover:text-foreground transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-current after:scale-x-0 after:origin-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-left"
            >
              Explore Trip
            </Link>
            <Link
              href="/gunung"
              className="relative text-sm font-medium text-foreground/90 hover:text-foreground transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-current after:scale-x-0 after:origin-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-left"
            >
              Destinasi
            </Link>
            <Link
              href="/private-trip"
              className="relative text-sm font-medium text-foreground/90 hover:text-foreground transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-current after:scale-x-0 after:origin-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-left"
            >
              Private Trip
            </Link>
            <Link
              href="/tentang"
              className="relative text-sm font-medium text-foreground/90 hover:text-foreground transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-current after:scale-x-0 after:origin-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-left"
            >
              Tentang Wildera
            </Link>
            <Link
              href="/faq"
              className="relative text-sm font-medium text-foreground/90 hover:text-foreground transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-current after:scale-x-0 after:origin-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-left"
            >
              FAQ
            </Link>
          </div>

          {/* Desktop Right CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackWhatsAppClick('click_global_whatsapp', {
                  source: 'navbar_desktop',
                })
              }
              className="flex items-center justify-center h-10 px-5 text-sm font-medium rounded-xl cursor-pointer primary-button text-primary-cta-text shadow-sm"
            >
              Hubungi WhatsApp
            </a>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackWhatsAppClick('click_global_whatsapp', {
                  source: 'navbar_mobile',
                })
              }
              className="px-3 py-1.5 text-xs font-semibold rounded-lg primary-button text-primary-cta-text"
              aria-label="WhatsApp"
            >
              WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-foreground hover:bg-black/5 transition-colors"
              aria-label="Menu navigasi"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 p-4 rounded-2xl backdrop-blur-xl card border border-white/20 shadow-xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <Link
              href="/trip"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-foreground hover:bg-black/5"
            >
              Explore Trip
            </Link>
            <Link
              href="/gunung"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-foreground hover:bg-black/5"
            >
              Destinasi
            </Link>
            <Link
              href="/private-trip"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-foreground hover:bg-black/5"
            >
              Private Trip
            </Link>
            <Link
              href="/tentang"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-foreground hover:bg-black/5"
            >
              Tentang Wildera
            </Link>
            <Link
              href="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-foreground hover:bg-black/5"
            >
              FAQ
            </Link>
            <hr className="border-t border-foreground/10 my-1" />
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackWhatsAppClick('click_global_whatsapp', {
                  source: 'navbar_mobile_menu',
                })
              }
              className="w-full text-center py-2.5 rounded-xl text-sm font-semibold primary-button text-primary-cta-text"
            >
              Hubungi via WhatsApp
            </a>
          </div>
        )}
      </nav>
    </>
  );
}
