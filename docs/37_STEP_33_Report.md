# Report STEP 33 — Audit Log System

## 1. Overview

Implementasi Sistem Audit Log untuk pelacakan aktivitas sistem, pencatatan perubahan data kritikal, dan pemantauan riwayat administratif Wildera Adventure sesuai spesifikasi roadmap STEP 33:

- **Sifat Append-Only & Immutability**:
  - Seluruh baris rekaman audit bersifat strictly append-only.
  - Tidak ada endpoint API ataupun fungsi service yang menyediakan mutasi data (`UPDATE`) maupun penghapusan (`DELETE`) pada rekaman audit logs.
  - Percobaan melakukan request `DELETE`, `PATCH`, atau `PUT` ke rute `/api/v1/admin/audit-logs/:id` menghasilkan status 404 (rute tidak ada).
- **Critical Events Audited**:
  - `TRIP_PUBLISHED` / `TRIP_PUBLISH`: Pencatatan publikasi trip lengkap dengan snapshot perubahan status.
  - `SCHEDULE_CAPACITY_CHANGED`: Pencatatan pembaruan kuota/kapasitas jadwal perjalanan (`TripSchedule.capacity`).
  - `BOOKING_CREATED` / `BOOKING_CREATE`: Pencatatan pembuatan booking peserta baru.
  - `BOOKING_CONFIRMED` / `BOOKING_CONFIRM`: Pencatatan konfirmasi booking oleh admin operasional.
  - `BOOKING_CANCELLED` / `BOOKING_CANCEL`: Pencatatan pembatalan booking beserta alasannya.
  - `ADMIN_ROLE_CHANGED`: Pencatatan pergantian role akun staf admin (`PATCH /api/v1/admin/users/:id`).
  - `ADMIN_STATUS_CHANGED`: Pencatatan pengaktifan/penonaktifan akun staf admin (`disable` / `enable`).
  - `SETTING_UPDATE`: Pencatatan perubahan konfigurasi situs.
  - `CONTENT_PAGE_UPDATE` & `FAQ_UPDATE`: Pencatatan perubahan materi konten publik dan FAQ.
- **RBAC & Data Masking Protection**:
  - `SUPER_ADMIN`: Akses penuh terhadap seluruh catatan audit dan inspeksi data lengkap tanpa sensor.
  - `OPERATIONS`: Memiliki hak `AUDIT_VIEW_LIMITED`. Dapat meninjau aktivitas operasional; payload sensitif (password hash, token, credential) disamarkan secara otomatis.
  - `CONTENT`: Dilarang mengakses audit log (HTTP 403 Forbidden). Navigasi sidebar disembunyikan.
- **Query, Filtering & Sorting**:
  - Pengurutan default: Selalu terurut descending berdasarkan waktu pembuatan (`ORDER BY created_at DESC`).
  - Filter: `adminUserId`, `entityType`, `entityId`, `action` (dengan dukungan pemetaan alias format past tense seperti `TRIP_PUBLISHED` ↔ `TRIP_PUBLISH`, `BOOKING_CREATED` ↔ `BOOKING_CREATE`, dll.), rentang tanggal (`fromDate`, `toDate`), dan pencarian teks bebas (`search`).
  - Paginasi: Parameter `page` dan `limit` dengan pembatasan maksimal 100 entri per halaman.
- **UI Admin Viewer (`/admin/audit-logs`)**:
  - Heading resmi `<h1>Audit Log</h1>`.
  - Filter bar interaktif (Aksi, Entitas, Rentang Tanggal, Pencarian).
  - Tabel catatan audit interaktif dengan badge warna status kontekstual.
  - Modal Drawer untuk inspeksi JSON diff data lama (`oldValue`) vs data baru (`newValue`).
  - Fitur Export CSV langsung untuk kebutuhan kepatuhan (compliance) dan audit internal.

## 2. Arsitektur & File Terdampak

1. **Packages**:
   - `packages/types/src/index.ts`: Interface `AuditLogItem`, `AuditLogAdmin`, `AuditLogQueryPayload`, `PaginatedAuditLogs`, `AdminUserItem`, `CreateAdminUserPayload`, `UpdateAdminUserPayload`.
   - `packages/validation/src/index.ts`: Validator `validateAuditLogQuery` (normalisasi pagination, uppercase action & entity, parsing tanggal aman), `validateCreateAdminUser`, `validateUpdateAdminUser`, konstanta `VALID_ADMIN_ROLES`.
