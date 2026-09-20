# Wildera Adventure

Monorepo website open trip/private trip Wildera Adventure. Tahap saat ini: STEP 7, admin layout. Frontend memiliki login, logout, sidebar responsif, pemeriksaan session di server, dan navigasi sesuai role. NestJS menyediakan authentication serta RBAC untuk tiga role admin. Modul bisnis ditampilkan sebagai halaman “Belum tersedia” sampai tahap implementasinya.

## Prasyarat

- Node.js 24.12.x atau versi 24.x yang lebih baru (`nvm use`).
- npm 11.x; lockfile dibuat dengan npm 11.18.0.

Next.js 16.3.5, React 19.3.0 dan NestJS 12.0.3 dipilih dari registry saat inisialisasi. NestJS dibangun dengan TypeScript compiler tanpa generator CLI. Referensi setup: [Next.js](https://nextjs.org/docs/app/getting-started/installation) dan [NestJS](https://docs.nestjs.com/first-steps).

## Menjalankan development

```sh
npm ci
npm run db:local:start
npm run db:deploy
npm run db:generate
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

- Web: http://127.0.0.1:3000, halaman publik sementara. Panel admin: http://127.0.0.1:3000/admin/login.
- API: http://127.0.0.1:3001. `GET /health` memeriksa aplikasi dan database. Authentication tersedia di `/api/v1/auth/login`, `/api/v1/auth/logout`, dan `/api/v1/auth/me`. HTTP 404 JSON pada `/api/v1/trips` masih diharapkan karena business endpoint belum dibuat.
- `Ctrl+C` menghentikan kedua aplikasi.

Next.js memuat env lokal di `apps/web`. Backend mencari `apps/api/.env`, lalu root `.env`; helper PostgreSQL menulis `DATABASE_URL` dan `SESSION_SECRET` acak ke root `.env` bila keduanya belum ada. Nilai existing dipertahankan dan secret tidak dicetak. Backend berhenti saat startup bila konfigurasi wajib tidak valid. Untuk API production yang perlu diakses container/network, set `HOST=0.0.0.0` secara eksplisit. Port web dapat diatur dengan `PORT=3002 npm run dev -w @wildera/web`.

Menjalankan aplikasi terpisah:

```sh
npm run dev -w @wildera/web
npm run dev -w @wildera/api
```

## Pemeriksaan

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run format:check
```

`npm test` menguji validasi konfigurasi, kebijakan cookie, dan matriks permission tanpa membutuhkan database. Integration test database dan HTTP terpisah melalui `npm run db:test`; suite tersebut membuktikan aplikasi dapat boot, `/health` menjalankan query, authentication bekerja, dan akses API langsung ditolak sesuai role. `typecheck` dan `build` membangkitkan Prisma Client terlebih dahulu; `typecheck` juga membangkitkan route types Next.js. Jalankan perintah tersebut berurutan karena semuanya dapat menulis generated files. Formatting mengecualikan keenam source-of-truth, blueprint pengguna, data cluster lokal dan generated client.

Build web menggunakan webpack melalui opsi resmi Next.js. Ini menghindari kebutuhan port helper Turbopack pada environment CI/sandbox yang membatasi bind localhost.

## PostgreSQL dan Prisma

Prisma CLI/Client/adapter menggunakan versi 7.10.0. Schema: `database/schema.prisma`. Migration SQL: `database/migrations`. Client dihasilkan ke `apps/api/src/generated/prisma` dengan module format CommonJS untuk backend. Generated output tidak di-commit.

Setup lokal macOS dengan PostgreSQL 18:

```sh
brew install postgresql@18
npm run db:local:start
npm run db:deploy
npm run db:generate
npm run db:status
npm run db:test
```

`db:local:start` membuat cluster khusus di `.local/postgres` pada `127.0.0.1:55432`, menggunakan SCRAM dan password acak. Root `.env` memperoleh `DATABASE_URL` jika belum ada; URL existing tidak ditimpa. Jangan copy root `.env.example` terlebih dahulu untuk alur otomatis ini. Jika sudah berisi URL lain, URL cluster lokal tersedia di `.local/database.env`. Semua file kredensial diabaikan Git, menggunakan permission 0600, dan tidak dicetak ke terminal.

Tidak menggunakan Homebrew service/autostart. Cluster tetap berjalan setelah terminal ditutup; hentikan ketika tidak diperlukan:

```sh
npm run db:local:status
npm run db:local:stop
```

Untuk binary PostgreSQL pada lokasi lain, set `PG_BIN` ke direktori yang berisi `postgres`, `initdb`, `pg_ctl`, `psql`, dan `createdb`. Untuk database yang disiapkan sendiri, isi `DATABASE_URL` di root `.env` atau environment proses dan lewati `db:local:*`. Server PostgreSQL deployment tetap managed dan terpisah dari lokal.

Workflow perubahan schema berikutnya:

```sh
npm run db:format
npm run db:validate
npm run db:migrate -- --name nama_perubahan --create-only
# Review migration SQL, termasuk CHECK constraint yang tidak direpresentasikan Prisma.
npm run db:deploy
npm run db:generate
npm run db:test
```

Development seed membutuhkan password admin dari environment. Tambahkan nilai lokal ke root `.env` tanpa mengirimkannya ke Git:

```dotenv
SEED_ADMIN_PASSWORD=password-development-minimal-12-karakter
SEED_ADMIN_EMAIL=admin@wildera.test
SEED_ADMIN_NAME=Admin Wildera
```

Jalankan seed tanpa menghapus data:

```sh
npm run db:seed
```

Untuk menghapus seluruh data development, menerapkan ulang semua migration, lalu membuat fixture yang sama:

```sh
npm run db:reset
```

`db:reset` menolak host nonlokal dan hanya menerima nama `wildera_development` atau database test Wildera. Seed dapat dijalankan berulang tanpa duplikasi. Password disimpan sebagai Argon2id. Fixture mencakup tiga role, satu admin SUPER_ADMIN, katalog Gunung Prau, jadwal 19–20 September 2026 berkapasitas 20, paket Start Jakarta dan Start Basecamp, meeting point Blok M, serta satu FAQ. Tidak ada customer atau booking palsu.

Database tests membutuhkan server lokal PostgreSQL 18 dan user dengan CREATEDB. Setiap run membuat database sementara bernama acak, menerapkan migration dari nol, menguji constraint, client Prisma, seed idempotent serta reproduksi reset, lalu menghapus hanya database sementara tersebut.

CHECK constraint dan trigger append-only audit ada di SQL migration. `prisma migrate diff` tidak cukup untuk memverifikasi fitur SQL yang tidak direpresentasikan schema Prisma; `db:test` menguji perilakunya langsung.

Kapasitas lintas booking belum ditegakkan oleh schema ini: konfirmasi transactional, lock schedule, validasi occupancy dan concurrency test wajib dibuat pada tahap capacity engine sebelum launch.

## Admin authentication

Backend membutuhkan `SESSION_SECRET` acak minimal 32 karakter. `db:local:start` membuatnya otomatis untuk development lokal. Untuk environment yang dikelola sendiri, buat secret terpisah dan simpan di secret manager:

```sh
openssl rand -hex 32
```

Login mengatur cookie `wildera_admin_session` selama 8 jam dengan `HttpOnly`, `SameSite=Lax`, dan `Path=/`. Atribut `Secure` aktif pada staging dan production. JWT tidak dikembalikan di response body dan tidak perlu disimpan di localStorage.

Contoh pengujian manual:

```sh
curl -i -c /tmp/wildera-cookie.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@wildera.test","password":"password-development"}' \
  http://127.0.0.1:3001/api/v1/auth/login
curl -i -b /tmp/wildera-cookie.txt http://127.0.0.1:3001/api/v1/auth/me
curl -i -b /tmp/wildera-cookie.txt -X POST http://127.0.0.1:3001/api/v1/auth/logout
```

Seed admin menggunakan `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD` dari root `.env`. Login baru menggantikan sesi lama untuk admin yang sama. Logout memajukan versi sesi di database dan menghapus cookie, sehingga cookie lama ditolak.

## Admin authorization

Backend memakai role `SUPER_ADMIN`, `OPERATIONS`, dan `CONTENT`. `SUPER_ADMIN` memiliki seluruh permission. `OPERATIONS` mengelola trip, jadwal, booking, peserta, private trip, dan katalog; akses content, setting, serta audit dibatasi ke mode baca yang sesuai. `CONTENT` mengelola trip, katalog, dan content serta hanya membaca jadwal dan setting. Role `CONTENT` tidak dapat mengonfirmasi atau membatalkan booking maupun melihat data sensitif peserta.

Endpoint admin baru harus memakai decorator berikut agar session dan permission diperiksa bersama:

```ts
@Authorize(Permission.BOOKING_CONFIRM)
```

Request tanpa sesi menghasilkan 401 `UNAUTHENTICATED`. Request dengan role yang tidak mempunyai permission menghasilkan 403 `FORBIDDEN`. Role dibaca dari database pada setiap request authenticated, sehingga perubahan role berlaku tanpa login ulang.

## Admin frontend

Salin `apps/web/.env.example` ke `apps/web/.env.local` bila belum tersedia. `API_BASE_URL` adalah alamat API yang hanya dipakai server Next.js. `APP_URL` harus cocok dengan origin browser, termasuk protokol dan port; misalnya `http://127.0.0.1:3000`. Login/logout melalui proxy dengan pemeriksaan origin, lalu cookie HttpOnly dari backend diteruskan ke browser.

Halaman admin memeriksa session melalui `/auth/me` dengan `no-store`. Navigasi memakai pemuatan dokumen penuh agar session dan role sidebar selalu diperiksa kembali. Setiap halaman juga memeriksa role di server. Tampilan akses dibatasi adalah state UI; API bisnis tetap wajib memakai guard RBAC backend dan mengembalikan 403.

Sidebar mencakup dashboard, trip, jadwal, booking, private trip, destinasi, gunung, jalur pendakian, konten, dan pengaturan. CONTENT tidak melihat menu booking/private trip dan tidak dapat membuka isinya lewat URL langsung. Dashboard belum menampilkan metrik karena endpoint bisnis belum tersedia.

Uji browser membutuhkan PostgreSQL lokal dan Chromium:

```sh
npx playwright install chromium
npm run db:local:start
npm run test:admin
npm run db:local:stop
```

Runner membuat database acak `wildera_admin_test_*`, menerapkan migration, menjalankan web/API pada port 3100/3101, kemudian menghapus database test dan menghentikan kedua server. Data development tidak dipakai. Screenshot desktop/mobile tersimpan di `apps/web/test-results/` dan diabaikan Git. Pengujian mencakup login, logout, cookie dicabut, semua menu, role berubah, akun disabled, mobile/keyboard, serta kegagalan dan pemulihan layanan.

Build dan menjalankan hasilnya (dua terminal):

```sh
npm run build
npm run start -w @wildera/web
npm run start -w @wildera/api
```

## Struktur

```text
apps/
  web/                Next.js App Router, React, Tailwind
  api/                NestJS, TypeScript
    src/common/       Config, database, logger, error handling, health
    src/modules/      15 feature module P0
packages/
  ui/                 Slot shared UI, belum ada komponen bisnis
  types/              Slot kontrak bersama, belum ada tipe domain
  validation/         Slot validasi bersama, belum ada rule domain
  config/             Konfigurasi TypeScript bersama
docs/                 Source of truth dan laporan tahap
database/
  schema.prisma       25 entity P0
  migrations/         init_wildera_mvp dan migration berikutnya
  seeds/              Fixture development idempotent
infrastructure/       Konfigurasi infra pada tahap berikutnya
scripts/              Pengelolaan PostgreSQL lokal
```

Shared package UI/types/validation berisi source TypeScript dan ditranspilasi Next.js saat digunakan. Belum diimpor backend; kontrak runtime backend perlu ekspor compiled ketika mulai dipakai. Package belum dibuat berisi model bisnis spekulatif.

## Batas tahap

Backend membutuhkan `DATABASE_URL` dan `SESSION_SECRET` yang valid. Authentication, permission berbasis role, dan layout admin sudah berjalan. Feature module bisnis masih berupa batas domain tanpa controller/service. Admin memakai noindex; metadata halaman publik sementara perlu diperbarui saat SEO diimplementasikan.

Lihat [validasi dokumen](docs/00_Document_Validation.md). Prioritas dokumen: PRD → UX → Architecture → ERD → API → Backlog, dengan instruksi eksplisit pengguna sebagai acuan implementasi tahap ini.

Laporan terbaru: [STEP 7](docs/13_STEP_07_Report.md). STEP 8 belum dimulai.
