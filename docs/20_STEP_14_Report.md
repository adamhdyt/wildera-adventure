# STEP

STEP 14: Trip Publishing & Lifecycle (Validation, Publish, Unpublish, Duplicate without Schedules/Bookings)

## OBJECTIVE

Membangun modul alur hidup (lifecycle) dan publikasi trip secara teruji dan andal:

1. Shared Data Contracts & Validation (`@wildera/types`, `@wildera/validation`):
   - Definisi antarmuka validasi kelayakan publish: `TripPublishCheckInput` dan `TripPublishValidationResult`.
   - Fungsi `validateTripPublish`: memastikan seluruh prasyarat publikasi terpenuhi sebelum trip beralih status ke `PUBLISHED`:
     - Nama trip tidak kosong.
     - Slug trip valid dan terisi.
     - Relasi gunung tujuan (`mountainId`) terhubung.
     - Durasi hari pendakian > 0.
     - Tingkat kesulitan (`difficulty`) ditentukan.
     - Deskripsi trip / ringkasan tersedia.
     - Foto Sampul (`coverImage` / `TripMedia` dengan role `COVER`) wajib terlampir.
     - Rincian hari itinerary (`itineraryCount`) minimal 1 hari telah disusun.
2. Backend NestJS Endpoints (`apps/api`):
   - `POST /api/v1/admin/trips/:id/publish`: memvalidasi kelengkapan data trip, mengembalikan HTTP 422 `TRIP_NOT_READY_TO_PUBLISH` beserta rincian field error jika belum lengkap, memperbarui status menjadi `PUBLISHED` dan mencatat `publishedAt`, serta mencatat audit log `TRIP_PUBLISH`.
   - `POST /api/v1/admin/trips/:id/unpublish`: mengembalikan status publikasi trip ke `DRAFT` dan mencatat audit log `TRIP_UNPUBLISH`.
   - `POST /api/v1/admin/trips/:id/duplicate`: menduplikasi seluruh template trip beserta subresource-nya (itinerari, fasilitas, perlengkapan, FAQ, dan media attachments) dalam Prisma `$transaction`, memberi nama `${trip.name} (Salinan)`, menghasilkan slug unik baru, menetapkan status awal `DRAFT`, dan secara tegas **TIDAK menduplikasi jadwal (`schedules`) maupun pesanan (`bookings`)** sesuai spesifikasi monorepo Wildera Adventure. Mencatat audit log `TRIP_DUPLICATE`.
3. Web Admin Next.js BFF & UI (`apps/web`):
   - BFF route handlers:
     - `POST /api/admin/trips/[id]/publish`: anti-CSRF check dan forward ke API backend.
     - `POST /api/admin/trips/[id]/unpublish`: anti-CSRF check dan forward ke API backend.
     - `POST /api/admin/trips/[id]/duplicate`: anti-CSRF check dan forward ke API backend.
   - UI Admin `trips-client.tsx`:
     - Tombol aksi `Publikasi` (hijau emerald) dan `Draft` (abu netral) kontekstual sesuai status saat ini.
     - Tombol aksi `Duplikasi` untuk penggandaan template dalam satu klik.
     - Modal peringatan interaktif `⚠️ Trip Belum Siap Dipublikasikan` yang menampilkan daftar spesifik field yang belum lengkap (misal Cover image atau Itinerary) jika publish ditolak, lengkap dengan tombol langsung menuju `Lengkapi Konten & Media →`.
4. Pengujian komprehensif: unit tests, database integration test, dan Playwright E2E browser tests.

## DEPENDENCIES

- STEP 01–13: PASS.
- PostgreSQL lokal di port 55432.
- Prisma ORM (`Trip`, `TripItinerary`, `TripFacility`, `TripGear`, `TripFaq`, `TripMedia`, `AuditLog`).
- Shared workspaces: `@wildera/types`, `@wildera/validation`.
- NestJS 12 API, Next.js 16, React 19, Playwright 1.63.0.

## FILES CREATED

```text
apps/api/test/trip-publish-validation.test.ts
apps/web/src/app/api/admin/trips/[id]/publish/route.ts
apps/web/src/app/api/admin/trips/[id]/unpublish/route.ts
apps/web/src/app/api/admin/trips/[id]/duplicate/route.ts
docs/20_STEP_14_Report.md
```

## FILES MODIFIED

```text
packages/types/src/index.ts
packages/validation/src/index.ts
apps/api/src/modules/trip/trip.service.ts
apps/api/src/modules/trip/trip.controller.ts
apps/api/test/database/trip.test.ts
apps/web/src/app/admin/(protected)/trips/trips-client.tsx
apps/web/test/admin.spec.ts
```

## TEST RESULTS

### 1. Unit Tests (`npm test`)

- 42 tests passed exit 0:
  - `validateTripPublish rejects incomplete trip without cover and itinerary`
  - `validateTripPublish accepts complete trip with cover and itinerary`
  - `validateCreateTrip succeeds with valid payload and auto slug`
  - `validateUpdateTripContent validates nested itinerary, facilities, gears, and faqs`
  - seluruh validasi autentikasi, otorisasi, media, rute, gunung, dan destinasi PASS.

### 2. Database Integration Tests (`npm run db:test`)

- 41 integration tests passed exit 0:
  - Verifikasi percobaan publish tanpa cover image mengembalikan HTTP 422 `TRIP_NOT_READY_TO_PUBLISH`.
  - Verifikasi publish trip berhasil (HTTP 200) setelah cover image terpasang, status menjadi `PUBLISHED`, dan `publishedAt` tercatat.
  - Verifikasi unpublish trip berhasil (HTTP 200) dan status kembali ke `DRAFT`.
  - Verifikasi duplicate trip berhasil (HTTP 201), menyalin subresource (itinerary, facilities, gears, faqs, media), menetapkan status awal `DRAFT`, dan memastikan tidak ada schedules / bookings yang disalin.
  - Verifikasi audit trail mencatat log mutasi `TRIP_PUBLISH`, `TRIP_UNPUBLISH`, dan `TRIP_DUPLICATE`.

### 3. Playwright E2E Browser Tests (`npm run test:admin`)

- 9 browser suites passed exit 0 (31.8s):
  - Pengujian transisi status Unpublish (`Draft`) dan konfirmasi banner feedback.
  - Pengujian tombol `Publikasi` yang memicu modal interaktif validasi `Trip Belum Siap Dipublikasikan` ketika Cover image belum terisi.
  - Pengujian tombol `Duplikasi` yang menghasilkan template baru `(Salinan)` di daftar trip.
  - Pengujian aksi pengarsipan bertahap.

### 4. Build, Typecheck, Format, & Lint

- `npm run typecheck`: 0 error across all workspaces.
- `npm run lint`: 0 warnings, 0 errors.
- `npm run build`: Next.js 16 (webpack) and NestJS 12 production builds compiled successfully.
- `npm run format`: Prettier clean exit 0.

## NEXT STEP

- STEP 15: Trip Schedules, Dates & Quotas (`model TripSchedule`, jadwal keberangkatan open & private trip, tanggal mulai-selesai, kapasitas/kuota peserta, dan status ketersediaan kursi).
