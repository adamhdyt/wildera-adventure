# STEP

STEP 16: Packages, Inclusions & Pricing Options (Meeting Points, Multi-Tier Pricing, Package Inclusions)

## OBJECTIVE

Membangun modul manajemen titik temu (`MeetingPoint`) dan paket varian jadwal perjalanan (`SchedulePackage`) secara teruji dan berintegritas tinggi:

1. Shared Data Contracts & Validation (`@wildera/types`, `@wildera/validation`):
   - Definisi status entitas `EntityStatus`: `ACTIVE`, `INACTIVE`.
   - Definisi tipe data `MeetingPoint` dan `SchedulePackage`.
   - Data Transfer Objects (DTO): `CreateMeetingPointPayload`, `UpdateMeetingPointPayload`, `CreatePackagePayload`, `UpdatePackagePayload`, `MeetingPointQueryPayload`.
   - **Critical Architecture Rule (Prompt Rule 84)**: Kapasitas kuota dikelola secara eksklusif pada level `TripSchedule`. `SchedulePackage` merepresentasikan opsi fasilitas/logistik (contoh: Tenda Dome vs Glamping, Titik Kumpul Jakarta vs Lombok). Validator secara tegas **menolak** field `capacity` atau `available_seats` pada payload paket (HTTP 422).
   - Validator `validateCreateMeetingPoint` & `validateUpdateMeetingPoint`: validasi nama titik temu, kota, alamat, koordinat rentang lintang (`-90` s/d `90`) dan bujur (`-180` s/d `180`).
   - Validator `validateCreatePackage` & `validateUpdatePackage`: validasi nama paket, harga (`price >= 0`), format tanggal/waktu pertemuan (`meetingDatetime`), relasi opsional `meetingPointId`, urutan tampilan (`sortOrder`), dan status.
2. Backend NestJS Endpoints (`apps/api`):
   - `MeetingPointController` (`/api/v1/admin/meeting-points`):
     - `GET /api/v1/admin/meeting-points`: daftar titik temu dengan filter pencarian dan status (`SCHEDULE_VIEW`).
     - `GET /api/v1/admin/meeting-points/:id`: detail titik temu (`SCHEDULE_VIEW`).
     - `POST /api/v1/admin/meeting-points`: pembuatan titik temu baru + audit log `MEETING_POINT_CREATE` (`SCHEDULE_MANAGE`).
     - `PATCH /api/v1/admin/meeting-points/:id`: pembaharuan titik temu + audit log `MEETING_POINT_UPDATE` (`SCHEDULE_MANAGE`).
     - `DELETE /api/v1/admin/meeting-points/:id`: penghapusan titik temu dengan proteksi integritas referensi paket (`SCHEDULE_MANAGE`).
   - `PackageController` (`/api/v1/admin/schedules/:scheduleId/packages`):
     - `GET /api/v1/admin/schedules/:scheduleId/packages`: daftar opsi paket untuk suatu jadwal tertentu (`SCHEDULE_VIEW`).
     - `GET /api/v1/admin/schedules/:scheduleId/packages/:packageId`: detail opsi paket (`SCHEDULE_VIEW`).
     - `POST /api/v1/admin/schedules/:scheduleId/packages`: pembuatan opsi paket jadwal baru + audit log `PACKAGE_CREATE` (`SCHEDULE_MANAGE`).
     - `PATCH /api/v1/admin/schedules/:scheduleId/packages/:packageId`: pembaharuan opsi paket + audit log `PACKAGE_UPDATE` (`SCHEDULE_MANAGE`).
     - `DELETE /api/v1/admin/schedules/:scheduleId/packages/:packageId`: penghapusan opsi paket dengan proteksi integritas pesanan aktif (HTTP 409 `PACKAGE_HAS_BOOKINGS`) + audit log `PACKAGE_DELETE` (`SCHEDULE_MANAGE`).
   - `ScheduleService.delete`: integrasi transaksi atomik pembersihan `SchedulePackage` berelasi ketika menghapus jadwal yang belum memiliki pesanan aktif.
