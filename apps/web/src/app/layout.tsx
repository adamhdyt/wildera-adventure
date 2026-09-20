import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { FloatingWhatsApp } from '@/components/public/floating-whatsapp';

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
    <html lang="id">
      <body>
        {children}
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
