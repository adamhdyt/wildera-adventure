# Report STEP 29 — Participant Manifest (Schedule Manifest & Passenger List)

## 1. Overview

Implementasi Participant Manifest pada halaman jadwal keberangkatan (`trip_schedules`) sesuai spesifikasi prompt master STEP 29:

- Menampilkan Trip, Schedule, Confirmed Bookings, Confirmed Participants, dan Passenger Manifest Table.
- Menangani perbedaan antara kuota pemesanan (`booking.participant_count`) dengan jumlah data manifest terisi (`participants.length`).
- Menampilkan visual indikator `Expected: X` dan `Completed Data: Y` pada KPI card dan rincian transaksi per booking.
- Backend API endpoint `GET /api/v1/admin/schedules/:id/manifest` dengan proteksi RBAC `@Authorize(Permission.SCHEDULE_VIEW)`.
- BFF Next.js endpoint `GET /api/admin/schedules/[id]/manifest`.
- Tombol action `👥 Manifest` pada tabel jadwal dan modal manifest responsif dengan fitur print-ready (`🖨️ Cetak`).

## 2. Struktur Data Manifest

1. **Ringkasan Jadwal & Kuota**:
   - Info Trip (nama, tipe) dan Schedule (tanggal, status operasional, kapasitas, sisa kursi).
   - `confirmedBookingsCount`: Total transaksi booking terkonfirmasi (`CONFIRMED` / `COMPLETED`).
   - `expectedParticipants`: Total peserta yang dipesan (`SUM(participantCount)`).
   - `completedParticipantsCount`: Total baris data identitas peserta yang telah diinput (`SUM(participants.length)`).
2. **Daftar Booking Terkonfirmasi**:
   - Kode booking, nama pemesan, kontak WhatsApp, paket pilihan, dan status kelengkapan data (`Expected: X | Completed Data: Y`).
3. **Tabel Manifest Peserta Lengkap**:
   - No, Nama Lengkap, Gender & Tanggal Lahir, No HP, Tipe & Nomor Identitas (KTP/Passport), Kontak Darurat (Nama & No HP), serta Kode Booking & Nama Pemesan.

## 3. Test Verification

1. **Unit Tests**:
   - Total: **74/74 PASS** (`npm test`).
2. **Database Integration Tests**:
   - `apps/api/test/database/schedule-manifest.test.ts` PASS (Verifikasi endpoint manifest dengan relasi 2 booking berstatus CONFIRMED, kalkulasi expected 5 vs completed data 4, serta daftar flat manifest).
   - Total DB Tests: **48/48 PASS** (`npm run test:db -w @wildera/api`).
3. **Playwright E2E Tests**:
   - Total: **34/34 PASS** (`npm run test:admin`).
4. **Static Quality Gates**:
   - TypeScript Typecheck: Clean PASS (`npm run typecheck`).
   - ESLint & Prettier: Clean PASS (0 error, 0 warning).
   - Production Build: Clean PASS (`apps/api` build + `apps/web` Next.js 16 build).
