# STEP

STEP 02: PostgreSQL + Prisma Foundation

## OBJECTIVE

Menyiapkan PostgreSQL dan Prisma untuk 25 entity P0 yang ditentukan ERD, membuat migration `init_wildera_mvp`, dan membuktikan schema dapat dibuat ulang dari database kosong.

## DEPENDENCIES

- PHASE 0: PASS.
- STEP 1: PASS.
- PostgreSQL 18.6 tersedia secara lokal.
- Prisma CLI, Client, dan PostgreSQL adapter versi 7.10.0.

## FILES CREATED

```text
database/schema.prisma
database/migrations/migration_lock.toml
database/migrations/20260915120947_init_wildera_mvp/migration.sql
prisma.config.ts
scripts/local-postgres.mts
tsconfig.tooling.json
apps/api/test/database/schema.test.ts
docs/08_STEP_02_Report.md
```

Prisma Client dihasilkan ke `apps/api/src/generated/prisma` saat build/typecheck/database test dan diabaikan Git.

## FILES MODIFIED

```text
.env.example
.gitignore
.prettierignore
README.md
apps/api/package.json
eslint.config.mjs
package.json
package-lock.json
```

`database/migrations/.gitkeep` dihapus karena folder sekarang berisi migration nyata. Enam dokumen source of truth tidak diubah.

## IMPLEMENTATION

- Menambahkan datasource PostgreSQL dan Prisma generator CommonJS yang cocok dengan backend NestJS saat ini.
- Memetakan tepat 25 entity P0: Destination, Mountain, Route, Trip, TripItinerary, TripFacility, TripGear, TripFaq, TripSchedule, MeetingPoint, SchedulePackage, Customer, Booking, BookingParticipant, PrivateTripInquiry, MediaAsset, TripMedia, MountainMedia, Faq, ContentPage, SiteSetting, AdminUser, Role, AdminUserRole, dan AuditLog.
- Menambahkan 15 enum PostgreSQL. Schedule lifecycle hanya memakai `DRAFT`, `OPEN`, `CLOSED`, `CANCELLED`, dan `COMPLETED`; availability tetap computed.
- Menggunakan UUID internal, TIMESTAMPTZ, DATE, JSONB, INET, dan NUMERIC(14,2) sesuai ERD.
- Menambahkan index untuk query katalog, schedule, booking, private lead, dan audit.
- Menambahkan composite foreign key `(package_id, schedule_id)` agar database menolak package yang bukan milik schedule booking.
- Menambahkan CHECK constraint untuk durasi, rentang usia, itinerary day, schedule capacity/date/minimum peserta, nilai uang, participant count, dan destination Private Trip.
- Menambahkan trigger PostgreSQL yang menolak UPDATE, DELETE, dan TRUNCATE pada `audit_logs` agar append-only juga berlaku untuk akses SQL langsung.
- Tidak membuat `available_seats`, package capacity, guide/P1 table, payment, customer auth, atau future table lain.
- Menambahkan pengelola cluster lokal khusus proyek pada port 55432 dengan SCRAM dan password acak. Kredensial berada di file ignored dengan permission 0600.

## DATABASE CHANGES

Migration `20260915120947_init_wildera_mvp` membuat 25 tabel P0, 15 enum, primary key, unique constraint, foreign key, index, CHECK constraint, serta trigger append-only audit.

Development database `wildera_development` dibuat pada cluster proyek. Tidak ada data seed atau fixture persisten. Database test memakai database sementara bernama acak dan menghapusnya setelah test.

## API CHANGES

Belum ada endpoint atau koneksi Prisma pada runtime NestJS. Prisma Client dan adapter PostgreSQL sudah tersedia untuk DatabaseModule pada STEP 4. `/health` tetap belum dibuat.

## COMMANDS TO RUN

```sh
brew install postgresql@18
npm ci
npm run db:local:start
npm run db:deploy
npm run db:generate
npm run db:status
npm run db:test
```

Hentikan cluster dengan `npm run db:local:stop`. Detail penggunaan database external dan workflow migration tersedia di README.

## TESTS PERFORMED

- `prisma format` dan `prisma validate`.
- `prisma migrate deploy` pada development database.
- `prisma migrate status`: satu migration, schema up to date.
- Fresh migration pada database sementara kosong.
- 32 database assertions/subtests untuk table/enum/FK/PK, constraint invalid data, composite package/schedule, audit append-only, money precision, incomplete participant detail, duplicate WhatsApp customer, serta Prisma Client read/write.
- `prisma migrate diff --from-config-datasource --to-schema database/schema.prisma --exit-code`: tidak ada drift yang direpresentasikan Prisma.
- Root lint, typecheck, unit/smoke test, build, formatting, dan dependency audit.

## TEST RESULT

PASS. Migration dapat diterapkan ulang dari nol. Prisma generate berhasil. Semua database test lulus.

Pengujian STEP 2 belum membuktikan proteksi overselling. Constraint lintas total confirmed booking membutuhkan transaction dan row lock di capacity engine.

## ACCEPTANCE CRITERIA

- [PASS] PostgreSQL development database tersedia.
- [PASS] `DATABASE_URL` terdokumentasi dan kredensial lokal nyata tidak di-commit.
- [PASS] Schema berisi tepat 25 entity P0; P1/future entity tidak dibuat.
- [PASS] Migration `init_wildera_mvp` sukses pada database kosong.
- [PASS] Semua tabel memiliki primary key.
- [PASS] Foreign key valid dan delete rule operasional memakai RESTRICT.
- [PASS] Enum PostgreSQL berhasil dibuat.
- [PASS] CHECK dan unique constraint menolak data invalid yang diuji.
- [PASS] Package tidak mempunyai capacity/available seats dan terkait ke schedule booking secara konsisten.
- [PASS] `available_seats` tidak disimpan.
- [PASS] Prisma Client generate dan read/write berhasil.

## ISSUES FOUND

1. Homebrew awalnya gagal menyelesaikan postinstall PostgreSQL karena formula service dibaca oleh Homebrew lama. Setelah `brew update` dan `brew postinstall`, PostgreSQL 18.6 terpasang dan binary tervalidasi.
2. npm audit menemukan advisori transitif pada `deepmerge-ts` dan `mysql2` milik Prisma CLI. Root override menggunakan versi patched yang kompatibel; audit akhir tidak menemukan vulnerability dan Prisma validate/generate/migrate tetap lulus.
3. PostgreSQL 18 mengembalikan SQLSTATE `23001` untuk pelanggaran `ON DELETE/UPDATE RESTRICT`, berbeda dari `23503` pada versi lama. Assertion disesuaikan dengan perilaku server yang benar.
4. Dua perintah `prisma generate` paralel dapat menulis direktori output yang sama. Semua final checks dijalankan berurutan dan README menjelaskan batas ini.
5. Sandbox kerja tidak mengizinkan shared memory PostgreSQL atau koneksi loopback. Server dan database integration test akhir dijalankan di luar sandbox terhadap cluster khusus proyek. Tidak ada database external yang diubah.
6. Turbopack production build mencoba membuka port helper lokal dan gagal dengan EPERM di lingkungan ini. Script build web memakai opsi resmi `next build --webpack`; production build kemudian lulus tanpa perubahan output aplikasi.
7. Formatter sempat menormalkan bullet pada dokumen prompt pengguna. Isi dipulihkan byte-for-byte dari lampiran asli, hash SHA-256 kembali identik, dan file tersebut sekarang masuk daftar pengecualian formatter.

Tidak ada error implementasi yang tersisa.

## NEXT STEP

STEP 03: Database Seed. Belum dimulai.

## STEP STATUS

PASS
