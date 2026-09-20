# STEP

STEP 07: Admin Layout

## OBJECTIVE

Membangun frontend admin dengan login, protected layout, sidebar, header, loading, error, dan forbidden state. Struktur mengutamakan pekerjaan operasional sesuai UX, dengan styling dasar yang konsisten dan responsif.

## DEPENDENCIES

- PHASE 0 dan STEP 1–6: PASS.
- Authentication cookie dan pemeriksaan role database dari NestJS.
- Playwright 1.63.0 untuk uji browser Chromium.

## FILES CREATED

```text
apps/web/src/lib/admin-session.ts
apps/web/src/lib/admin-navigation.ts
apps/web/src/app/api/admin/auth/[action]/route.ts
apps/web/src/app/admin/layout.tsx
apps/web/src/app/admin/page.tsx
apps/web/src/app/admin/admin.css
apps/web/src/app/admin/loading.tsx
apps/web/src/app/admin/error.tsx
apps/web/src/app/admin/not-found.tsx
apps/web/src/app/admin/login/page.tsx
apps/web/src/app/admin/login/login-form.tsx
apps/web/src/app/admin/(protected)/layout.tsx
apps/web/src/app/admin/(protected)/shell.tsx
apps/web/src/app/admin/(protected)/[section]/page.tsx
apps/web/playwright.config.ts
apps/web/test/admin.spec.ts
scripts/test-admin.mts
docs/13_STEP_07_Report.md
```

## FILES MODIFIED

```text
.gitignore
README.md
package.json
package-lock.json
apps/web/package.json
apps/web/.env.example
```

## IMPLEMENTATION

- Login memakai email/password dengan label, autocomplete, validasi native, tombol tampil/sembunyikan kata sandi, pending state, serta pesan kegagalan.
- Proxy same-origin hanya menyediakan POST login/logout. Origin wajib sesuai `APP_URL`; request cross-origin ditolak dengan 403.
- Cookie HttpOnly diteruskan dari backend tanpa mengirim token dalam JSON atau menyimpannya di localStorage. Atribut cookie mengikuti backend, termasuk Secure pada staging/production.
- Protected layout dan setiap halaman memverifikasi session lewat `/auth/me` dengan `no-store` dan timeout delapan detik.
- Request tanpa session atau dengan session tidak berlaku diarahkan ke login. Gangguan layanan menampilkan error state dan tombol pemulihan.
- Sidebar disaring berdasarkan role. CONTENT tidak memperoleh menu booking/private trip; direct URL diperiksa lagi di server sebelum halaman dirender.
- Navigasi memakai pemuatan dokumen penuh agar shell, role, dan sesi diperbarui setiap berpindah halaman. Ini sengaja mengutamakan kesegaran akses pada fondasi admin.
- Sidebar desktop berubah menjadi menu disclosure pada layar sempit. Menu bekerja dengan Enter, dapat ditutup dengan Escape, dan mengembalikan fokus ke tombol menu.
- Header menampilkan nama serta role admin dan menyediakan logout dengan feedback kegagalan.
- Logout berhasil membatalkan sesi backend; cookie lama ditolak. Logout dengan sesi kedaluwarsa juga menghapus cookie browser.
- Seluruh halaman admin memiliki metadata noindex. Tersedia loading, error, akses dibatasi, dan halaman tidak ditemukan.
- Modul bisnis memakai status “Belum tersedia”. Tidak ada angka dashboard, booking, atau data peserta buatan di UI.

## DESIGN READ

Panel operasional untuk tim perjalanan, dengan bahasa visual natural, mudah dibaca, dan minim dekorasi. ENERGY 1 / RHYTHM 1 / MOTION 1, diturunkan dari UX bagian Admin UX Principles, Typography, dan Design Tone.

- Hijau gelap menandai aksi utama dan lokasi navigasi aktif; latar hangat serta sidebar hijau pucat mengikuti arah natural pada brief.
- Arial/Helvetica mempertahankan keterbacaan label dan formulir yang padat, tanpa ketergantungan unduhan font.
- Heading kuat dan pengelompokan operasional/katalog menjadi struktur; label domain perjalanan memberi konteks yang konsisten.
- Login mempunyai dua kolom pada desktop dan urutan satu kolom pada mobile. Garis hijau pada panel menandai area masuk yang menjadi fokus layar.
- Tema terang dipilih untuk ruang kerja berbasis formulir dan bacaan; tidak ada toggle tema, animasi dekoratif, ikon stok, atau aset logo baru.

## DATABASE CHANGES

Tidak ada schema atau migration production baru. Runner browser membuat database lokal acak `wildera_admin_test_*`, menerapkan migration existing, lalu menghapus database tersebut setelah selesai. Fixture admin hanya dibuat dalam database test.

## API CHANGES

Frontend menambahkan `POST /api/admin/auth/login` dan `POST /api/admin/auth/logout` sebagai proxy ke API authentication existing. `API_BASE_URL` tetap server-only; `APP_URL` menetapkan origin yang diizinkan.

Route frontend tersedia:

```text
/admin/login
/admin/dashboard
/admin/destinations
/admin/mountains
/admin/routes
/admin/trips
/admin/schedules
/admin/bookings
/admin/private-trips
/admin/content
/admin/settings
```

Forbidden pada halaman adalah tampilan akses dibatasi, bukan kontrak HTTP 403 API bisnis. Backend tetap wajib menerapkan `@Authorize(...)` pada endpoint bisnis saat dibangun.

## COMMANDS TO RUN

