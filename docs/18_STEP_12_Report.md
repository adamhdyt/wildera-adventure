# STEP

STEP 12: Trip Nested Content (Itinerary, Facilities, Gear Requirements, and FAQ)

## OBJECTIVE

Membangun kapabilitas pengelolaan konten subresource / nested content trip secara end-to-end:

1. Shared data contracts (`@wildera/types`) untuk subresources trip: `TripItinerary`, `TripFacility` (`FacilityType`), `TripGear` (`GearType`), `TripFaq`, `TripContent`, dan payload DTO `UpdateTripContentPayload`.
2. Validasi runtime murni (`@wildera/validation`): fungsi `validateUpdateTripContent` untuk memvalidasi struktur itinerary (termasuk deteksi duplikasi `dayNumber`), fasilitas include/exclude, perlengkapan wajib/rekomendasi, dan FAQ pendakian.
3. Backend NestJS REST API (`/api/v1/admin/trips/:id/content`):
   - `GET /api/v1/admin/trips/:id/content`: mengambil seluruh subresource konten terstruktur (`itineraries`, `facilities`, `gears`, `faqs`) dalam urutan `sortOrder` / `dayNumber`.
   - `PUT /api/v1/admin/trips/:id/content`: sinkronisasi dan penggantian konten atomik menggunakan Prisma `$transaction`, mencatat riwayat ke tabel `audit_logs` (`TRIP_CONTENT_UPDATE`), serta memvalidasi otorisasi RBAC (`Permission.CATALOG_MANAGE`).
4. Web Admin Next.js 16 (`/admin/trips`):
   - Integrasi BFF Proxy Route handler: `/api/admin/trips/[id]/content` (anti-CSRF + forward session cookie).
   - Modal Editor Konten Interaktif pada `trips-client.tsx`: tab navigasi terpisah (📅 Itinerary, 🎒 Fasilitas, 🥾 Perlengkapan, ❓ FAQ), tombol tambah dinamis, hapus, dan reordering itinerary harian (naik/turun hari).
5. Database integration tests & Playwright browser E2E test untuk menjamin seluruh lifecycle nested content tersimpan dan termuat dengan presisi.

## DEPENDENCIES

- STEP 01–11: PASS.
- PostgreSQL 18 lokal di port 55432.
- Prisma ORM (`TripItinerary`, `TripFacility`, `TripGear`, `TripFaq`).
- Shared workspaces: `@wildera/types`, `@wildera/validation`.
- NestJS 12 API, Next.js 16, React 19, Playwright 1.63.0.

## FILES CREATED

```text
apps/web/src/app/api/admin/trips/[id]/content/route.ts
docs/18_STEP_12_Report.md
```

## FILES MODIFIED

```text
packages/types/src/index.ts
packages/validation/src/index.ts
apps/api/src/modules/trip/trip.service.ts
apps/api/src/modules/trip/trip.controller.ts
apps/api/test/trip-validation.test.ts
apps/api/test/database/trip.test.ts
apps/web/src/app/admin/(protected)/trips/trips-client.tsx
apps/web/test/admin.spec.ts
```

## IMPLEMENTATION DETAILS

### 1. Shared Types & Validation Package

- `packages/types/src/index.ts`:
  - Enums: `FacilityType` (`'INCLUDE' | 'EXCLUDE'`), `GearType` (`'MANDATORY' | 'RECOMMENDED'`).
  - Interfaces: `TripItinerary`, `TripFacility`, `TripGear`, `TripFaq`, `TripContent`.
  - DTO: `UpdateTripContentPayload` (mendukung pembaruan array terstruktur untuk `itineraries`, `facilities`, `gears`, dan `faqs`).
