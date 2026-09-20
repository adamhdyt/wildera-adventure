# STEP

STEP 17: Public API (Destinations, Mountains, Trips, FAQs, Content Pages, Site Settings)

## OBJECTIVE

Membangun endpoint API publik yang aman, performan, dan berorientasi katalog tanpa autentikasi (`/api/v1/*`):

1. Shared Data Contracts & Validation (`@wildera/types`, `@wildera/validation`):
   - Definisi tipe respons publik: `PublicTripSummary`, `PublicTripDetail`, `PublicMountainSummary`, `PublicMountainDetail`, `PublicDestination`, `PublicFaq`, `PublicContentPage`, `PublicSiteSettings`.
   - Definisi tipe parameter query publik: `PublicTripQuery`, `PublicMountainQuery`.
   - Runtime query validators: `validatePublicTripQuery` dan `validatePublicMountainQuery` dengan sanitasi tipe, rentang halaman (`page`, `pageSize`), batas harga (`priceMin`, `priceMax`), dan normalisasi pengurutan (`sort`, `order`).
2. Backend NestJS Public Endpoints (`apps/api`):
   - `GET /api/v1/destinations`: Katalog destinasi berstatus `ACTIVE` (`deletedAt IS NULL`) beserta agregat jumlah gunung dan trip aktif.
   - `GET /api/v1/mountains`: Daftar gunung berstatus `PUBLISHED` (`deletedAt IS NULL`) dengan media cover, destinasi, dan jumlah trip.
   - `GET /api/v1/mountains/:slug`: Detail gunung terpublikasi lengkap dengan relasi destinasi, jalur pendakian (`routes`), media gallery, daftar trip mendatang (`upcomingTrips`), dan informasi elevasi/tingkat kesulitan.
   - `GET /api/v1/trips`: Katalog trip terpublikasi (`PUBLISHED`) dengan filter pencarian (`search`, `type`, `difficulty`, `destination`, `mountain`, `month`), kalkulasi jadwal terdekat (`nextSchedule` ketersediaan dinamis), dan harga mulai (`startingPrice`).
   - `GET /api/v1/trips/:slug`: Detail trip terpublikasi lengkap dengan cover & gallery media, rute & gunung, itinerary harian, fasilitas includes/excludes, gear requirements mandatory/recommended, FAQ khusus trip, serta jadwal pemesanan aktif berstatus `OPEN` / `LIMITED`.
   - `GET /api/v1/faqs`: Daftar FAQ umum berstatus `PUBLISHED` dengan pengurutan `sortOrder ASC`, mendukung filter kategori.
   - `GET /api/v1/content-pages/:slug`: Halaman statis publik (syarat & ketentuan, kebijakan privasi, dll.) berstatus `PUBLISHED`.
   - `GET /api/v1/site-settings/public`: Konfigurasi publik website (`isPublic = true`) berbentuk key-value dictionary, melindungi konfigurasi privat/sensitif.
3. Data Privacy & Integrity Guards:
   - Data `DRAFT` dan `ARCHIVED` secara ketat tidak dapat diakses melalui endpoint publik (mengembalikan HTTP 404 pada akses langsung via slug).
   - Data admin internal (`createdBy`, `creator`, `updater`, user ID) dan detail privasi peserta/pelanggan (`participants`, data kontak booking) tidak diekspos ke publik.
   - Perhitungan ketersediaan kursi jadwal (`availableSeats`) dihitung secara dinamis dari selisih `capacity` dan booking terkonfirmasi/berbayar tanpa mengekspos rincian transaksi pemesanan.
4. Pengujian & Verifikasi:
   - Unit tests validasi parameter query publik: 57/57 tests PASS.
   - Database integration tests endpoint publik: 44/44 test suites PASS.
   - Full quality gates (Lint, Typecheck, Build, Format, Playwright) PASS.

## DEPENDENCIES

- STEP 01–16: PASS.
- PostgreSQL daemon aktif pada port 55432.
- Prisma ORM (`Destination`, `Mountain`, `Trip`, `TripSchedule`, `TripMedia`, `MountainMedia`, `MediaAsset`, `Faq`, `ContentPage`, `SiteSetting`).
- Shared packages: `@wildera/types`, `@wildera/validation`.
- NestJS 12 API, Next.js 16 App Router, React 19, Playwright 1.63.0.

## FILES CREATED

```text
apps/api/src/modules/destination/destination-public.controller.ts
apps/api/src/modules/mountain/mountain-public.controller.ts
apps/api/src/modules/trip/trip-public.controller.ts
apps/api/src/modules/content/faq-public.controller.ts
apps/api/src/modules/content/content-page-public.controller.ts
apps/api/src/modules/content/content.service.ts
apps/api/src/modules/content/content.module.ts
apps/api/src/modules/setting/setting-public.controller.ts
apps/api/src/modules/setting/setting.service.ts
apps/api/src/modules/setting/setting.module.ts
apps/api/test/public-validation.test.ts
apps/api/test/database/public.test.ts
docs/23_STEP_17_Report.md
```

## FILES MODIFIED

```text
packages/types/src/index.ts
packages/validation/src/index.ts
apps/api/src/app.module.ts
apps/api/src/modules/destination/destination.module.ts
apps/api/src/modules/destination/destination.service.ts
apps/api/src/modules/mountain/mountain.module.ts
apps/api/src/modules/mountain/mountain.service.ts
apps/api/src/modules/trip/trip.module.ts
apps/api/src/modules/trip/trip.service.ts
```

## VERIFICATION COMMANDS

Semua perintah verifikasi dieksekusi dan terbukti PASS 100%:

```bash
# 1. Unit testing validasi query publik
npm test

# 2. Database integration testing seluruh endpoint publik & proteksi privasi
npm run db:test

# 3. Playwright browser E2E test antarmuka admin
npm run test:admin

# 4. Static typecheck monorepo
npm run typecheck

# 5. Linting seluruh codebase
npm run lint

# 6. Production build Next.js 16 & NestJS 12
npm run build

# 7. Code formatting
npm run format
```

## STATUS

TUNTAS 100%. Siap melanjutkan ke STEP 18.