2. **Backend API (`apps/api`)**:
   - `apps/api/src/modules/audit/audit.service.ts`: Query log append-only dengan filter, relasi `adminUser`, sorting `createdAt: desc`, paginasi, dan masking data sensitif untuk non-superadmin.
   - `apps/api/src/modules/audit/audit.controller.ts`: Endpoint `GET /api/v1/admin/audit-logs` dengan decorator guard `@Authorize(Permission.AUDIT_VIEW_LIMITED)`.
   - `apps/api/src/modules/audit/audit.module.ts`: Pendaftaran service dan controller modul audit.
   - `apps/api/src/modules/admin/admin.service.ts` & `admin.controller.ts`: Endpoint manajemen user admin (`GET`, `POST`, `PATCH`, `disable`, `enable`) yang mencatat event audit `ADMIN_ROLE_CHANGED` dan `ADMIN_STATUS_CHANGED`.
   - `apps/api/src/modules/admin/admin.module.ts`: Pendaftaran service dan controller modul admin.
   - `apps/api/src/modules/schedule/schedule.service.ts`: Penambahan pencatatan event `SCHEDULE_CAPACITY_CHANGED` saat kapasitas jadwal diubah.
3. **Frontend Web (`apps/web`)**:
   - `apps/web/src/app/api/admin/audit-logs/route.ts`: BFF Route Next.js proxying request ke backend admin API dengan query parameter passthrough.
   - `apps/web/src/app/admin/(protected)/audit-logs/page.tsx`: Server Component dengan proteksi sesi `requireAdmin()`, verifikasi role, dan initial data fetching.
   - `apps/web/src/app/admin/(protected)/audit-logs/audit-logs-client.tsx`: Interactive Client Component dengan filter bar, status badges, diff JSON viewer modal, paginasi, dan export CSV.
   - `apps/web/src/lib/admin-navigation.ts`: Pendaftaran item menu "Audit Log" dengan slug `audit-logs` dan visibilitas operasional.

## 3. Test Verification

1. **Unit Tests**:
   - `apps/api/test/audit-validation.test.ts`: 10 pengujian unit mencakup default pagination, pembatasan limit (clamp 100), uppercase transformasi, parsing tanggal valid/invalid, serta validasi admin user dan roles.
   - Total Unit Tests: **123/123 PASS** (`npm test`).
2. **Database Integration Tests**:
   - `apps/api/test/database/audit.test.ts`: 6 suite pengujian integrasi database terisolasi:
     - RBAC permissions (SUPER_ADMIN full access, OPERATIONS limited access dengan masking, CONTENT 403 Forbidden, unauthenticated 401).
     - Critical Event `ADMIN_ROLE_CHANGED` verifikasi pembuatan dan query filter.
     - Critical Event `SCHEDULE_CAPACITY_CHANGED` dan aliasing query filter.
     - Query filters & paginasi (entityType, search, limit, page).
     - Append-only enforcement (verifikasi tidak adanya endpoint DELETE/PATCH/PUT untuk audit logs).
   - Total Database Tests: **57/57 PASS** (`npm run test:db -w @wildera/api`).
3. **Playwright E2E Tests**:
   - `apps/web/test/audit-logs.spec.ts`: Pengujian browser E2E verifikasi login Super Admin, navigasi ke `/admin/audit-logs`, heading `<h1>Audit Log</h1>`, filter controls, rendering tabel, interaksi modal detail JSON old/new value, export CSV, serta proteksi penolakan akses Content Admin.
   - `apps/web/test/admin.spec.ts`: Integrasi item navigasi Audit Log pada admin shell loop test.
   - Total Playwright Tests: **40/40 PASS** (`npm run test:admin`).
4. **Quality Gates**:
   - TypeScript Typecheck: Clean PASS (`npm run typecheck`).
   - ESLint & Prettier: Clean PASS (0 error, 0 warning).
   - Production Build: Clean PASS (`apps/api` NestJS build + `apps/web` Next.js 16 build).