Development setelah mengisi env dan seed admin:

```sh
npm run db:local:start
npm run dev
```

Buka `http://127.0.0.1:3000/admin/login`. `apps/web/.env.local` memerlukan `API_BASE_URL=http://127.0.0.1:3001/api/v1` dan `APP_URL=http://127.0.0.1:3000`. Gunakan origin yang sama di browser.

Validasi:

```sh
npx playwright install chromium
npm run test:admin
npm test
npm run lint
npm run typecheck
npm run build
npm run format:check
```

Runner browser memakai port 3100/3101 dan menghentikan server web/API setelah selesai. PostgreSQL lokal dihentikan setelah seluruh validasi tahap.

## TESTS PERFORMED

Lima skenario browser Chromium dengan backend dan PostgreSQL nyata:

1. Redirect tanpa session, login salah/benar, toggle password, cookie HttpOnly, noindex, semua sepuluh menu, tampilan belum tersedia, mobile/keyboard, logout, dan replay cookie yang dicabut.
2. Navigasi CONTENT, direct URL booking/private trip ditolak, perubahan role database pada session yang sama, dan akun disabled diarahkan ke login.
3. Akses OPERATIONS, URL tidak dikenal, kembali ke dashboard, serta penolakan origin asing untuk login/logout.
4. Login mobile dengan pending state, kegagalan koneksi, dan tombol submit kembali tersedia.
5. Gangguan `/auth/me` melalui perubahan sementara pada database test, error state, tombol pemulihan berhasil, serta kegagalan logout dan percobaan ulang berhasil.

Overflow diperiksa pada lebar 320, 375, 768, dan 1280 piksel; teks 200% diperiksa pada mobile. Screenshot login/dashboard desktop/mobile diperiksa secara visual dan tersedia di `apps/web/test-results/`.

## TEST RESULT

- Browser integration: 5 passed, 0 failed.
- Unit regression: 7 passed, 0 failed.
- Lint, typecheck, formatting, production build: PASS.
- Install dependency melaporkan 0 vulnerabilities.

## ANTISLOP DELIVERY GATE

- Hard Gate PASS: teks UI tidak memakai em dash; tidak ada statistik/testimoni buatan atau logo baru. Semua menu memiliki route dan semua kontrol memiliki perilaku.
- R-03 PASS: pemeriksaan browser tidak menemukan horizontal overflow pada empat lebar viewport dan teks 200%; screenshot mobile diperiksa.
- R-23/R-24 PASS: navigasi mengikuti route STEP 7; brand ditampilkan sebagai teks; halaman modul menyatakan status belum tersedia.
- R-25 PASS: teks sekunder pada sidebar 5.55:1; putih pada tombol hijau 8.42:1; pesan error 8.00:1. Border input/tombol 4.04:1 terhadap putih, di atas ambang non-text 3:1.
- R-26/R-27 PASS: login, logout, password toggle, menu, tautan, dan retry diuji; loading, kegagalan, empty/unavailable, forbidden, serta not-found memiliki teks yang jelas.
- R-32 PASS: focus ring eksplisit, skip link tersedia, menu dapat dioperasikan dengan Enter/Escape dan fokus kembali ke pemicunya.
- R-33/R-35 PASS: source diedit langsung melalui patch; production build dan click-through browser dijalankan; screenshot ditinjau.
- Purpose-Gate PASS: alasan warna, tipografi, struktur, tema, dan aksen login dicatat pada Design Read. Tidak ada gradient, glow, ikon dekoratif, ilustrasi, atau shadow berlebihan.
- Liveliness PASS: dials 1/1/1 dinyatakan sebelum implementasi; fokus login ada pada form, fokus halaman pada heading; aksen hijau dan pengelompokan domain perjalanan konsisten.
- Craftsmanship PASS: seluruh elemen UI mendukung navigasi/autentikasi; role, nama admin, dan status fitur berasal dari kondisi nyata; spacing, radius, dan palet konsisten pada desktop/mobile.

## ACCEPTANCE CRITERIA

- [PASS] Semua route STEP 7 tersedia.
- [PASS] Protected admin layout memverifikasi sesi server-side.
- [PASS] Sidebar, header, dan identitas admin tersedia.
- [PASS] Login/logout terhubung dengan backend.
- [PASS] Navigasi dan direct page access mengikuti role.
- [PASS] Loading, forbidden, error, dan not-found state tersedia.
- [PASS] Mobile dan keyboard dapat digunakan.
- [PASS] Styling mengutamakan struktur dan keterbacaan sesuai brief.

## ISSUES FOUND

1. Reset error boundary saja tidak mengambil ulang session server. Tombol pemulihan memakai reload dokumen; pengujian gangguan layanan membuktikan pemulihan berhasil.
2. Pengujian dilakukan di Chromium desktop dan viewport mobile emulasi. Keyboard virtual perangkat fisik dan browser lain belum diverifikasi.
3. Halaman dashboard dan modul bisnis masih kerangka sesuai scope STEP 7. CRUD destinasi serta payload bisnis dimulai pada tahap berikutnya.

Tidak ada kegagalan pemeriksaan yang tersisa.

## REFERENCES

- Source of truth: UX bagian 60–61, 104–105 dan master prompt STEP 7.
- [Next.js cookies](https://nextjs.org/docs/app/api-reference/functions/cookies): pembacaan cookie server dan penulisan cookie melalui route handler.

## NEXT STEP

STEP 08: Destination CRUD end-to-end. Belum dimulai.

## STEP STATUS

PASS