- `packages/validation/src/index.ts`:
  - `validateUpdateTripContent`:
    - Memvalidasi array itinerary: `dayNumber` (integer >= 1), keunikan `dayNumber` dalam satu trip, `title` (1-200 karakter), dan deskripsi opsional.
    - Memvalidasi array fasilitas: enum `facilityType` (`INCLUDE` / `EXCLUDE`), `name` (1-200 karakter), dan deskripsi opsional.
    - Memvalidasi array perlengkapan: enum `gearType` (`MANDATORY` / `RECOMMENDED`), `name` (1-200 karakter), dan deskripsi opsional.
    - Memvalidasi array FAQ: `question` (1-5000 karakter), `answer` (1-10000 karakter), status `ContentStatus`, dan integer `sortOrder`.

### 2. Backend NestJS Subresource Endpoints

- `TripService`:
  - `getContent(tripId)`: Memeriksa keberadaan trip aktif, mengambil seluruh item `TripItinerary` (urut `dayNumber`), `TripFacility` (urut `sortOrder`), `TripGear` (urut `sortOrder`), dan `TripFaq` (urut `sortOrder`). Melempar 404 jika trip tidak ditemukan.
  - `updateContent(tripId, body, audit)`: Memvalidasi payload via `validateUpdateTripContent`, menjalankan Prisma `$transaction` untuk sinkronisasi atomik: menghapus entitas lama dan membuat entitas baru dengan sortOrder/dayNumber yang rapi, lalu mencatat event `TRIP_CONTENT_UPDATE` pada tabel `audit_logs`.
- `TripController`:
  - `GET /api/v1/admin/trips/:id/content`: diproteksi `@Authorize(Permission.CATALOG_VIEW)`.
  - `PUT /api/v1/admin/trips/:id/content`: diproteksi `@Authorize(Permission.CATALOG_MANAGE)`.

### 3. Frontend Web Admin UI & BFF Handler

- `apps/web/src/app/api/admin/trips/[id]/content/route.ts`:
  - BFF Next.js route handler (GET & PUT) dengan validasi origin anti-CSRF dan penerusan session cookie.
- `apps/web/src/app/admin/(protected)/trips/trips-client.tsx`:
  - Tombol aksi `Konten` pada setiap baris tabel data trip.
  - Modal editor subresource trip responsif dengan navigasi tab:
    - **Itinerary**: Tombol `+ Tambah Hari`, input judul & deskripsi kegiatan, tombol reordering (▲ Naik, ▼ Turun), dan tombol Hapus Hari dengan re-numbering otomatis.
    - **Fasilitas**: Tombol `+ Tambah Include` dan `+ Tambah Exclude`, selector jenis fasilitas, input nama, dan tombol hapus.
    - **Perlengkapan**: Tombol `+ Wajib Bawa` dan `+ Opsional`, selector tipe alat, input nama, dan tombol hapus.
    - **FAQ**: Tombol `+ Tambah FAQ`, status draft/published, input pertanyaan & jawaban, dan tombol hapus.
    - Tombol `Simpan Semua Konten` dengan transisi loading dan umpan balik sukses/gagal.

### 4. Verification & Testing

- Unit tests (`apps/api/test/trip-validation.test.ts`):
  - Memvalidasi payload nested content valid.
  - Menolak payload itinerary dengan duplikasi `dayNumber`.
- Database Integration tests (`apps/api/test/database/trip.test.ts`):
  - Memverifikasi endpoint GET content mengembalikan array kosong secara default.
  - Memverifikasi endpoint PUT content menyimpan dan mengganti subresource dalam satu transaksi atomik.
  - Memverifikasi integritas audit trail mencatat `TRIP_CONTENT_UPDATE`.
- Playwright E2E browser tests (`apps/web/test/admin.spec.ts`):
  - Skenario pembukaan modal `Kelola Konten:`, pengisian itinerary, fasilitas, perlengkapan, dan FAQ, penyimpanan konten, serta konfirmasi umpan balik banner sukses.

## VERIFICATION RESULTS

- `npm test`: 36/36 unit tests PASS.
- `npm run db:test`: 40/40 database integration tests PASS.
- `npm run test:admin`: 9/9 Playwright browser tests PASS.
- `npm run typecheck`: 0 error.
- `npm run lint`: 0 error / warning.
- `npm run build`: Next.js 16 & NestJS 12 production build PASS.
- `npm run format`: Prettier PASS.