3. Web Admin Next.js BFF & UI (`apps/web`):
   - BFF Route Handlers:
     - `GET & POST /api/admin/meeting-points`
     - `GET, PATCH, DELETE /api/admin/meeting-points/[id]`
     - `GET & POST /api/admin/schedules/[id]/packages`
     - `GET, PATCH, DELETE /api/admin/schedules/[id]/packages/[packageId]`
     - Proteksi anti-CSRF via origin verification dan penerusan cookie autentikasi admin.
   - UI Admin `schedules-client.tsx`:
     - Tombol akses cepat toolbar "📍 Kelola Titik Temu" dan modal manajemen titik temu terpadu (daftar titik temu, filter status, form penambahan titik temu baru dengan koordinat & catatan panduan).
     - Tombol aksi baris tabel "📦 Paket & Harga" per jadwal.
     - Modal dialog pengelolaan opsi paket multi-tier:
       - Ringkasan jadwal aktif (nama trip, rentang tanggal, kuota total).
       - Daftar paket terdaftar dengan badge harga (format IDR), status, dan titik temu tertaut.
       - Form penambahan paket baru: nama paket, harga, pilihan titik temu (dropdown dinamis), tanggal/jam kumpul, urutan, status, dan deskripsi fasilitas/inclusions.
4. Pengujian & Verifikasi Lengkap:
   - Unit Tests: 54/54 pengujian validasi model bisnis lulus.
   - Database Integration Tests: 43/43 skenario transaksi database, foreign key constraints, audit trail, dan booking protection lulus.
   - Playwright Browser Tests: 10/10 skenario E2E admin management UI (termasuk Meeting Points dan Multi-Tier Packages) lulus.

## DEPENDENCIES

- STEP 01–15: PASS.
- PostgreSQL daemon aktif pada port 55432.
- Prisma ORM (`MeetingPoint`, `SchedulePackage`, `TripSchedule`, `Booking`, `AuditLog`).
- Shared packages: `@wildera/types`, `@wildera/validation`.
- NestJS 12 API, Next.js 16 App Router, React 19, Playwright 1.63.0.

## FILES CREATED

```text
apps/api/src/modules/package/meeting-point.service.ts
apps/api/src/modules/package/meeting-point.controller.ts
apps/api/src/modules/package/package.service.ts
apps/api/src/modules/package/package.controller.ts
apps/api/src/modules/package/package.module.ts
apps/api/test/package-validation.test.ts
apps/api/test/database/package.test.ts
apps/web/src/app/api/admin/meeting-points/route.ts
apps/web/src/app/api/admin/meeting-points/[id]/route.ts
apps/web/src/app/api/admin/schedules/[id]/packages/route.ts
apps/web/src/app/api/admin/schedules/[id]/packages/[packageId]/route.ts
docs/22_STEP_16_Report.md
```

## FILES MODIFIED

```text
packages/types/src/index.ts
packages/validation/src/index.ts
apps/api/src/app.module.ts
apps/api/src/modules/schedule/schedule.service.ts
apps/web/src/app/admin/(protected)/schedules/page.tsx
apps/web/src/app/admin/(protected)/schedules/schedules-client.tsx
apps/web/test/admin.spec.ts
```

## VERIFICATION COMMANDS

Semua perintah verifikasi dieksekusi dan terbukti PASS 100%:

```bash
# 1. Unit testing validasi payload, aturan harga, larangan kapasitas paket
npm test

# 2. Database integration testing meeting points, multi-tier pricing, integrity checks, audit logs
npm run db:test

# 3. Playwright browser E2E test antarmuka admin meeting points & packages
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

TUNTAS 100%. Siap melanjutkan ke STEP 17: Booking Engine & Participant Data Collection.
