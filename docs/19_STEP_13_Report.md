# STEP

STEP 13: Media & Object Storage (Upload, MediaAsset, TripMedia, MountainMedia, Cover & Gallery)

## OBJECTIVE

Membangun modul pengelolaan media aset dan berkas pendakian secara menyeluruh:

1. Shared Data Contracts (`@wildera/types`):
   - Definisi tipe `MediaRole` (`'COVER' | 'GALLERY'`).
   - Interface `MediaAsset` (`id`, `objectKey`, `url`, `mimeType`, `fileSizeBytes`, `widthPx`, `heightPx`, `altText`, `createdBy`, `createdAt`).
   - Relasi junction `TripMedia` dan `MountainMedia`.
   - DTO respons dan mutasi: `TripMediaResponse`, `MountainMediaResponse`, `UpdateTripMediaPayload`, `UpdateMountainMediaPayload`.
2. Validasi File Upload & Penugasan Media (`@wildera/validation`):
   - Fungsi `validateImageUpload`: memeriksa MIME type (`image/jpeg`, `image/png`, `image/webp`, `image/avif`), ekstensi file, dan batas ukuran file maksimum 5MB.
   - Fungsi `validateUpdateMediaAssignment`: memvalidasi `coverMediaId` (UUID) dan `galleryMediaIds` (array UUID).
3. Backend Storage & Media Service NestJS (`apps/api`):
   - `MediaStorageService`: penyimpanan berkas ke direktori lokal monorepo (`uploads/YYYY/MM/<hash>.<ext>`) dengan path abstraksi siap pakai untuk integrasi S3-compatible bucket (`// ponytail: local filesystem storage with static streaming endpoint; upgrade path to S3 via @aws-sdk/client-s3`).
   - `MediaService`: penanganan upload berkas, pembuatan entitas `MediaAsset` di Prisma, streaming berkas publik, pembacaan media, penugasan `COVER` dan `GALLERY` pada Trip dan Mountain dalam transaksi atomik Prisma, serta pencatatan audit log (`MEDIA_UPLOAD`, `TRIP_MEDIA_UPDATE`, `MOUNTAIN_MEDIA_UPDATE`).
   - `MediaController`: endpoint `@Post('admin/media/upload')`, `@Get('admin/media')`, `@Get('media/file/*path')`, `@Get('admin/trips/:id/media')`, `@Put('admin/trips/:id/media')`, `@Get('admin/mountains/:id/media')`, `@Put('admin/mountains/:id/media')`.
4. Web Admin Next.js BFF & UI (`apps/web`):
   - BFF route handlers:
     - `POST /api/admin/media/upload`: anti-CSRF check dan forward berkas/payload.
     - `GET /api/admin/media`: daftar media assets.
     - `GET & PUT /api/admin/trips/[id]/media`: pembacaan dan pembaruan relasi media trip.
     - `GET & PUT /api/admin/mountains/[id]/media`: pembacaan dan pembaruan relasi media gunung.
   - UI Admin `trips-client.tsx`: tab ke-5 "🖼️ Media & Foto" dengan pengunggahan langsung foto sampul (Cover Image — P0 requirement), pratinjau thumbnail, status kelayakan publish (`Cover siap` vs `Wajib Cover`), serta galeri foto pendakian.
5. Verifikasi pengujian: unit test, database integration test, dan Playwright E2E browser tests.

## DEPENDENCIES

- STEP 01–12: PASS.
- PostgreSQL lokal di port 55432.
- Prisma ORM (`MediaAsset`, `TripMedia`, `MountainMedia`, `MediaRole`).
- Shared workspaces: `@wildera/types`, `@wildera/validation`.
- NestJS 12 API, Next.js 16, React 19, Playwright 1.63.0.

## FILES CREATED

```text
apps/api/src/modules/media/media-storage.service.ts
apps/api/src/modules/media/media.service.ts
apps/api/src/modules/media/media.controller.ts
apps/api/test/media-validation.test.ts
apps/api/test/database/media.test.ts
apps/web/src/app/api/admin/media/upload/route.ts
apps/web/src/app/api/admin/media/route.ts
apps/web/src/app/api/admin/trips/[id]/media/route.ts
apps/web/src/app/api/admin/mountains/[id]/media/route.ts
docs/19_STEP_13_Report.md
```

## FILES MODIFIED

```text
packages/types/src/index.ts
packages/validation/src/index.ts
apps/api/src/modules/media/media.module.ts
apps/web/src/app/admin/(protected)/trips/trips-client.tsx
apps/web/test/admin.spec.ts
```

## TEST RESULTS

### 1. Unit Tests (`npm test`)

- 40 tests passed exit 0:
  - `validateImageUpload accepts valid JPEG, PNG, WEBP and size <= 5MB`
  - `validateImageUpload rejects invalid extension or unsupported mime type`
  - `validateImageUpload rejects file larger than 5MB`
  - `validateUpdateMediaAssignment parses valid cover and gallery UUIDs`
  - Semua unit tests sebelumnya (RBAC, destination, mountain, route, trip, nested content) tetap lulus 100%.

### 2. Database Integration Tests (`npm run db:test`)

- 41 tests passed exit 0:
  - Skenario Media Upload, pembuatan `MediaAsset`, stream berkas, pembacaan daftar media, penugasan COVER & GALLERY ke Trip, penugasan ke Mountain, penolakan tipe berkas ilegal (422), validasi error input, serta verifikasi entri `audit_logs` (`MEDIA_UPLOAD`, `TRIP_MEDIA_UPDATE`).

### 3. Playwright E2E Tests (`npm run test:admin`)

- 9 tests passed exit 0:
  - Pengujian navigasi, sesi auth, kelola destinasi, gunung, rute, dan trip mencakup verifikasi tab `🖼️ Media & Foto` di modal konten trip.

### 4. Typecheck & Linter

- `npm run typecheck`: 0 error.
- `npm run lint`: 0 error / warning.
- `npm run build`: Next.js 16 & NestJS 12 production build PASS.
- `npm run format`: Prettier PASS.

## CONCLUSION

STEP 13 tuntas 100%. Modul Media & Object Storage telah aktif dan terhubung dengan Trip Management. Tahap berikutnya adalah STEP 14: Trip Publishing & Lifecycle (validasi kelengkapan data sebelum publish termasuk syarat wajib Cover image, pengarsipan, dan duplikasi trip).
