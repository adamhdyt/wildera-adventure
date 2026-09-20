# Report STEP 27 — Schedule Capacity Update Rule (Guard Below Confirmed Seats)

## 1. Overview

Implementasi aturan validasi bisnis pada saat admin mengubah kapasitas jadwal (`trip_schedules.capacity`). Jadwal tidak boleh diturunkan kapasitasnya di bawah total kursi peserta yang telah terkonfirmasi (`CONFIRMED` / `COMPLETED`), dan wajib menolak perubahan dengan status HTTP `409 Conflict` bersandi `CAPACITY_BELOW_CONFIRMED`.

## 2. Spesifikasi & Implementasi

### A. Core Business Logic (`apps/api/src/modules/schedule/schedule.service.ts`)

- Saat request `PATCH /api/v1/admin/schedules/:id` diterima dengan field `capacity`:
  1. Service membaca status booking terkait jadwal secara atomik.
  2. Menghitung `confirmedSeats = SUM(participantCount) WHERE status IN ('CONFIRMED', 'COMPLETED')`.
  3. Jika `data.capacity < confirmedSeats`:
     - Melempar `ConflictException` dengan payload:
       ```json
       {
         "code": "CAPACITY_BELOW_CONFIRMED",
         "message": "Capacity tidak dapat lebih kecil dari X peserta terkonfirmasi.",
         "details": {
           "requestedCapacity": 8,
           "confirmedSeats": 10
         }
       }
       ```
  4. Jika `data.capacity >= confirmedSeats`:
     - Update kapasitas disimpan ke database.
     - Mencatat audit trail `SCHEDULE_UPDATE`.

### B. BFF & Controller Integration

- NestJS Controller: `@Patch(':id')` dengan `@Authorize(Permission.SCHEDULE_UPDATE)`.
- Next.js Admin BFF Proxy: `apps/web/src/app/api/admin/schedules/[id]/route.ts`.
- Form validasi UI di `/admin/schedules`: Menampilkan error badge dan feedback jika admin mencoba input kapasitas di bawah peserta aktif.

## 3. Verifikasi & Pengujian

- **Integration DB Test**: `apps/api/test/database/schedule.test.ts` (Scenario 8: Attempting to reduce capacity below 10 returns HTTP 409 `CAPACITY_BELOW_CONFIRMED`).
- **Unit Test**: `apps/api/test/schedule-validation.test.ts`.

## 4. Status Quality Gates

- `npm test` -> 70/70 PASS
- `npm run test:db -w @wildera/api` -> 46/46 PASS
- `npm run test:admin` -> 34/34 PASS
- `npm run typecheck` -> PASS
- `npm run lint` & `npm run format` -> PASS
- `npm run build` -> PASS
