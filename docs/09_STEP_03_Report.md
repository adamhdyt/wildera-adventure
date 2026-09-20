# STEP

STEP 03: Database Seed

## OBJECTIVE

Membuat development seed yang aman dijalankan ulang dan menyediakan reset database lokal yang dapat mereproduksi data pengembangan sesuai dokumen proyek.

## DEPENDENCIES

- PHASE 0: PASS.
- STEP 1: PASS.
- STEP 2: PASS.
- PostgreSQL 18.6 dan migration `20260915120947_init_wildera_mvp`.
- Prisma CLI, Client, dan PostgreSQL adapter versi 7.10.0.
- Argon2 versi 0.45.1.

## FILES CREATED

```text
database/tsconfig.json
database/seeds/development.ts
scripts/reset-database.mts
apps/api/test/database/seed.test.ts
docs/09_STEP_03_Report.md
```

## FILES MODIFIED

```text
.env.example
README.md
apps/api/package.json
package.json
package-lock.json
prisma.config.ts
```

`database/seeds/.gitkeep` dihapus karena folder seed sudah berisi implementasi. Enam dokumen source of truth tidak diubah.

## IMPLEMENTATION

- Mendaftarkan `database/seeds/development.ts` sebagai seed command Prisma.
- Menambahkan perintah root `db:seed` dan `db:reset`.
- Menggunakan `upsert` dan ID fixture stabil untuk mencegah duplikasi ketika seed dijalankan ulang.
- Menyimpan password admin sebagai Argon2id. Password wajib diambil dari `SEED_ADMIN_PASSWORD`, minimal 12 karakter, dan nilai placeholder ditolak.
- Mempertahankan hash yang sama ketika password seed belum berubah, sehingga seed kedua tidak memodifikasi kredensial tanpa alasan.
- Memberikan role `SUPER_ADMIN` kepada admin seed. Role `OPERATIONS` dan `CONTENT` juga dibuat untuk RBAC tahap berikutnya.
- Menjaga sample Mountain, Route, Trip, dan Schedule berstatus `DRAFT`. Fixture tidak melewati publish workflow yang belum diimplementasikan.
- Menambahkan satu FAQ sesuai seed strategy ERD §104.
- Tidak membuat customer, booking, participant, atau Private Trip inquiry palsu.
- Membatasi reset ke PostgreSQL loopback dengan nama `wildera_development` atau database test Wildera. Nama seperti `wildera_production` ditolak sebelum Prisma dijalankan.

## SEEDED DATA

```text
Roles:
- SUPER_ADMIN
- OPERATIONS
- CONTENT

Admin:
- name/email dari environment dengan default Admin Wildera / admin@wildera.test
- role SUPER_ADMIN
- status ACTIVE

Catalog:
- Destination: Jawa Tengah
- Mountain: Gunung Prau
- Route: Prau via Patak Banteng
- Trip: Open Trip Prau

Schedule:
- 19–20 September 2026
- capacity 20
- status DRAFT

Packages:
- Start Jakarta — Rp1.250.000 — meeting point Blok M
- Start Basecamp — Rp750.000 — tanpa meeting point tersimpan

Content:
- 1 FAQ kategori Booking, status DRAFT
```

## DATABASE CHANGES

Tidak ada perubahan schema atau migration. STEP 3 hanya menambahkan data fixture dan tooling untuk seed/reset.

Development database proyek tidak di-reset selama verifikasi. Pengujian menggunakan database sementara lokal bernama acak dan menghapusnya setelah selesai.

## API CHANGES

Tidak ada endpoint atau perubahan runtime NestJS. Paket `argon2` ditambahkan sebagai dependency backend agar format password seed sama dengan kebutuhan authentication pada STEP 5.

## COMMANDS TO RUN

Isi root `.env` dengan kredensial development:

```dotenv
SEED_ADMIN_PASSWORD=password-development-minimal-12-karakter
SEED_ADMIN_EMAIL=admin@wildera.test
SEED_ADMIN_NAME=Admin Wildera
```

Kemudian jalankan:

```sh
npm run db:local:start
npm run db:deploy
npm run db:seed
```

Untuk menghapus data development dan mereproduksi fixture:

```sh
npm run db:reset
```

`db:reset` bersifat destruktif untuk database yang dipilih. Guard script membatasi target ke database lokal development/test Wildera.

## TESTS PERFORMED

- Menjalankan seed dua kali pada database sementara.
- Memastikan hitungan data tetap 3 role, 1 admin, 1 destination, 1 mountain, 1 route, 1 trip, 1 schedule, 2 package, 1 meeting point, dan 1 FAQ.
- Memastikan customer dan booking tetap kosong.
- Memverifikasi admin hanya memiliki role `SUPER_ADMIN`.
- Memverifikasi password hash berawalan `$argon2id$` dan cocok dengan password environment.
- Memastikan hash tidak berubah pada seed kedua.
- Memverifikasi nama katalog, tanggal schedule, capacity, harga package, dan relasi meeting point.
- Menambahkan data sementara, menjalankan reset, lalu memastikan data tersebut hilang dan fixture kembali lengkap.
- Memastikan reset menolak target lokal bernama `wildera_production`.
- Menjalankan seluruh database tests, lint, typecheck, unit/smoke test, production build, formatting check, dan dependency audit.

## TEST RESULT

PASS.

- Database tests: 33 passed, 0 failed.
- API smoke test: 1 passed, 0 failed.
- Lint: PASS.
- Typecheck: PASS.
- Production build web/API: PASS.
- Prettier check: PASS.
- npm audit: 0 vulnerabilities.

## ACCEPTANCE CRITERIA

- [PASS] Role `SUPER_ADMIN`, `OPERATIONS`, dan `CONTENT` tersedia.
- [PASS] Satu admin aktif memiliki role `SUPER_ADMIN` dan hash Argon2id.
- [PASS] Satu destination, mountain, route, trip, schedule, dan meeting point tersedia.
- [PASS] Schedule 19–20 September 2026 memiliki capacity 20.
- [PASS] Package Start Jakarta dan Start Basecamp tersedia.
- [PASS] FAQ development tersedia sesuai ERD.
- [PASS] Seed kedua tidak membuat duplikasi atau mengganti hash valid.
- [PASS] Reset database lokal mereproduksi fixture dan membuang data tambahan.
- [PASS] Reset menolak target yang tidak memenuhi guard development/test lokal.
- [PASS] Tidak ada fake customer atau booking.

## ISSUES FOUND

1. Sandbox tidak mengizinkan shared memory PostgreSQL, koneksi loopback, atau port smoke test. Pemeriksaan terkait dijalankan dengan izin terhadap cluster khusus proyek di `127.0.0.1:55432`.
2. Prisma CLI mendeteksi `migrate reset --force` sebagai tindakan destruktif dan meminta persetujuan eksplisit. Pengguna menyetujui reset database test sementara; perintah kemudian berhasil. Database development dan production tidak di-reset.
3. `migrate reset` memang menghapus semua data target. Script memberi guard tambahan untuk host dan nama database, tetapi developer tetap harus memeriksa `DATABASE_URL` sebelum menjalankan perintah.

Tidak ada error implementasi yang tersisa.

## NEXT STEP

STEP 04: Backend Foundation. Belum dimulai.

## STEP STATUS

PASS
