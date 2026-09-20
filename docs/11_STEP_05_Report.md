# STEP

STEP 05: Admin Authentication

## OBJECTIVE

Menyediakan authentication admin berbasis email/password, Argon2id, dan signed HttpOnly cookie untuk login, logout, serta current admin sesuai API specification.

## DEPENDENCIES

- PHASE 0: PASS.
- STEP 1: PASS.
- STEP 2: PASS.
- STEP 3: PASS.
- STEP 4: PASS.
- `@nestjs/jwt` 12.0.2 dengan `jsonwebtoken` 9.0.3.
- Argon2 0.45.1.

## FILES CREATED

```text
apps/api/src/modules/auth/auth.controller.ts
apps/api/src/modules/auth/auth.service.ts
apps/api/src/modules/auth/auth.types.ts
apps/api/src/modules/auth/login.input.ts
apps/api/src/modules/auth/session-cookie.ts
apps/api/src/modules/auth/session.constants.ts
apps/api/src/modules/auth/session.guard.ts
docs/11_STEP_05_Report.md
```

## FILES MODIFIED

```text
.env.example
README.md
apps/api/.env.example
apps/api/package.json
apps/api/src/common/config/environment.ts
apps/api/src/common/error-handling/api-exception.filter.ts
apps/api/src/modules/auth/auth.module.ts
apps/api/test/config.test.ts
apps/api/test/database/schema.test.ts
package-lock.json
scripts/local-postgres.mts
```

Enam dokumen source of truth tidak diubah.

## IMPLEMENTATION

- Menambahkan login dengan normalisasi email, pencarian admin, dan verifikasi password Argon2id.
- Menggunakan dummy Argon2id hash saat email tidak ditemukan agar jalur pemeriksaan password tetap setara.
- Mengembalikan `INVALID_CREDENTIALS` yang sama untuk email tidak dikenal, password salah, hash rusak, dan akun disabled saat login. Response tidak mengungkap keberadaan email.
- Memperbarui `last_login_at` hanya setelah kredensial admin aktif berhasil diverifikasi.
- Membuat JWT HS256 dengan issuer `wildera-api`, audience `wildera-admin`, subject admin ID, masa berlaku 8 jam, dan versi sesi.
- Menyimpan JWT hanya di cookie `wildera_admin_session`; token tidak dikirim di JSON response.
- Mengatur cookie dengan `HttpOnly`, `SameSite=Lax`, `Path=/`, dan expiration 8 jam. `Secure` aktif untuk staging dan production.
- Membuat session guard yang memverifikasi signature, algorithm, issuer, audience, expiration, versi sesi, keberadaan admin, serta status aktif.
- Membaca user dan role terbaru dari database pada request authenticated. Role diurutkan agar response stabil.
- Menggunakan `admin_users.updated_at` sebagai versi sesi. Login baru menggantikan sesi sebelumnya; logout memajukan versi secara atomik sehingga JWT lama ditolak, termasuk bila dipakai dari proses lain.
- Menghapus cookie pada logout dengan path dan security attributes yang sama.
- Memvalidasi request login dan mengembalikan 422 `VALIDATION_ERROR` beserta field errors.
- Memperluas global exception filter agar mempertahankan `fields` dari validation error.
- Mewajibkan `SESSION_SECRET` minimal 32 karakter dan menolak nilai placeholder.
- Memperbarui helper PostgreSQL lokal agar membuat `SESSION_SECRET` 256-bit acak bila belum tersedia, tanpa mencetak atau menimpa secret existing.

## DATABASE CHANGES

Tidak ada schema atau migration baru. Authentication menggunakan `admin_users`, `roles`, dan `admin_user_roles` yang sudah ditetapkan ERD.

Kolom `last_login_at` mencatat login berhasil. Kolom `updated_at` menjadi versi sesi sehingga logout dan login baru dapat mencabut token lama tanpa tabel session tambahan.

## API CHANGES

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@wildera.test",
  "password": "********"
}
```

Response 200 berisi user dan role. Header response mengatur cookie HttpOnly.

### Logout

```http
POST /api/v1/auth/logout
```

Membutuhkan session valid, mencabut versi sesi, menghapus cookie, dan mengembalikan 204 tanpa body.

### Current admin

```http
GET /api/v1/auth/me
```

Response 200:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Admin Wildera",
    "email": "admin@wildera.test",
    "roles": ["SUPER_ADMIN"]
  }
}
```

