# STEP

STEP 08: Destination CRUD

## OBJECTIVE

Membangun kapabilitas pengelolaan Destinasi secara end-to-end:

1. Shared data contracts (`@wildera/types`) dan validasi input murni (`@wildera/validation`).
2. Backend NestJS REST API (`/api/v1/admin/destinations`) lengkap dengan filter, pagination, auto-slug kebab-case, pencegahan konflik slug, soft delete, RBAC permission guards (`CATALOG_VIEW`, `CATALOG_MANAGE`), dan audit trail otomatis (`audit_logs`).
3. Web Admin Next.js 16 (`/admin/destinations`) berpenampilan back-office padat data dan fungsional berbasis shadcn/ui tokens (`references/wildera-adventure-admin-dashboard`), dilengkapi tabel data responsif, filter pencarian & status, serta modal dialog tambah/edit destinasi.
4. Menjaga pemisahan tegas antara desain dashboard utilitarian (forest green `#1b4332`) dan desain landing page publik luxury outdoor travel agency (`references/luxuria-travel-agency` untuk tahap STEP 18–21).

## DEPENDENCIES

- STEP 01–07: PASS.
- PostgreSQL 18 lokal di port 55432.
- Shared workspaces: `@wildera/types`, `@wildera/validation`.
- NestJS 12 API, Prisma ORM, Argon2, JWT session guard.
- Next.js 16, React 19, Playwright 1.63.0.

## FILES CREATED

```text
apps/api/src/modules/destination/destination.service.ts
apps/api/src/modules/destination/destination.controller.ts
apps/api/test/destination-validation.test.ts
apps/api/test/database/destination.test.ts
apps/web/src/app/admin/(protected)/destinations/page.tsx
apps/web/src/app/admin/(protected)/destinations/destinations-client.tsx
apps/web/src/app/api/admin/destinations/route.ts
apps/web/src/app/api/admin/destinations/[id]/route.ts
docs/14_STEP_08_Report.md
```

## FILES MODIFIED

```text
packages/types/src/index.ts
packages/types/package.json
packages/validation/src/index.ts
packages/validation/package.json
packages/ui/package.json
apps/api/package.json
apps/api/src/modules/destination/destination.module.ts
apps/api/src/modules/auth/auth.module.ts
apps/api/src/common/authorization/authorization.module.ts
apps/web/src/lib/admin-session.ts
apps/web/src/app/admin/admin.css
apps/web/test/admin.spec.ts
scripts/local-postgres.mts
scripts/reset-database.mts
eslint.config.mjs
.prettierignore
```

## IMPLEMENTATION DETAILS

### 1. Shared Types & Validation Package

- `packages/types/src/index.ts`: Mendefinisikan interface `Destination`, enum `DestinationStatus`, DTO `CreateDestinationPayload`, `UpdateDestinationPayload`, `DestinationQueryPayload`, dan contract response `DestinationListResponse`.
- `packages/validation/src/index.ts`: Mengimplementasikan generator slug murni `slugify` (membersihkan tanda baca, spasi berlebih, dan karakter non-alphanumeric), serta validator runtime bebas dependensi eksternal (`validateCreateDestination`, `validateUpdateDestination`, `validateDestinationQuery`).
- Paket shared dikonfigurasi dengan target entry point `main` dan `types` yang valid di monorepo.

### 2. Backend NestJS Destination API

- `DestinationService`:
  - `findAll`: Query destinasi dengan search (pencarian multi-kolom nama, provinsi, wilayah), status filter (`ACTIVE` / `INACTIVE`), pagination (`limit`, `offset`), penghitungan relasi gunung (`_count.mountains`), dan mengabaikan record dengan `deletedAt != null`.
  - `findById`: Pencarian detail per ID, melempar `NotFoundException` jika tidak ditemukan.
  - `create`: Menghasilkan slug otomatis jika kosong, memverifikasi keunikan slug (menghasilkan 409 Conflict dengan kode `SLUG_ALREADY_EXISTS`), menyimpan data, dan mencatat transaksi ke tabel `audit_logs` (`DESTINATION_CREATE`).
  - `update`: Memvalidasi payload parsial, memeriksa konflik slug jika slug diubah, melakukan update, dan mencatat `DESTINATION_UPDATE` ke `audit_logs`.
  - `delete`: Soft delete dengan mengeset `deletedAt = new Date()` dan status menjadi `INACTIVE`, serta mencatat `DESTINATION_DELETE` ke `audit_logs`.
