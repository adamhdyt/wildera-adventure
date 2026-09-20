# STEP

STEP 09: Mountain CRUD

## OBJECTIVE

Membangun kapabilitas pengelolaan Gunung (Mountain) secara end-to-end:

1. Shared data contracts (`@wildera/types`) dan validasi input runtime murni (`@wildera/validation`).
2. Backend NestJS REST API (`/api/v1/admin/mountains`) lengkap dengan filter (search, destinasi, status konten, tingkat kesulitan), pagination, relasi foreign key ke tabel destinasi, auto-slug kebab-case, pencegahan konflik slug, soft delete (`status: ARCHIVED`, `deletedAt`), RBAC permission guards (`CATALOG_VIEW`, `CATALOG_MANAGE`), dan audit trail otomatis (`audit_logs`).
3. Web Admin Next.js 16 (`/admin/mountains`) berpenampilan utilitarian forest green berbasis shadcn/ui tokens (`references/wildera-adventure-admin-dashboard`), dilengkapi data table responsif, filter bar multi-kriteria, dialog modal tambah/edit gunung, badge tingkat kesulitan dan status, serta konfirmasi pengarsipan.
4. Menjaga konsistensi arsitektur data serta integritas referensi landing page luxury outdoor travel agency (`references/luxuria-travel-agency`) untuk tahap STEP 18–21.

## DEPENDENCIES

- STEP 01–08: PASS.
- PostgreSQL 18 lokal di port 55432.
- Shared workspaces: `@wildera/types`, `@wildera/validation`.
- NestJS 12 API, Prisma ORM, Argon2, JWT session guard.
- Next.js 16, React 19, Playwright 1.63.0.

## FILES CREATED

```text
apps/api/src/modules/mountain/mountain.service.ts
apps/api/src/modules/mountain/mountain.controller.ts
apps/api/test/mountain-validation.test.ts
apps/api/test/database/mountain.test.ts
apps/web/src/app/admin/(protected)/mountains/page.tsx
apps/web/src/app/admin/(protected)/mountains/mountains-client.tsx
apps/web/src/app/api/admin/mountains/route.ts
apps/web/src/app/api/admin/mountains/[id]/route.ts
docs/15_STEP_09_Report.md
```

## FILES MODIFIED

```text
packages/types/src/index.ts
packages/validation/src/index.ts
apps/api/src/modules/mountain/mountain.module.ts
apps/web/src/app/admin/admin.css
apps/web/test/admin.spec.ts
```

## IMPLEMENTATION DETAILS

### 1. Shared Types & Validation Package

- `packages/types/src/index.ts`:
  - Enum `DifficultyLevel` (`EASY`, `MODERATE`, `HARD`, `EXTREME`).
  - Enum `ContentStatus` (`DRAFT`, `PUBLISHED`, `ARCHIVED`).
  - Interface `Mountain` beserta relasi `destination` dan `_count` (routes & trips).
  - DTOs: `CreateMountainPayload`, `UpdateMountainPayload`, `MountainQueryPayload`, `MountainListResponse`.
- `packages/validation/src/index.ts`:
  - `validateCreateMountain`: Memvalidasi `destinationId` wajib, `name` wajib (1-160 karakter), auto-generate kebab slug jika kosong atau memvalidasi format slug, validasi rentang ketinggian `altitudeM` (0-9000), validasi enum `defaultDifficulty` dan `status`, koordinat latitude (-90 s/d 90) dan longitude (-180 s/d 180), dan batas teks SEO.
  - `validateUpdateMountain`: Mendukung pembaruan parsial dengan validasi ketat per field yang disertakan, menolak payload kosong.
  - `validateMountainQuery`: Memvalidasi dan menormalisasi parameter pencarian, filter status, filter destinasi, filter tingkat kesulitan, serta pembatasan pagination (`limit` maks 100, `offset`).

### 2. Backend NestJS Mountain API

- `MountainService`:
  - `list`: Mengambil daftar gunung aktif (`deletedAt: null`) dengan relasi `destination` (`id`, `name`, `slug`) dan jumlah jalur `_count.routes`. Mendukung filter pencarian multi-kolom (nama gunung, deskripsi, musim terbaik, nama/wilayah destinasi), filter `destinationId`, `status`, dan `difficulty`.
  - `getById`: Mengambil data detail gunung aktif, melempar `NotFoundException` (404 `MOUNTAIN_NOT_FOUND`) jika tidak ditemukan.
  - `create`: Memverifikasi keberadaan destinasi (`destinationId`), auto-generate slug, memeriksa duplikasi slug aktif (409 `SLUG_ALREADY_EXISTS`), menyimpan data, dan mencatat mutasi ke `audit_logs` (`MOUNTAIN_CREATE`).
  - `update`: Memverifikasi gunung ada, memvalidasi destinasi jika diubah, mengecek collision slug jika slug diganti, memperbarui data, dan mencatat `audit_logs` (`MOUNTAIN_UPDATE`).
  - `delete`: Melakukan soft delete dengan mengubah status menjadi `ARCHIVED` dan mengisi stempel `deletedAt: new Date()`, serta mencatat transaksi audit (`MOUNTAIN_DELETE`).