Session kosong, rusak, kedaluwarsa, atau sudah dicabut menghasilkan 401 `UNAUTHENTICATED`. Admin yang menjadi disabled setelah memiliki session menghasilkan 401 `ADMIN_DISABLED`.

## COMMANDS TO RUN

Development lokal:

```sh
npm run db:local:start
npm run db:deploy
npm run db:seed
npm run dev -w @wildera/api
```

Untuk database yang dikelola sendiri, set `DATABASE_URL` dan `SESSION_SECRET` acak minimal 32 karakter sebelum startup.

## TESTS PERFORMED

- Login valid menghasilkan 200, user envelope yang benar, role `SUPER_ADMIN`, dan cookie session.
- Email dinormalisasi dengan trim dan lowercase.
- Cookie development/test memiliki `HttpOnly`, `SameSite=Lax`, `Path=/`, max age 8 jam, dan tidak memiliki `Secure`.
- Cookie staging/production memiliki `Secure`.
- Password salah menghasilkan 401 `INVALID_CREDENTIALS`.
- Email tidak dikenal menghasilkan response 401 yang sama.
- Admin disabled menghasilkan response 401 yang sama dan tidak memperoleh cookie.
- Input email/password invalid menghasilkan 422 dengan field errors.
- Login sukses memperbarui `last_login_at`.
- `/auth/me` mengembalikan identitas dan role dari database.
- Session admin langsung ditolak dengan `ADMIN_DISABLED` setelah status akun diubah menjadi disabled.
- JWT rusak ditolak dengan 401 `UNAUTHENTICATED`.
- JWT kedaluwarsa ditolak dengan 401 `UNAUTHENTICATED`.
- Logout menghasilkan 204 dan invalidasi cookie.
- Cookie JWT lama dipakai ulang setelah logout dan ditolak.
- Regression suite health, schema, constraint, Prisma Client, seed, serta database reset tetap lulus.

## TEST RESULT

PASS.

- Unit tests: 3 passed, 0 failed.
- Database/integration tests: 35 passed, 0 failed.
- Seluruh acceptance test authentication: PASS.
- Lint dan formatting: PASS.
- Root serta seluruh workspace typecheck: PASS.
- Production build web/API: PASS.
- npm audit: 0 vulnerabilities.

## ACCEPTANCE CRITERIA

- [PASS] Login email/password admin tersedia.
- [PASS] Password diverifikasi dengan Argon2id.
- [PASS] Valid login menghasilkan authenticated session.
- [PASS] Password salah dan email tidak dikenal menghasilkan 401 generik.
- [PASS] Admin disabled tidak dapat login.
- [PASS] Session berada di HttpOnly cookie dan tidak dikirim untuk localStorage.
- [PASS] Cookie memakai `Secure` pada staging/production.
- [PASS] `/auth/me` menolak session kosong, rusak, kedaluwarsa, atau dicabut.
- [PASS] Logout menghapus cookie dan membuat JWT lama tidak valid.
- [PASS] `last_login_at` diperbarui saat login berhasil.

## ISSUES FOUND

1. ERD P0 tidak mempunyai tabel admin session. Versi sesi disimpan melalui `admin_users.updated_at`, sehingga invalidasi bekerja lintas proses tanpa menambah entity di luar source of truth. Efeknya, satu admin hanya mempunyai satu session login aktif; login baru mencabut session sebelumnya.
2. Akun disabled memakai `INVALID_CREDENTIALS` saat login untuk mencegah enumerasi email. Kode `ADMIN_DISABLED` hanya diberikan bila session yang sebelumnya sah digunakan setelah akun dinonaktifkan.
3. Sandbox tidak mengizinkan koneksi database dan port HTTP loopback. Integration test dijalankan dengan izin terhadap database test lokal acak; development dan production database tidak di-reset.

Tidak ada error implementasi yang tersisa.

## NEXT STEP

STEP 06: RBAC. Belum dimulai.

## STEP STATUS

PASS
