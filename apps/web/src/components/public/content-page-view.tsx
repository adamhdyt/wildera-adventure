import Link from 'next/link';
import type { PublicContentPage } from '../../lib/public-api';

interface ContentPageViewProps {
  page: PublicContentPage | null;
  fallbackTitle: string;
  fallbackSubtitle?: string;
  fallbackContent: string;
  currentSlug: string;
}

const POLICY_LINKS = [
  { href: '/tentang', label: 'Tentang Kami', slug: 'tentang' },
  { href: '/terms', label: 'Syarat & Ketentuan', slug: 'terms' },
  { href: '/privacy', label: 'Kebijakan Privasi', slug: 'privacy' },
  {
    href: '/cancellation',
    label: 'Kebijakan Pembatalan',
    slug: 'cancellation',
  },
  { href: '/safety', label: 'Standar Keselamatan', slug: 'safety' },
  { href: '/faq', label: 'Tanya Jawab (FAQ)', slug: 'faq' },
];

export function ContentPageView({
  page,
  fallbackTitle,
  fallbackSubtitle,
  fallbackContent,
  currentSlug,
}: ContentPageViewProps) {
  const title = page?.title || fallbackTitle;
  const content = page?.content || fallbackContent;
  const updatedAt = page?.updatedAt
    ? new Date(page.updatedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'September 2026';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-36 pb-16 md:pb-24">
      {/* Header Banner */}
      <div className="mb-10 pb-8 border-b border-black/10">
        <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/60 mb-3">
          <Link href="/" className="hover:underline">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-foreground/90 font-medium">Informasi</span>
          <span>/</span>
          <span className="text-accent font-semibold">{title}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          {title}
        </h1>
        {fallbackSubtitle && (
          <p className="text-base md:text-lg text-foreground/75 max-w-3xl">
            {fallbackSubtitle}
          </p>
        )}
        <div className="mt-4 text-xs text-foreground/50">
          Terakhir diperbarui: {updatedAt}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 p-5 rounded-2xl bg-card border border-black/10 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">
              Informasi & Legal
            </h3>
            <nav className="flex flex-col space-y-1 text-sm">
              {POLICY_LINKS.map((link) => {
                const isActive = link.slug === currentSlug;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-accent/10 text-accent font-semibold'
                        : 'text-foreground/70 hover:bg-black/5 hover:text-foreground'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-black/5">
              <p className="text-xs text-foreground/60">
                Punya pertanyaan lain mengenai trip atau kebijakan kami?
              </p>
              <Link
                href="/faq"
                className="mt-2 block text-xs font-semibold text-accent hover:underline"
              >
                Lihat Panduan FAQ →
              </Link>
            </div>
          </div>
        </aside>

        {/* Article Body */}
        <article className="lg:col-span-3 prose prose-slate max-w-none">
          <div className="p-6 md:p-10 rounded-2xl bg-card border border-black/10 shadow-xs leading-relaxed space-y-4 whitespace-pre-line text-sm md:text-base text-foreground/85">
            {content}
          </div>
        </article>
      </div>
    </div>
  );
}
