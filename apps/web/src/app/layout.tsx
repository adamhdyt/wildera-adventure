import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { FloatingWhatsApp } from '@/components/public/floating-whatsapp';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://wildera.id',
  ),
  title: {
    default: 'Wildera Adventure | Ekspedisi & Open Trip Gunung Indonesia',
    template: '%s | Wildera Adventure',
  },
  description:
    'Layanan open trip dan private trip mendaki gunung di Indonesia dengan standar keselamatan medis, pemandu bersertifikat, dan logistik camp premium.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable}`}
    >
      <body>
        {children}
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
