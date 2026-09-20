# STEP

STEP 11: Trip Core Management (Template & Master Program Perjalanan)

## OBJECTIVE

Membangun kapabilitas pengelolaan Core Trip (Template / Program Perjalanan) secara end-to-end:

1. Shared data contracts (`@wildera/types`) dan validasi input runtime murni (`@wildera/validation`).
2. Backend NestJS REST API (`/api/v1/admin/trips`) lengkap dengan relasi ke tabel `Mountain` (`mountainId`) dan opsional `Route` (`routeId`), auto-slug unik global (`@unique slug`), validasi foreign key integritas, filter multi-kriteria (search, tipe trip, tingkat kesulitan, status, featured, filter gunung & rute), pagination, soft delete (`status: ARCHIVED`, `deletedAt`), proteksi foreign key aktif `TripSchedule`, RBAC permission guards (`CATALOG_VIEW`, `CATALOG_MANAGE`), dan audit trail otomatis (`audit_logs`).
3. Web Admin Next.js 16 (`/admin/trips`) berpenampilan utilitarian forest green berbasis shadcn/ui tokens (`references/wildera-adventure-admin-dashboard`), dilengkapi data table responsif, filter multi-kriteria, dialog modal create/edit trip dengan dropdown gunung dan jalur bertingkat (jalur terfilter otomatis berdasarkan gunung yang dipilih), badge tipe trip dan tingkat kesulitan, serta modal konfirmasi pengarsipan.
4. Memastikan trip record terpisah dari jadwal keberangkatan (`TripSchedule`) yang akan dikerjakan pada STEP 13+ serta nested content pada STEP 12.
5. Menjaga konsistensi arsitektur data serta integritas referensi landing page luxury outdoor travel agency (`references/luxuria-travel-agency`) untuk tahap STEP 18–21.

## DEPENDENCIES

- STEP 01–10: PASS.
- PostgreSQL 18 lokal di port 55432.
- Shared workspaces: `@wildera/types`, `@wildera/validation`.
- NestJS 12 API, Prisma ORM, Argon2, JWT session guard.
- Next.js 16, React 19, Playwright 1.63.0.

## FILES CREATED

```text
apps/api/src/modules/trip/trip.service.ts
apps/api/src/modules/trip/trip.controller.ts
apps/api/test/trip-validation.test.ts
apps/api/test/database/trip.test.ts
apps/web/src/app/admin/(protected)/trips/page.tsx
apps/web/src/app/admin/(protected)/trips/trips-client.tsx
apps/web/src/app/api/admin/trips/route.ts
apps/web/src/app/api/admin/trips/[id]/route.ts
docs/17_STEP_11_Report.md
```

## FILES MODIFIED

```text
packages/types/src/index.ts
packages/validation/src/index.ts
apps/api/src/modules/trip/trip.module.ts
apps/web/test/admin.spec.ts
```

## IMPLEMENTATION DETAILS

### 1. Shared Types & Validation Package

- `packages/types/src/index.ts`:
  - Definisi enum type `TripType` (`'OPEN_TRIP' | 'PRIVATE_TRIP' | 'TEKTOK' | 'MULTI_DAY'`).
  - Interface `Trip` beserta relasi `mountain`, `route`, `creator`, dan `_count` (`schedules`, `itineraries`, `facilities`, `gears`, `faqs`).
  - DTOs: `CreateTripPayload`, `UpdateTripPayload`, `TripQueryPayload`, `TripListResponse`.
- `packages/validation/src/index.ts`:
  - `validateCreateTrip`: Memvalidasi `mountainId` wajib (UUID), `routeId` opsional (UUID atau null), `name` wajib (1-200 karakter), auto-generate slug jika kosong atau memvalidasi format slug (maks 220 karakter), enum `tripType`, `durationDays` (minimal 1), `durationNights` (>= 0), enum `difficulty`, boolean flags (`beginnerFriendly`, `healthCertificateRequired`, `featured`), rentang umur (`minimumAge` dan `maximumAge` dengan constraint `maximumAge >= minimumAge`), serta status konten.
  - `validateUpdateTrip`: Memvalidasi pembaruan parsial field yang diizinkan dan menolak payload kosong.
  - `validateTripQuery`: Memvalidasi dan menormalisasi parameter pencarian, filter status, tipe trip, tingkat kesulitan, gunung, jalur, serta batas pagination.

### 2. Backend NestJS Trip API

