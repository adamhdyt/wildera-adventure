# STEP

STEP 10: Route Management (Jalur Pendakian)

## OBJECTIVE

Membangun kapabilitas pengelolaan Jalur Pendakian (Route) secara end-to-end:

1. Shared data contracts (`@wildera/types`) dan validasi input runtime murni (`@wildera/validation`).
2. Backend NestJS REST API (`/api/v1/admin/routes`) lengkap dengan relasi foreign key ke tabel `Mountain` (`mountainId`), satu gunung banyak jalur (_one mountain multiple routes_), auto-slug unik per gunung (`@@unique([mountainId, slug])`), filter (search, gunung, status konten, tingkat kesulitan), pagination, soft delete (`status: ARCHIVED`, `deletedAt`), RBAC permission guards (`CATALOG_VIEW`, `CATALOG_MANAGE`), dan audit trail otomatis (`audit_logs`).
3. Web Admin Next.js 16 (`/admin/routes`) berpenampilan utilitarian forest green berbasis shadcn/ui tokens (`references/wildera-adventure-admin-dashboard`), dilengkapi data table responsif, filter multi-kriteria, dialog modal create/edit jalur dengan dropdown gunung terkait, badge tingkat kesulitan dan status, serta konfirmasi pengarsipan.
4. Menjaga konsistensi arsitektur data serta integritas referensi landing page luxury outdoor travel agency (`references/luxuria-travel-agency`) untuk tahap STEP 18–21.

## DEPENDENCIES

- STEP 01–09: PASS.
- PostgreSQL 18 lokal di port 55432.
- Shared workspaces: `@wildera/types`, `@wildera/validation`.
- NestJS 12 API, Prisma ORM, Argon2, JWT session guard.
- Next.js 16, React 19, Playwright 1.63.0.

## FILES CREATED

```text
apps/api/src/modules/route/route.service.ts
apps/api/src/modules/route/route.controller.ts
apps/api/test/route-validation.test.ts
apps/api/test/database/route.test.ts
apps/web/src/app/admin/(protected)/routes/page.tsx
apps/web/src/app/admin/(protected)/routes/routes-client.tsx
apps/web/src/app/api/admin/routes/route.ts
apps/web/src/app/api/admin/routes/[id]/route.ts
docs/16_STEP_10_Report.md
```

## FILES MODIFIED

```text
packages/types/src/index.ts
packages/validation/src/index.ts
apps/api/src/modules/route/route.module.ts
apps/web/test/admin.spec.ts
```

## IMPLEMENTATION DETAILS

### 1. Shared Types & Validation Package

- `packages/types/src/index.ts`:
  - Interface `Route` beserta relasi `mountain` (`id`, `name`, `slug`, `destinationId`, `destination`) dan `_count` (`trips`).
  - DTOs: `CreateRoutePayload`, `UpdateRoutePayload`, `RouteQueryPayload`, `RouteListResponse`.
- `packages/validation/src/index.ts`:
  - `validateCreateRoute`: Memvalidasi `mountainId` wajib (UUID), `name` wajib (1-160 karakter), auto-generate kebab slug jika kosong atau memvalidasi format slug (maks 180 karakter), validasi rentang jarak `distanceKm` (0 s/d 999.99), estimasi durasi `estimatedDurationHours` (0 s/d 999.99), kenaikan elevasi `elevationGainM` (0 s/d 9000), titik awal `startingPoint` (maks 255 karakter), validasi enum `difficulty` dan `status`.
  - `validateUpdateRoute`: Mendukung pembaruan parsial dengan validasi ketat per field yang disertakan, menolak payload kosong.
  - `validateRouteQuery`: Memvalidasi dan menormalisasi parameter pencarian, filter status, filter gunung (`mountainId`), filter tingkat kesulitan, serta pembatasan pagination (`limit` maks 100, `offset`).

### 2. Backend NestJS Route API

