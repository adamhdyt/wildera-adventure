# STEP

STEP 04: Backend Foundation

## OBJECTIVE

Membangun fondasi NestJS untuk seluruh domain MVP, menghubungkan lifecycle aplikasi ke PostgreSQL melalui Prisma, dan menyediakan `GET /health` yang membuktikan koneksi database aktif.

## DEPENDENCIES

- PHASE 0: PASS.
- STEP 1: PASS.
- STEP 2: PASS.
- STEP 3: PASS.
- NestJS 12.0.3.
- Prisma Client dan PostgreSQL adapter 7.10.0.
- `@nestjs/config` 12.0.0.
- `@types/express` 5.0.6 untuk request/response middleware.

## FILES CREATED

```text
apps/api/src/common/config/config.module.ts
apps/api/src/common/config/environment.ts
apps/api/src/common/database/database.module.ts
apps/api/src/common/database/prisma.service.ts
apps/api/src/common/error-handling/api-exception.filter.ts
apps/api/src/common/error-handling/error-handling.module.ts
apps/api/src/common/health/health.controller.ts
apps/api/src/common/health/health.module.ts
apps/api/src/common/logger/app-logger.service.ts
apps/api/src/common/logger/logger.module.ts
apps/api/src/common/logger/request-context.ts
apps/api/src/common/logger/request-id.middleware.ts
apps/api/src/common/logger/request-logging.interceptor.ts
apps/api/src/modules/admin/admin.module.ts
apps/api/src/modules/audit/audit.module.ts
apps/api/src/modules/auth/auth.module.ts
apps/api/src/modules/booking/booking.module.ts
apps/api/src/modules/content/content.module.ts
apps/api/src/modules/destination/destination.module.ts
apps/api/src/modules/media/media.module.ts
apps/api/src/modules/mountain/mountain.module.ts
apps/api/src/modules/package/package.module.ts
apps/api/src/modules/participant/participant.module.ts
apps/api/src/modules/private-trip/private-trip.module.ts
apps/api/src/modules/route/route.module.ts
apps/api/src/modules/schedule/schedule.module.ts
apps/api/src/modules/setting/setting.module.ts
apps/api/src/modules/trip/trip.module.ts
apps/api/test/config.test.ts
docs/10_STEP_04_Report.md
```

## FILES MODIFIED

```text
README.md
apps/api/.env.example
apps/api/package.json
apps/api/src/app.module.ts
apps/api/src/app.ts
apps/api/src/main.ts
apps/api/test/database/schema.test.ts
package-lock.json
```

`apps/api/test/bootstrap.test.ts` diganti oleh unit test konfigurasi dan integration test health yang memakai database nyata. Enam dokumen source of truth tidak diubah.

## IMPLEMENTATION

- Membuat 15 feature module yang diminta STEP 4: auth, admin, destination, mountain, route, trip, schedule, package, booking, participant, private-trip, content, media, setting, dan audit.
- Membuat common config module menggunakan `@nestjs/config`. Startup memvalidasi `DATABASE_URL`, `PORT`, `HOST`, dan `NODE_ENV`.
- Membuat global database module dan `PrismaService`. Prisma membuka pool saat module init dan menutupnya saat aplikasi shutdown.
- Menetapkan business API prefix `/api/v1`.
- Menempatkan `GET /health` di luar prefix sesuai API specification §125.
- Health check menjalankan `SELECT 1` melalui Prisma sebelum mengembalikan status aplikasi, status database, dan timestamp ISO.
- Membuat structured JSON logger untuk lifecycle NestJS serta request completion tanpa mencatat body, password, token, atau data sensitif.
- Menambahkan atau meneruskan `X-Request-Id` untuk setiap request. Nilai client dibatasi pada karakter aman dan panjang maksimal 100; nilai lain diganti dengan ID baru.
- Menambahkan global request logging interceptor dengan method, path, status code, durasi, request ID, dan error code bila tersedia.
- Menambahkan global exception filter dengan error envelope konsisten dan pesan internal error yang tidak mengekspos stack trace ke client.
- Memuat environment backend dari `apps/api/.env` atau root `.env`, sehingga helper PostgreSQL lokal dapat digunakan langsung.
- Tidak membuat login, session, RBAC guard, atau business endpoint; semuanya berada di STEP berikutnya.

## DATABASE CHANGES

Tidak ada perubahan schema, migration, atau seed. Backend sekarang menggunakan schema dan Prisma Client dari STEP 2 serta `DATABASE_URL` yang sudah dikonfigurasi.

## API CHANGES

Endpoint baru:

```http
GET /health
```

Response sehat:

```json
{
  "status": "ok",
  "database": "ok",
  "timestamp": "2026-09-15T17:30:35.390Z"
}
```

Endpoint business tetap memakai root `/api/v1`. Request yang tidak ditemukan menghasilkan error envelope dan `X-Request-Id`.

## COMMANDS TO RUN

```sh
npm ci
npm run db:local:start
npm run db:deploy
npm run db:generate
npm run dev -w @wildera/api
```

Verifikasi health:

```sh
curl -i http://127.0.0.1:3001/health
```

## TESTS PERFORMED

- Memvalidasi normalisasi konfigurasi backend yang valid.
- Memastikan startup configuration menolak `DATABASE_URL` kosong, protocol non-PostgreSQL, dan port di luar rentang.
- Menerapkan migration pada database test sementara.
- Membuat aplikasi NestJS dengan Prisma yang terhubung ke database test.
- Membuka server pada port loopback sementara dan memanggil `GET /health`.
- Memastikan response health berstatus 200, `status: ok`, `database: ok`, timestamp valid, dan request ID client dikembalikan.
- Memastikan `/api/v1/health` tidak menjadi alias health dan menghasilkan 404 error envelope dengan generated request ID.
- Memastikan pola middleware NestJS 12 tidak menghasilkan legacy route warning.
- Menjalankan regression suite schema, constraint, Prisma Client, seed, dan reset.

## TEST RESULT

PASS.

- Unit tests: 2 passed, 0 failed.
- Database/integration tests: 34 passed, 0 failed.
- API boot: PASS.
- Database connection melalui health query: PASS.
- `GET /health`: 200 healthy.
- Lint dan formatting: PASS.
- Root serta seluruh workspace typecheck: PASS.
- Production build web/API: PASS.
- npm audit: 0 vulnerabilities.

## ACCEPTANCE CRITERIA

- [PASS] Seluruh feature module STEP 4 tersedia dan terdaftar di `AppModule`.
- [PASS] Common database, config, logger, dan error handling module tersedia.
- [PASS] API menggunakan prefix `/api/v1`.
- [PASS] Health endpoint tersedia pada `GET /health` di luar prefix.
- [PASS] API dapat boot dengan konfigurasi valid.
- [PASS] Prisma terhubung dan health check menjalankan query PostgreSQL.
- [PASS] Health response tidak mengekspos credential atau detail infrastruktur sensitif.
- [PASS] Error response dan request correlation mengikuti API specification.

## ISSUES FOUND

1. Pola wildcard lama `*` pada middleware memunculkan warning `path-to-regexp` di NestJS 12. Pola diganti menjadi named wildcard `{*path}` dan integration test akhir tidak lagi menghasilkan warning.
2. Sandbox tidak mengizinkan shared memory PostgreSQL, koneksi loopback, atau port HTTP sementara. Integration test dijalankan dengan izin terhadap cluster proyek dan database test acak; database development dan production tidak diubah.

Tidak ada error implementasi yang tersisa.

## NEXT STEP

STEP 05: Admin Authentication. Belum dimulai.

## STEP STATUS

PASS