- `TripService`:
  - `list`: Mengambil daftar trip aktif (`deletedAt: null`) dengan relasi `mountain` (beserta nested `destination`), `route`, `creator`, dan agregasi `_count`. Mendukung pencarian teks pada nama trip, deskripsi, nama gunung, atau nama jalur, serta filter multi-kriteria (`mountainId`, `routeId`, `tripType`, `difficulty`, `status`, `featured`).
  - `getById`: Mengambil data detail trip aktif, melempar `NotFoundException` (404 `TRIP_NOT_FOUND`) jika tidak ditemukan.
  - `create`: Memverifikasi keberadaan gunung aktif (`mountainId`), memvalidasi jalur terkait jika dipilih (`routeId`), auto-generate slug, memeriksa duplikasi slug global (409 `SLUG_ALREADY_EXISTS`), otomatis mengisi `publishedAt` jika status `PUBLISHED`, menyimpan data dengan `createdBy` dari session admin, dan mencatat transaksi ke `audit_logs` (`TRIP_CREATE`).
  - `update`: Memverifikasi trip ada, memvalidasi gunung dan jalur target jika diubah, memeriksa keunikan slug jika diubah, memperbarui `publishedAt` bila transisi ke `PUBLISHED`, memperbarui data, dan mencatat `audit_logs` (`TRIP_UPDATE`).
  - `delete`: Memeriksa apakah ada jadwal aktif terhubung (`TripSchedule`) untuk mencegah inkonsistensi foreign key, melakukan soft delete (`status: ARCHIVED`, `deletedAt: new Date()`), dan mencatat transaksi audit (`TRIP_DELETE`).
- `TripController`:
  - Endpoints RESTful di `/api/v1/admin/trips` dan `/api/v1/admin/trips/:id`.
  - Proteksi RBAC: `@Authorize(Permission.CATALOG_VIEW)` untuk GET (list & detail) dan `@Authorize(Permission.CATALOG_MANAGE)` untuk mutasi (POST, PATCH, DELETE).

### 3. Frontend Web Admin Next.js Trip Management

- Route Handlers BFF:
  - `apps/web/src/app/api/admin/trips/route.ts`: Proxy GET dan POST dengan verifikasi origin anti-CSRF dan session cookie forwarding.
  - `apps/web/src/app/api/admin/trips/[id]/route.ts`: Proxy GET, PATCH, dan DELETE dengan verifikasi origin anti-CSRF dan session cookie forwarding.
- Halaman Admin & UI Client:
  - `apps/web/src/app/admin/(protected)/trips/page.tsx`: Server Component dengan prefetch paralel (`trips`, `mountains`, `routes`) menggunakan helper `fetchAdminApi` serta otorisasi `requireAdmin()`.
  - `apps/web/src/app/admin/(protected)/trips/trips-client.tsx`: Client Component responsif utilitarian back-office:
    - Data Table terstruktur: Program Trip (nama, deskripsi, featured badge), Lokasi & Jalur, Tipe & Durasi (badge tipe + tabular hari/malam), Kesulitan, Persyaratan (pemula, surat sehat, min usia), Status konten, dan Tombol Aksi (Edit, Arsipkan).
    - Toolbar pencarian instan dan filter multi-dimensi (Semua Gunung, Semua Tipe, Semua Kesulitan, Semua Status).
    - Modal Dialog Create/Edit lengkap dengan dropdown Gunung dan Jalur bertingkat (jalur otomatis terfilter berdasarkan gunung yang dipilih).
    - Modal Dialog konfirmasi pengarsipan aman.

## VERIFICATION RESULTS

1. **Unit Tests**:
   - `npm test`: 34 unit tests PASS (termasuk 6 unit test baru untuk validasi Trip).
2. **Database Integration Tests**:
   - `npm run db:test`: 40 tests PASS (termasuk skenario lifecycle Trip CRUD, relasi Mountain & Route, auto-slug, error handling 400/409/422, dan audit logging).
3. **End-to-End Playwright Tests**:
   - `npm run test:admin`: 9 test suites PASS (termasuk skenario UI Trip CRUD: create trip, relasi gunung & rute, edit status PUBLISHED, dan pengarsipan).
4. **TypeScript Typecheck**:
   - `npm run typecheck`: 0 error across monorepo (`@wildera/api`, `@wildera/web`, `@wildera/types`, `@wildera/ui`, `@wildera/validation`).
5. **Code Linting**:
   - `npm run lint`: 0 error / warning (ESLint strict zero-warnings).
6. **Production Build**:
   - `npm run build`: Next.js 16.3.5 & NestJS 12 production builds PASS.
7. **Code Formatting**:
   - `npm run format`: Seluruh file tervalidasi rapi sesuai standar Prettier.