- `RouteService`:
  - `list`: Mengambil daftar rute aktif (`deletedAt: null`) dengan relasi `mountain` (beserta nested `destination`) dan jumlah trip terkait `_count.trips`. Mendukung pencarian teks pada nama jalur, titik awal, deskripsi, atau nama gunung, serta filter `mountainId`, `status`, dan `difficulty`.
  - `getById`: Mengambil data detail jalur aktif, melempar `NotFoundException` (404 `ROUTE_NOT_FOUND`) jika tidak ditemukan.
  - `create`: Memverifikasi keberadaan gunung aktif (`mountainId`), auto-generate slug, memeriksa duplikasi slug pada gunung yang sama (409 `SLUG_ALREADY_EXISTS`), menyimpan data, dan mencatat transaksi ke `audit_logs` (`ROUTE_CREATE`).
  - `update`: Memverifikasi jalur ada, memvalidasi gunung target jika dipindah, mengecek collision slug per gunung jika nama/slug diganti, memperbarui data, dan mencatat `audit_logs` (`ROUTE_UPDATE`).
  - `delete`: Memeriksa apakah ada trip aktif yang masih terhubung (mencegah inkonsistensi foreign key), melakukan soft delete dengan mengubah status menjadi `ARCHIVED` dan mengisi stempel `deletedAt: new Date()`, serta mencatat transaksi audit (`ROUTE_DELETE`).
- `RouteController`:
  - Endpoints RESTful di `/api/v1/admin/routes` dan `/api/v1/admin/routes/:id`.
  - Proteksi RBAC: `@Authorize(Permission.CATALOG_VIEW)` untuk GET (list & detail) dan `@Authorize(Permission.CATALOG_MANAGE)` untuk mutasi (POST, PATCH, DELETE).

### 3. Frontend Web Admin Next.js Route Management

- Proxy API Routes:
  - `apps/web/src/app/api/admin/routes/route.ts`: Handler GET (list/filter) dan POST (create jalur) dengan verifikasi header Origin anti-CSRF dan penyerahan cookie sesi admin.
  - `apps/web/src/app/api/admin/routes/[id]/route.ts`: Handler GET (detail), PATCH (update), dan DELETE (archive jalur).
- Server Component (`page.tsx`):
  - Pre-fetching data awal rute dan daftar gunung aktif secara paralel via `fetchAdminApi`.
  - Dilindungi oleh helper `requireAdmin()` untuk memastikan sesi admin valid sebelum render.
- Client Component (`routes-client.tsx`):
  - Data table utilitarian forest green dengan kolom Nama Jalur & Titik Awal, Gunung Terkait, Jarak (KM), Elevasi (M), Estimasi Durasi (Jam), Kesulitan, Status, dan Aksi.
  - Filter bar: Pencarian teks instan, filter dropdown gunung, filter tingkat kesulitan, dan filter status konten.
  - Modal Dialog Create/Edit: Dropdown pemilihan gunung aktif, field numerik jarak/elevasi/durasi, field titik awal, pilihan tingkat kesulitan, dan pilihan status konten dengan validasi inline.
  - Dialog Konfirmasi Pengarsipan (Soft Delete): Dialog konfirmasi sebelum mengarsipkan jalur.

## VERIFICATION RESULTS

### 1. Unit Tests (`npm test`)

- 28/28 unit tests PASS (termasuk 6 skenario validasi rute di `route-validation.test.ts`).

### 2. Database Integration Tests (`npm run db:test`)

- 39/39 database integration tests PASS (termasuk skenario siklus hidup Route API, one mountain multiple routes, dan verifikasi audit trail di `route.test.ts`).

### 3. Playwright E2E Browser Tests (`npm run test:admin`)

- 8/8 Playwright test scenarios PASS.
- Meliputi pengujian otentikasi admin, navigasi shell, CRUD Destinasi, CRUD Gunung, dan skenario lengkap CRUD Jalur (pembuatan jalur 1 Sembalun, pembuatan jalur 2 Senaru pada gunung yang sama, pengeditan status ke PUBLISHED, dan pengarsipan).

### 4. Code Quality & Build Checks

- `npm run typecheck`: 0 error.
- `npm run lint`: 0 error / warning.
- `npm run build`: PASS (Next.js 16 App Router & NestJS 12 production bundle).
- `npm run format`: PASS (Prettier monorepo clean).

## CONCLUSION

STEP 10 (Route Management / Jalur Pendakian) telah selesai 100% dan terverifikasi secara menyeluruh. Siap dilanjutkan ke STEP 11 (Trip Management / Trip Template).
