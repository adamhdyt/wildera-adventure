'use client';

import { usePathname } from 'next/navigation';
import {
  buildGlobalWhatsAppMessage,
  buildWhatsAppUrl,
  trackWhatsAppClick,
} from '@/lib/whatsapp';

interface FloatingWhatsAppProps {
  whatsappNumber?: string;
}

export function FloatingWhatsApp({
  whatsappNumber = '6281234567890',
}: FloatingWhatsAppProps) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) return null;

  const message = buildGlobalWhatsAppMessage();
  const waUrl = buildWhatsAppUrl(whatsappNumber, message);

  const handleClick = () => {
    trackWhatsAppClick('click_global_whatsapp', {
      source: 'floating_button',
    });
  };

  return (
    <aside
      aria-label="Floating WhatsApp"
      className="fixed bottom-24 lg:bottom-8 right-5 z-30 flex items-center group"
    >
      <div className="hidden md:flex items-center mr-3 px-3 py-1.5 bg-card/90 backdrop-blur-md border border-border/80 rounded-full shadow-lg text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <span>Tanya Wildera</span>
      </div>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        aria-label="Hubungi Wildera via WhatsApp"
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 border-2 border-white/20"
      >
        <svg
          className="w-7 h-7 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.35.49 1.199.533 1.286.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z" />
        </svg>
      </a>
    </aside>
  );
}