- `DestinationController`:
  - Terlindungi guard `@Authorize(Permission.CATALOG_VIEW)` untuk query `GET`.
  - Terlindungi guard `@Authorize(Permission.CATALOG_MANAGE)` untuk mutasi `POST`, `PATCH`, `DELETE`.
  - Menghubungkan metadata admin dari request session ke audit logger.
- `AuthModule` & `AuthorizationModule`: Dikonfigurasi dengan decorator `@Global()` sehingga guard RBAC dan Session aktif merata di seluruh controller tanpa ketergantungan manual.

### 3. Frontend Web Admin (`apps/web`)

- API Route Proxy (`/api/admin/destinations` dan `/api/admin/destinations/[id]`):
  - Memvalidasi origin header pada seluruh request mutasi (anti-CSRF).
  - Meneruskan cookie sesi admin `wildera_admin_session` secara transparan ke upstream NestJS API.
- Halaman Server Component (`/admin/destinations/page.tsx`):
  - Menjalankan `requireAdmin()` untuk memastikan autentikasi dan otorisasi role di server.
  - Melakukan pre-fetch data awal destinasi via `fetchAdminApi`.
- Client Component (`destinations-client.tsx`):
  - Filter bar: Input pencarian live dan dropdown filter status (Semua, Aktif, Nonaktif).
  - Data table utilitarian: Menampilkan nama destinasi, slug URL (tag monospace), provinsi, wilayah, jumlah gunung terhubung, badge status, dan tombol aksi (Edit & Nonaktifkan).
  - Modal Form Dialog: Form tambah/edit dengan field nama, slug kustom, provinsi, wilayah, deskripsi, status, dan SEO metadata; dilengkapi feedback validasi inline dan status pending/submitting.
  - Modal Konfirmasi Penonaktifan: Dialog proteksi konfirmasi sebelum menonaktifkan destinasi.
  - Desain & Aksesibilitas: Tampilan responsif dengan scroll table horizontal independen, lolos uji zoom font 200% tanpa horizontal scroll pada container halaman, serta konsisten dengan token desain forest green (`admin.css`).

## DESIGN SYSTEM ARCHITECTURE NOTE

Proyek mempertahankan diferensiasi estetika yang tegas:

1. **Back-Office Admin Dashboard** (`references/wildera-adventure-admin-dashboard`):
   - Pendekatan utilitarian, fokus data dan kecepatan operasional.
   - Forest green `#1b4332`, border muted `#d8ddd5`, badge status tegas, dan angka tabular.
2. **Landing Page Publik Luxury Outdoor** (`references/luxuria-travel-agency`):
   - Dicadangkan khusus untuk fase publik (STEP 18–21).
   - Estetika luxury mountain adventure operator: tipografi serif editorial, tone hangat, hero visual sinematik, micro-interactions elegan.

## VERIFICATION & TESTS PERFORMED

1. **Unit Tests (`npm test`)**:
   - 16 test case validasi shared: `slugify`, `validateCreateDestination`, `validateUpdateDestination`, dan `validateDestinationQuery` (16/16 PASS).
2. **Database Integration Tests (`npm run db:test`)**:
   - 37 test case integrasi database & API: CRUD destinasi end-to-end, verifikasi keunikan slug 409, otorisasi role admin, validasi schema PostgreSQL, dan audit log idempotency (37/37 PASS).
3. **Playwright E2E Browser Tests (`npm run test:admin`)**:
   - 6 skenario browser Chromium end-to-end:
     - Login, navigasi lintas modul admin, menu disclosure mobile, logout, dan revoked cookie validation.
     - Enforce role CONTENT vs OPERATIONS.
     - Penolakan akses cross-origin.
     - Penanganan failure state login & session retry.
     - Interaksi CRUD UI Destinasi: tambah destinasi, auto-slug, render data table, edit data, dan pergantian status ke INACTIVE (6/6 PASS).
4. **Code Quality & Build Gates**:
   - `npm run typecheck`: 0 error across all workspaces.
   - `npm run lint`: 0 error, 0 warning.
   - `npm run build`: Build Next.js 16 dan NestJS 12 production berhasil (`Compiled successfully`).
   - `npm run format`: Prettier terapkan konsistensi format.
