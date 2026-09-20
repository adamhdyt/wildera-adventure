# STEP

STEP 18: Public Homepage (Header, Hero, Upcoming Trips, Destinations, Why Wildera, How It Works, Private Trip CTA, FAQ, Final CTA, Footer)

## OBJECTIVE

Membangun Public Homepage Wildera Adventure yang responsif (mobile-first), elegan, dan berorientasi konversi berdasarkan UX Specification Section 14–18 dan referensi luxury outdoor travel agency (`references/luxuria-travel-agency`). Homepage mengonsumsi real public API data dari NestJS untuk trip, destinasi, FAQs, dan site settings tanpa hardcoding kaku, dengan styling murni yang diisolasi agar tidak mengganggu workspace `/admin`.

---

## IMPLEMENTATION SUMMARY

1. **Shared Public API Client (`apps/web/src/lib/public-api.ts`)**:
   - `fetchPublicTrips(query)`: Mengonsumsi `GET /api/v1/trips`.
   - `fetchPublicDestinations()`: Mengonsumsi `GET /api/v1/destinations`.
   - `fetchPublicMountains(query)`: Mengonsumsi `GET /api/v1/mountains`.
   - `fetchPublicFaqs(category)`: Mengonsumsi `GET /api/v1/faqs`.
   - `fetchPublicSiteSettings()`: Mengonsumsi `GET /api/v1/site-settings/public`.

2. **Luxury Design System & Stylesheet Integration (`apps/web/src/app/public.css`)**:
   - Mengekstrak CSS design token dan komponen original dari `references/luxuria-travel-agency` (`--background: #f6f0e9`, `--card: #efe7dd`, `--foreground: #3d1f2a`, `--accent: #8c4a5c`, typography clamp, glassmorphism card, rounded corners, button styles).
   - Diimpor via `@import './public.css'` di `apps/web/src/app/globals.css` tanpa konflik dengan `.admin-root` di `admin.css`.

3. **Komponen Modular Homepage (`apps/web/src/components/`)**:
   - `navbar.tsx` (`Header`): Floating glassmorphism card (`fixed z-1000 top-5`), logo Wildera, links (`Explore Trip`, `Destinasi`, `Private Trip`, `Tentang`, `FAQ`), tombol CTA WhatsApp, dan mobile navigation drawer dengan hamburger trigger.
   - `hero.tsx` (`Hero`): Carousel foto pegunungan nusantara (Rinjani, Prau, Semeru, Bromo), progress bar otomatis berdurasi 4 detik, typography Wildera, tagline, dan tombol aksi ganda ("Jelajahi Trip" & "Private Trip").
   - `upcoming-trips.tsx` (`Upcoming Trips`): Menampilkan trip terdekat secara dinamis dari API dengan badge tingkat kesulitan (`DifficultyLevel`), badge ketersediaan kursi (`Sisa X kursi` / `Tersedia`), harga awal (`Mulai Rp...`), dan link menuju detail `/trip/[slug]`.
   - `destinations.tsx` (`Destinations`): Grid kartu destinasi dan gunung dengan foto, nama kawasan, elevasi mdpl, tingkat kesulitan, dan link filter trip.
   - `why-wildera.tsx` (`Why Wildera`): 4 pilar keunggulan Wildera (Standar Keselamatan Medis SOP ketat, Guide Bersertifikat APGI & Porter Handal, Logistik Camp Premium, Transparansi Biaya).
   - `how-it-works.tsx` (`How It Works`): 5 langkah reservasi simpel (Pilih Trip, Konsultasi WhatsApp, Konfirmasi DP Aman, Persiapan Fisik & Gear, Berangkat ke Puncak).
   - `private-trip-cta.tsx` (`Private Trip CTA`): Banner layanan kustom charter trip untuk grup/keluarga/korporat dengan tanggal bebas dan tenda privat.
   - `faq-section.tsx` (`FAQ`): Komponen accordion interaktif pertanyaan umum (kesiapan pemula, gear wajib, cuaca ekstrem/refund, konsumsi camp).
   - `final-cta.tsx` (`Final CTA`): Banner penutup dengan tombol CTA cepat ke WhatsApp dan eksplorasi katalog trip.
   - `footer.tsx` (`Footer`): Footer brand dengan tipografi responsif Wildera, navigasi utama, legal policies (`/terms`, `/privacy`, `/cancellation`, `/safety`), informasi basecamp Jakarta & Lombok, kontak, dan copyright 2026.

4. **Next.js Server Component Homepage (`apps/web/src/app/page.tsx`)**:
   - Mengambil data API secara paralel melalui `Promise.all`: trips, destinations, faqs, dan site settings.
   - Menginjeksikan nomor WhatsApp dan kontak dinamis ke komponen terkait.
   - Menyediakan metadata SEO komprehensif.

5. **End-to-End Automated Testing (`apps/web/test/home.spec.ts`)**:
   - Pengujian ke-10 seksi halaman utama sesuai hierarki UX.
   - Pengujian interaktivitas accordion FAQ (expand & collapse).
   - Pengujian mode mobile viewport (iPhone 390x844) untuk memeriksa tombol hamburger, menu drawer, dan CTA WhatsApp.

---

## VERIFICATION & TEST RESULTS

- **Playwright E2E Tests (`npm run test:admin`)**: 12/12 PASS (10 Admin tests + 2 Public Homepage tests).
- **Unit Tests (`npm test`)**: 57/57 PASS.
- **Database Integration Tests (`npm run db:test`)**: 44/44 test suites PASS.
- **TypeScript Typecheck (`npm run typecheck`)**: 0 error.
- **ESLint (`npm run lint`)**: 0 error / 0 warning.
- **Prettier Format (`npm run format`)**: Clean formatting.
- **Production Build (`npm run build`)**: Next.js 16 (Webpack) & NestJS 12 production build PASS.

---

## CONCLUSION & NEXT STEP

STEP 18 (Public Homepage) tuntas 100%.
Selanjutnya: Melanjutkan ke **STEP 19 — PUBLIC TRIP CATALOG & DETAIL PAGES** (Listing trip dengan filter dinamis, halaman detail trip lengkap dengan rute, itinerary, fasilitas, gear checklist, pemilihan jadwal & paket, serta integrasi booking WhatsApp).
