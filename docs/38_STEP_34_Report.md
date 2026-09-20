# Report STEP 34 — SEO & Metadata Optimization

## 1. Overview

Implementasi optimasi mesin pencari (SEO), metadata terstandarisasi, sitemap dinamis, robots directive, open graph tags, visual breadcrumb, image accessibility alt attributes, dan schema.org JSON-LD structured data sesuai spesifikasi roadmap STEP 34:

- **Unique Title & Meta Description**:
  - Halaman Utama (`/`): Judul spesifik dan deskripsi meta teroptimasi kata kunci pencarian alam terbuka & ekspedisi gunung.
  - Katalog Trip (`/trip`): Deskripsi dan metadata pencarian jadwal open trip dan private trip gunung di Indonesia.
  - Direktori Gunung (`/gunung`): Informasi elevasi, tingkat kesulitan rute, dan jadwal pendakian aktif.
  - Detail Trip (`/trip/[slug]`): Judul unik berbasis `trip.seo?.title` atau `[Nama Trip] - Info & Jadwal Pendakian | Wildera Adventure`.
  - Detail Gunung (`/gunung/[slug]`): Judul unik berbasis `mountain.seo?.title` atau `Gunung [Nama Gunung] [Elevasi] mdpl | Wildera Adventure`.
  - Halaman Konten & Kebijakan (`/faq`, `/tentang`, `/terms`, `/privacy`, `/cancellation`, `/safety`, `/private-trip`): Judul unik serta deskripsi informatif.
- **Canonical URLs**:
  - Konfigurasi `alternates.canonical` eksplisit di seluruh rute publik untuk mencegah kanibalisasi URL dan duplicate content issue.
- **OpenGraph & Social Sharing**:
  - Metadata OpenGraph lengkap (`og:title`, `og:description`, `og:url`, `og:site_name`, `og:locale`, `og:type`, dan `og:image`) terpasang pada halaman publik dan detail dinamis.
- **Dynamic Breadcrumbs & Schema.org JSON-LD**:
  - Navigasi breadcrumb visual (`aria-label="Breadcrumb"`) pada detail trip dan direktori gunung.
  - Structured Data JSON-LD (`BreadcrumbList`, `Product` dengan kalkulasi penawaran paket aktif terendah, dan `TouristAttraction` dengan data elevasi geografis).
- **Robots Directives & Indexability Rules**:
  - Endpoint dinamis `/robots.txt` (`apps/web/src/app/robots.ts`) mengizinkan perayapan publik dan memblokir area administratif (`Disallow: /admin`, `/admin/`, `/api/admin/`).
  - Halaman Admin (`apps/web/src/app/admin/layout.tsx`): Menetapkan `robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } }`.
  - Halaman publik default: `robots: { index: true, follow: true }`.
  - Halaman detail trip draft/non-published: otomatis diberikan directive `robots: { index: false, follow: false }`.
- **Dynamic Sitemap (`/sitemap.xml`)**:
  - Dihasilkan secara dinamis melalui `apps/web/src/app/sitemap.ts`.
  - Mencakup seluruh rute statis publik berprioritas tinggi.
  - Menarik seluruh data trip berstatus _published_ dan data direktori gunung secara otomatis dari backend API publik.
  - Bersih dari rute admin dan rute privat/draft.
- **Image Accessibility & Alt Text**:
  - Seluruh elemen `<img>` pada landing page, katalog trip, direktori gunung, dan detail halaman dilengkapi atribut `alt` deskriptif dengan fallback dinamis.

## 2. Arsitektur & File Terdampak

1. **Next.js Metadata, Robots & Sitemap Routes (`apps/web/src/app`)**:
   - `apps/web/src/app/robots.ts`: Penanganan otomatis rute `/robots.txt` dengan aturan perayapan bot publik, pemblokiran path admin, serta tautan ke sitemap.
   - `apps/web/src/app/sitemap.ts`: Generator otomatis XML sitemap dengan frekuensi perubahan, level prioritas, rute publik statis, serta entri dinamis trip dan gunung.
   - `apps/web/src/app/layout.tsx`: Root metadata dengan `metadataBase`, default title template, meta description, dan default indexing permissions.
   - `apps/web/src/app/admin/layout.tsx`: Strict noindex / nofollow / nocache crawler directive untuk portal admin.
   - `apps/web/src/app/page.tsx`: Canonical link, OpenGraph metadata, dan indexing directives.
   - `apps/web/src/app/trip/page.tsx`: Canonical link, OpenGraph metadata, dan indexing directives.
   - `apps/web/src/app/gunung/page.tsx`: Canonical link, OpenGraph metadata, dan indexing directives.
   - `apps/web/src/app/private-trip/page.tsx`: Canonical link, OpenGraph metadata, dan indexing directives.
   - `apps/web/src/app/faq/page.tsx`: Canonical link, OpenGraph metadata, dan indexing directives.
   - `apps/web/src/app/tentang/page.tsx`: Canonical link, OpenGraph metadata, dan indexing directives.
   - `apps/web/src/app/terms/page.tsx`: Canonical link, OpenGraph metadata, dan indexing directives.
   - `apps/web/src/app/privacy/page.tsx`: Canonical link, OpenGraph metadata, dan indexing directives.
   - `apps/web/src/app/cancellation/page.tsx`: Canonical link, OpenGraph metadata, dan indexing directives.
   - `apps/web/src/app/safety/page.tsx`: Canonical link, OpenGraph metadata, dan indexing directives.
   - `apps/web/src/app/trip/[slug]/page.tsx`: Dynamic metadata, canonical, OpenGraph, JSON-LD Schema (`BreadcrumbList` & `Product`), dan indexability condition.
   - `apps/web/src/app/gunung/[slug]/page.tsx`: Dynamic metadata, canonical, OpenGraph, dan JSON-LD Schema (`BreadcrumbList` & `TouristAttraction`).

2. **Components & Media Alt Text (`apps/web/src/components`)**:
   - `apps/web/src/components/trip-detail/trip-detail-client.tsx`: Penyempurnaan atribut alt cover dan thumbnail gallery trip.

3. **Automated Testing Suite (`apps/web/test`)**:
   - `apps/web/test/seo.spec.ts`: Suite pengujian Playwright komprehensif untuk validasi `robots.txt`, `sitemap.xml`, canonical tag, meta title, meta description, OpenGraph tags, JSON-LD schema parsing, robots indexing, dan kepatuhan atribut alt gambar.

## 3. Hasil Verifikasi Quality Gates

- **Unit Tests Monorepo**: 123/123 PASS (`npm test`).
- **Database Integration Tests**: 57/57 PASS (`npm run test:db -w @wildera/api`).
- **Playwright Browser Tests**: 46/46 PASS (`npm run test:admin`).
- **TypeScript Typecheck**: PASS (`npm run typecheck`).
- **ESLint & Prettier**: 0 errors, 0 warnings (`npm run format && npm run lint`).
- **Full Monorepo Production Build**: PASS (`npm run build`).
