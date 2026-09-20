# STEP

STEP 15: Trip Schedules, Dates & Quotas (Schedule Management, Computed Availability, Lifecycle States)

## OBJECTIVE

Membangun modul manajemen jadwal perjalanan (`TripSchedule`), tanggal keberangkatan, dan kuota peserta secara teruji dan andal:

1. Shared Data Contracts & Validation (`@wildera/types`, `@wildera/validation`):
   - Definisi status lifecycle jadwal (`ScheduleStatus`): `DRAFT`, `OPEN`, `CLOSED`, `CANCELLED`, `COMPLETED`.
   - Definisi status ketersediaan komputasi (`AvailabilityStatus`): `AVAILABLE`, `ALMOST_FULL`, `SOLD_OUT`.
   - Aturan larangan arsitektur: **Dilarang menyimpan `AVAILABLE`, `ALMOST_FULL`, `SOLD_OUT` ke database**. Status ini wajib dihitung secara komputasi berdasarkan `capacity - confirmedSeats`.
   - Fungsi `computeAvailability(capacity, confirmedSeats)`:
     - `availableSeats = max(0, capacity - confirmedSeats)`
     - `SOLD_OUT` jika `availableSeats <= 0`
     - `ALMOST_FULL` jika `availableSeats <= 3` atau `availableSeats / capacity <= 0.2`
     - `AVAILABLE` untuk kondisi lainnya.
   - Validator `validateCreateSchedule`: memvalidasi `tripId` UUID, format `startDate` & `endDate` (`endDate >= startDate`), batas pendaftaran `registrationDeadline <= startDate`, `capacity > 0`, serta `minimumParticipants <= capacity`.
   - Validator `validateUpdateSchedule`: parsing update parsial kapasitas dan status.
   - Validator `validateScheduleQuery`: filter query pagination dan date ranges.
2. Backend NestJS Endpoints (`apps/api`):
   - `GET /api/v1/admin/schedules`: daftar jadwal dengan filter `tripId`, `status`, `fromDate`, `toDate`, include relasi `trip` dan perhitungan otomatis `confirmedSeats`, `availableSeats`, dan `availabilityStatus`. Guard `SCHEDULE_VIEW`.
   - `POST /api/v1/admin/schedules`: membuat jadwal perjalanan berstatus awal `DRAFT`, mencatat audit log `SCHEDULE_CREATE`. Guard `SCHEDULE_MANAGE`.
   - `GET /api/v1/admin/schedules/:id`: mengambil detail jadwal beserta kursi terkonfirmasi. Guard `SCHEDULE_VIEW`.
   - `PATCH /api/v1/admin/schedules/:id`: memperbarui jadwal. Jika kapasitas diturunkan di bawah jumlah peserta terkonfirmasi (`capacity < confirmedSeats`), melempar HTTP 409 `CAPACITY_BELOW_CONFIRMED`. Mencatat audit log `SCHEDULE_UPDATE`. Guard `SCHEDULE_MANAGE`.
   - `POST /api/v1/admin/schedules/:id/open`: transisi status ke `OPEN`. Mencatat audit log `SCHEDULE_STATUS_CHANGE`.
   - `POST /api/v1/admin/schedules/:id/close`: transisi status ke `CLOSED`. Mencatat audit log `SCHEDULE_STATUS_CHANGE`.
   - `POST /api/v1/admin/schedules/:id/cancel`: transisi status ke `CANCELLED` dengan catatan alasan pembatalan. Mencatat audit log `SCHEDULE_CANCEL`.
   - `POST /api/v1/admin/schedules/:id/complete`: transisi status ke `COMPLETED`. Mencatat audit log `SCHEDULE_STATUS_CHANGE`.
   - `DELETE /api/v1/admin/schedules/:id`: menghapus jadwal. Jika jadwal telah memiliki pesanan/booking, menolak dengan HTTP 409 `SCHEDULE_HAS_BOOKINGS`. Guard `SCHEDULE_MANAGE`.
3. Web Admin Next.js BFF & UI (`apps/web`):
   - BFF route handlers:
     - `GET & POST /api/admin/schedules`
     - `GET, PATCH, DELETE /api/admin/schedules/[id]`
     - `POST /api/admin/schedules/[id]/open`
     - `POST /api/admin/schedules/[id]/close`
     - `POST /api/admin/schedules/[id]/cancel`
     - `POST /api/admin/schedules/[id]/complete`
     - Proteksi anti-CSRF dan otentikasi admin session cookies.
   - UI Admin `schedules-client.tsx`:
     - Data table jadwal dengan informasi Trip, Tanggal Keberangkatan, Batas Pendaftaran, Kapasitas & Ketersediaan Kursi (badge `Tersedia`, `Hampir Penuh`, `Habis`), serta badge status operasional.
     - Toolbar filter berdasarkan Trip dan Status operasional.
     - Modal form Tambah / Edit Jadwal dengan validasi tanggal dan kapasitas.
     - Modal dialog konfirmasi pembatalan jadwal dengan input alasan.
     - Modal dialog konfirmasi penghapusan jadwal.
4. Pengujian komprehensif: unit tests, database integration test, dan Playwright E2E browser tests.

## DEPENDENCIES

- STEP 01–14: PASS.
- PostgreSQL lokal di port 55432.
- Prisma ORM (`Trip`, `TripSchedule`, `SchedulePackage`, `Booking`, `Customer`, `AuditLog`).
- Shared workspaces: `@wildera/types`, `@wildera/validation`.
- NestJS 12 API, Next.js 16, React 19, Playwright 1.63.0.

## FILES CREATED

```text
apps/api/src/modules/schedule/schedule.service.ts
apps/api/src/modules/schedule/schedule.controller.ts
apps/api/test/schedule-validation.test.ts
apps/api/test/database/schedule.test.ts
apps/web/src/app/admin/(protected)/schedules/page.tsx
apps/web/src/app/admin/(protected)/schedules/schedules-client.tsx
apps/web/src/app/api/admin/schedules/route.ts
apps/web/src/app/api/admin/schedules/[id]/route.ts
apps/web/src/app/api/admin/schedules/[id]/open/route.ts
apps/web/src/app/api/admin/schedules/[id]/close/route.ts
apps/web/src/app/api/admin/schedules/[id]/cancel/route.ts
apps/web/src/app/api/admin/schedules/[id]/complete/route.ts
docs/21_STEP_15_Report.md
```

## FILES MODIFIED

```text
packages/types/src/index.ts
packages/validation/src/index.ts
apps/api/src/modules/schedule/schedule.module.ts
apps/web/src/app/admin/admin.css
apps/web/test/admin.spec.ts
```

## VERIFICATION COMMANDS & RESULTS

```bash
# 1. Unit Tests
npm test
# Result: 47/47 PASS exit 0

# 2. Database Integration Tests
npm run db:test
# Result: 42/42 PASS exit 0

# 3. Playwright E2E Browser Tests
npm run test:admin
# Result: 10/10 PASS exit 0

# 4. TypeScript Typecheck
npm run typecheck
# Result: 0 errors across 5 workspace packages exit 0

# 5. Production Build
npm run build
# Result: Next.js 16 & NestJS 12 build PASS exit 0

# 6. Formatting & Linting
npm run format && npm run lint
# Result: ESLint & Prettier clean PASS exit 0
```

## STATUS

STEP 15 COMPLETE (100%). Ready for STEP 16: Packages, Inclusions & Pricing Options.
