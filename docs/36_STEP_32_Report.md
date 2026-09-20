# Report STEP 32 — Site Settings & System Configuration

## 1. Overview

Implementasi Site Settings & System Configuration untuk pengelolaan preferensi dan konfigurasi operasional Wildera Adventure sesuai spesifikasi roadmap STEP 32:

- **Whitelisted Supported Keys**:
  - `business_whatsapp`: Nomor WhatsApp bisnis resmi (format internasional normalisasi `628...`). Digunakan untuk seluruh konversi WhatsApp di katalog, detail trip, konsultasi kesehatan, inquiry private trip, dan FAQ.
  - `instagram_url`: Tautan resmi akun Instagram Wildera Adventure.
  - `contact_email`: Alamat email kontak resmi untuk korespondensi publik dan CS.
  - `almost_full_percentage`: Ambang batas persentase kuota sisa (integer 1-100, default 20%) untuk menandai jadwal trip dengan badge status "HAMPIR PENUH".
- **Keamanan, Isolasi, dan Sanitasi Data**:
  - Proteksi whitelisting ketat: upaya membuat atau mengubah key di luar whitelist (misal rahasia database, API tokens, arbitrary secrets) ditolak langsung dengan HTTP 400 Bad Request.
  - Endpoint publik (`GET /api/v1/site-settings/public`): Mengembalikan konfigurasi aman yang dapat diakses publik tanpa otentikasi.
  - Endpoint admin (`GET /api/v1/admin/site-settings`): Diproteksi guard RBAC dengan permission `SETTING_VIEW` (SUPER_ADMIN, OPERATIONS, CONTENT).
  - Endpoint admin per key (`PATCH /api/v1/admin/site-settings/:key`): Diproteksi permission `SETTING_MANAGE` (SUPER_ADMIN).
  - Audit Logging: Setiap pembaruan setting tercatat atomik pada tabel `audit_logs` dengan `action: 'SETTING_UPDATE'`, `entity_type: 'SITE_SETTING'`, `admin_user_id`, serta snapshot `old_value` dan `new_value`.
- **UI Admin Dashboard Pengaturan (`/admin/settings`)**:
  - Heading resmi `<h1>Pengaturan</h1>` dengan navigasi terintegrasi di sidebar admin shell.
  - Formulir visual terstruktur:
    1. **Kontak Resmi & WhatsApp Conversion** (`business_whatsapp`, `contact_email`).
    2. **Media Sosial & Tautan Eksternal** (`instagram_url`).
    3. **Logika Ketersediaan & Ambang Batas Kuota** (`almost_full_percentage`).
    4. **Standar Keamanan Konfigurasi** (Banner edukasi pencegahan penyimpanan credential sensitif).
  - Validasi formulir sisi klien dan penanganan error responsif.
  - Mode Baca (Read-Only) otomatis dengan badge peringatan apabila diakses oleh staf admin tanpa role SUPER_ADMIN.
- **BFF Next.js Routes**:
  - `GET /api/admin/site-settings`
  - `PATCH /api/admin/site-settings/[key]`
  - Pemeriksaan origin dan penanganan fallback status secara tangguh.

## 2. Arsitektur & File Terdampak

1. **Packages**:
   - `packages/types/src/index.ts`: Definisi interface `AdminSiteSetting`, `SiteSettingKey`, `SiteSettingValue`, `UpdateSiteSettingPayload`, `BulkUpdateSiteSettingsPayload`, serta perpanjangan `PublicSiteSettings`.
   - `packages/validation/src/index.ts`: Konstanta `SUPPORTED_SETTING_KEYS`, runtime validator `validateUpdateSetting`, `validateBulkUpdateSettings`, normalisasi nomor telepon, validasi URL HTTP/HTTPS, dan batasan numerik ambang batas kuota.
2. **Backend API (`apps/api`)**:
   - `apps/api/src/modules/setting/setting.service.ts`: Logika bisnis query publik & admin, validasi key terdaftar, sanitasi format, upsert database, dan pencatatan audit log `SETTING_UPDATE`.
   - `apps/api/src/modules/setting/setting.controller.ts`: Controller admin terlindungi decorator `@Authorize(Permission.SETTING_VIEW)` dan `@Authorize(Permission.SETTING_MANAGE)`.
   - `apps/api/src/modules/setting/setting-public.controller.ts`: Controller publik non-sensitif.
   - `apps/api/src/modules/setting/setting.module.ts`: Pendaftaran controller dan service ke dalam container NestJS.
   - `database/seeds/development.ts`: Seed default untuk seluruh site settings pendukung operasional awal.
3. **Frontend Web (`apps/web`)**:
   - `apps/web/src/app/admin/(protected)/settings/page.tsx`: Server component pemuat data awal dengan proteksi sesi `requireAdmin()`.
   - `apps/web/src/app/admin/(protected)/settings/settings-client.tsx`: Interactive client component dengan validasi, umpan balik feedback, dan disabled state berbasis hak akses.
   - `apps/web/src/app/api/admin/site-settings/route.ts`: BFF route Next.js untuk query admin settings.
   - `apps/web/src/app/api/admin/site-settings/[key]/route.ts`: BFF route Next.js untuk update setting per-kunci.
   - `apps/web/src/lib/admin-navigation.ts`: Integrasi item navigasi "Pengaturan" pada sidebar dashboard admin.

## 3. Test Verification

1. **Unit Tests**:
   - `apps/api/test/setting-validation.test.ts`: 11 pengujian unit mencakup pencegahan arbitrary/secret keys, validasi format nomor WhatsApp, protokol URL Instagram, format email, dan rentang persentase ambang batas (1-100).
   - Total Unit Tests: **113/113 PASS** (`npm test`).
2. **Database Integration Tests**:
   - `apps/api/test/database/setting.test.ts`: Verifikasi lifecycle penuh admin & publik, RBAC permission enforcement (SUPER_ADMIN vs OPERATIONS vs CONTENT), validasi input error (400), pencegahan arbitrary key, dan verifikasi pencatatan `audit_logs` (`SETTING_UPDATE`).
   - Total Database Tests: **51/51 PASS** (`npm run test:db -w @wildera/api`).
3. **Playwright E2E Tests**:
   - `apps/web/test/settings.spec.ts`: Pengujian browser E2E untuk Super Admin (input validation, edit nilai konfigurasi, konfirmasi simpan, persistensi reload) dan pengujian mode read-only untuk Operations admin.
   - `apps/web/test/admin.spec.ts`: Verifikasi navigasi shell menu Pengaturan.
   - Total Playwright Tests: **38/38 PASS** (`npm run test:admin`).
4. **Quality Gates**:
   - TypeScript Typecheck: Clean PASS (`npm run typecheck`).
   - ESLint & Prettier: Clean PASS (0 error, 0 warning).
   - Production Build: Clean PASS (`apps/api` NestJS build + `apps/web` Next.js 16 build).