- `MountainController`:
  - Endpoints RESTful di `/api/v1/admin/mountains` dan `/api/v1/admin/mountains/:id`.
  - Proteksi RBAC: `@Authorize(Permission.CATALOG_VIEW)` untuk GET (list & detail) dan `@Authorize(Permission.CATALOG_MANAGE)` untuk mutasi (POST, PATCH, DELETE).

### 3. Frontend Web Admin Next.js 16

- **Proxy API Handlers**:
  - `apps/web/src/app/api/admin/mountains/route.ts`: Handler GET dan POST yang memvalidasi header Origin (anti-CSRF) dan meneruskan session cookie ke backend NestJS.
  - `apps/web/src/app/api/admin/mountains/[id]/route.ts`: Handler GET, PATCH, dan DELETE dengan verifikasi Origin dan error handling terstruktur.
- **Server Component**:
  - `apps/web/src/app/admin/(protected)/mountains/page.tsx`: Memproteksi akses via `requireAdmin()`, melakukan prefetching paralel data gunung dan data destinasi, lalu merendernya ke Client Component.
- **Client Component**:
  - `apps/web/src/app/admin/(protected)/mountains/mountains-client.tsx`:
    - Header dan toolbar aksi: Tombol `+ Tambah Gunung`, search input real-time, dropdown filter destinasi, status, dan tingkat kesulitan.
    - Data Table: Menampilkan Nama Gunung & ringkasan, slug, nama destinasi terkait, ketinggian (MDPL tabular nums), badge kesulitan (`EASY`, `MODERATE`, `HARD`, `EXTREME`), badge status (`DRAFT`, `PUBLISHED`, `ARCHIVED`), jumlah jalur terdaftar, dan tombol aksi (Edit, Arsipkan).
    - Modal Dialog Tambah / Edit: Form responsif lengkap dengan select dropdown destinasi yang aktif, input ketinggian, tingkat kesulitan, status konten, koordinat, musim pendakian, dan field SEO. Dilengkapi inline validation feedback.
    - Dialog Konfirmasi Arsip: Menghindari penghapusan tidak disengaja dengan modal konfirmasi arsip.
- **Styling**:
  - `apps/web/src/app/admin/admin.css`: Menambahkan badge styling untuk status konten (`.badge-draft`, `.badge-published`, `.badge-archived`) dan tingkat kesulitan gunung (`.badge-easy`, `.badge-moderate`, `.badge-hard`, `.badge-extreme`).

## VERIFICATION RESULTS

1. **Unit Tests**:
   - Command: `npm test`
   - Result: 22/22 unit tests PASS (termasuk 6 tes baru di `mountain-validation.test.ts`).
2. **Database & API Integration Tests**:
   - Command: `npm run db:test`
   - Result: 38/38 tests PASS (termasuk skenario siklus hidup Mountain CRUD, foreign key destinasi, filter multi-kriteria, slug conflict, soft delete, dan audit trail).
3. **Playwright E2E Tests**:
   - Command: `npm run test:admin`
   - Result: 7/7 browser tests PASS (termasuk skenario E2E pembuatan destinasi -> pembuatan gunung berelasi -> edit status publikasi -> arsipkan gunung).
4. **Static Typecheck**:
   - Command: `npm run typecheck`
   - Result: 0 error di seluruh workspace (`@wildera/api`, `@wildera/web`, `@wildera/types`, `@wildera/ui`, `@wildera/validation`).
5. **Code Linter**:
   - Command: `npm run lint`
   - Result: 0 warning, 0 error.
6. **Production Build**:
   - Command: `npm run build`
   - Result: Build NestJS API dan Next.js Web App sukses tanpa warning.
7. **Code Formatting**:
   - Command: `npm run format`
   - Result: Seluruh file terformat rapi sesuai Prettier config.

## CONCLUSION

STEP 09 (Mountain CRUD) telah selesai 100% dan terverifikasi penuh secara end-to-end. Sistem siap melanjutkan ke STEP 10 (Route Management: Jalur Pendakian).
