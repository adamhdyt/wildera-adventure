# STEP

STEP 06: Role-Based Access Control (RBAC)

## OBJECTIVE

Menerapkan authorization backend berbasis permission untuk role `SUPER_ADMIN`, `OPERATIONS`, dan `CONTENT`, termasuk penolakan akses API langsung dengan 403 `FORBIDDEN`.

## DEPENDENCIES

- PHASE 0: PASS.
- STEP 1–5: PASS.
- Session admin dari STEP 5.
- Role dan relasi admin-role dari schema P0.

## FILES CREATED

```text
apps/api/src/common/authorization/authorization.module.ts
apps/api/src/common/authorization/authorize.decorator.ts
apps/api/src/common/authorization/permission.guard.ts
apps/api/src/common/authorization/permission.ts
apps/api/src/common/authorization/require-permissions.decorator.ts
apps/api/test/authorization.test.ts
docs/12_STEP_06_Report.md
```

## FILES MODIFIED

```text
README.md
apps/api/src/app.module.ts
apps/api/src/modules/auth/auth.module.ts
apps/api/test/database/schema.test.ts
```

Enam dokumen source of truth tidak diubah.

## IMPLEMENTATION

- Menetapkan permission terpisah untuk dashboard, trip, jadwal, booking, peserta, private trip, katalog, content, setting, admin user, dan audit.
- Memberi `SUPER_ADMIN` seluruh permission melalui kebijakan full access.
- Memberi `OPERATIONS` akses operasional penuh untuk trip, jadwal, booking, peserta, private trip, dan katalog, serta akses baca terbatas untuk content, setting, dan audit.
- Memberi `CONTENT` akses kelola trip, katalog, dan content, serta akses baca untuk jadwal dan setting.
- Tidak memberi `CONTENT` permission booking, private trip, participant, admin user, atau audit.
- Membuat `PermissionGuard` yang membaca role terbaru dari authenticated request dan memeriksa semua permission yang diwajibkan endpoint.
- Membuat decorator `@Authorize(...)` yang selalu memasang `SessionGuard` dan `PermissionGuard` bersama, sehingga endpoint tidak dapat memasang permission tanpa pemeriksaan sesi.
- Mengembalikan 401 `UNAUTHENTICATED` untuk request tanpa session dan 403 `FORBIDDEN` untuk admin authenticated dengan role yang tidak sesuai.
- Mendukung lebih dari satu role dengan gabungan permission dari seluruh role admin.
- Menguji perubahan role di database pada session yang sama; hak akses baru berlaku pada request berikutnya tanpa login ulang.

## PERMISSION MATRIX

| Area               | SUPER_ADMIN              | OPERATIONS                     | CONTENT                  |
| ------------------ | ------------------------ | ------------------------------ | ------------------------ |
| Dashboard          | Full                     | Full                           | Limited view             |
| Trip               | View/create/edit/publish | View/create/edit/publish       | View/create/edit/publish |
| Schedule           | Full                     | Full                           | View                     |
| Booking            | Full                     | Full                           | No access                |
| Participants       | Full                     | Full, including sensitive data | No access                |
| Private trip leads | Full                     | Full                           | No access                |
| Mountains/catalog  | Full                     | Full                           | Full                     |
| FAQ/content        | Full                     | View                           | Full                     |
| Settings           | Full                     | View                           | View                     |
| Admin users        | Full                     | No access                      | No access                |
| Audit              | Full                     | Limited view                   | No access                |

## DATABASE CHANGES

Tidak ada schema, migration, atau fixture production baru. Authorization memakai role yang sudah tersedia pada tabel `roles` dan `admin_user_roles`.

## API CHANGES

Tidak ada endpoint bisnis production baru pada tahap ini. Infrastruktur authorization siap dipakai oleh controller tahap berikutnya:

```ts
@Authorize(Permission.BOOKING_CONFIRM)
```

Response role salah mengikuti error envelope global dengan HTTP 403 dan kode `FORBIDDEN`. Endpoint khusus pengujian RBAC hanya didefinisikan di test harness dan tidak masuk production build.

## COMMANDS TO RUN

```sh
npm test -w @wildera/api
npm run db:local:start
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION='ya saya izinkan' npm run db:test
npm run lint
npm run typecheck
npm run build
npm run format:check
```

## TESTS PERFORMED

- `SUPER_ADMIN` menerima setiap permission.
- `OPERATIONS` menerima permission operasional dan hanya dapat membaca content.
- `CONTENT` dapat mengelola katalog/content serta trip, dan dapat membaca jadwal.
- `CONTENT` ditolak saat mengonfirmasi booking, membatalkan booking, dan melihat data peserta sensitif.
- Akses API langsung dengan role salah menghasilkan 403 `FORBIDDEN` dalam error envelope.
- Request tanpa session menghasilkan 401 `UNAUTHENTICATED`.
- Perubahan role database langsung mengubah authorization untuk session aktif.
- Regression authentication, health, schema constraint, Prisma Client, seed, dan reset tetap lulus.

## TEST RESULT

PASS.

- Unit tests: 7 passed, 0 failed.
- Database/integration tests: 36 passed, 0 failed.
- RBAC API acceptance tests: PASS.
- Lint dan formatting: PASS.
- Root serta seluruh workspace typecheck: PASS.
- Production build web/API: PASS.
- npm audit: 0 vulnerabilities.

## ACCEPTANCE CRITERIA

- [PASS] Tiga role admin mempunyai matriks permission yang eksplisit.
- [PASS] `SUPER_ADMIN` mempunyai full access.
- [PASS] `OPERATIONS` dapat mengelola trip, schedule, booking, participant, dan private trip.
- [PASS] `CONTENT` dapat mengelola catalog/content dan trip serta membaca schedule.
- [PASS] `CONTENT` tidak dapat confirm booking.
- [PASS] `CONTENT` tidak dapat cancel booking.
- [PASS] `CONTENT` tidak dapat melihat data participant sensitif.
- [PASS] Role salah melalui direct API menghasilkan 403 `FORBIDDEN`.
- [PASS] Role terbaru dibaca dari database untuk setiap authenticated request.

## ISSUES FOUND

1. Endpoint bisnis belum tersedia pada STEP 6. Enforcement HTTP diuji melalui controller yang hanya hidup di integration test; controller production berikutnya wajib memakai `@Authorize(...)`.
2. Pembatasan dashboard untuk `CONTENT` dan audit untuk `OPERATIONS` disediakan sebagai permission terbatas. Bentuk payload terbatas diterapkan ketika endpoint area tersebut dibuat.
3. Sandbox tidak mengizinkan koneksi database dan port HTTP loopback. Integration test dijalankan dengan izin terhadap database test lokal acak; development dan production database tidak di-reset.

Tidak ada error implementasi yang tersisa.

## NEXT STEP

STEP 07: Admin layout. Belum dimulai.

## STEP STATUS

PASS
