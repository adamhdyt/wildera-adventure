# STEP

STEP 01: Initialize Monorepo

## OBJECTIVE

Menjalankan frontend dan backend melalui satu root command, dengan workspace, TypeScript, lint, formatting, env example dan pemeriksaan yang dapat direproduksi.

## DEPENDENCIES

PHASE 0 PASS: lihat [validasi dokumen](00_Document_Validation.md). Node.js 24.12.0 dan npm 11.18.0 tersedia saat pengujian. PostgreSQL bukan dependency STEP 1.

## FILES CREATED

```text
.env.example
.gitignore
.npmrc
.nvmrc
.prettierignore
.prettierrc.json
README.md
eslint.config.mjs
package.json
package-lock.json
apps/api/.env.example
apps/api/package.json
apps/api/tsconfig.json
apps/api/tsconfig.build.json
apps/api/src/app.module.ts
apps/api/src/app.ts
apps/api/src/main.ts
apps/api/test/bootstrap.test.ts
apps/web/.env.example
apps/web/package.json
apps/web/tsconfig.json
apps/web/next-env.d.ts
apps/web/next.config.ts
apps/web/postcss.config.mjs
apps/web/src/app/globals.css
apps/web/src/app/layout.tsx
apps/web/src/app/page.tsx
packages/config/package.json
packages/config/tsconfig.base.json
packages/types/package.json
packages/types/tsconfig.json
packages/types/src/index.ts
packages/ui/package.json
packages/ui/tsconfig.json
packages/ui/src/index.ts
packages/validation/package.json
packages/validation/tsconfig.json
packages/validation/src/index.ts
database/migrations/.gitkeep
database/seeds/.gitkeep
infrastructure/.gitkeep
scripts/.gitkeep
docs/00_Document_Validation.md
docs/07_STEP_01_Report.md
```

`next-env.d.ts` dihasilkan/diperbarui Next.js. Build output dan node_modules diabaikan oleh Git. Screenshot sementara diperiksa di `/tmp/wildera-step1-mobile.png`, bukan aset produk.

## FILES MODIFIED

Tidak ada file awal pengguna yang diubah. Keenam dokumen baseline dan blueprint lama dipertahankan. Perbaikan selama tahap ini hanya mengubah file scaffold baru di atas.

## IMPLEMENTATION

- npm workspaces: dua aplikasi dan empat shared package.
- Next.js 16.3.5, React 19.3.0, Tailwind 4.3.3; halaman sementara Bahasa Indonesia dengan noindex.
- NestJS 12.0.3, TypeScript compiler dan nodemon/ts-node untuk development. Prefix API disiapkan tanpa route bisnis.
- Root scripts: dev, build, lint, typecheck, test, format, format:check.
- Shared package ui/types/validation hanya menyediakan entry point kosong dan konfigurasi compiler. Model bisnis mengikuti tahap selanjutnya.
- ESLint menggunakan konfigurasi Next.js dan TypeScript. Formatting tidak menulis ulang source-of-truth pengguna atau file Next.js generated.
- Auto-generation AGENTS.md/CLAUDE.md oleh Next.js dinonaktifkan lewat opsi resmi `agentRules: false` agar dev command tidak menulis instruksi proyek baru.

## RUN COMMANDS

```sh
npm ci
npm run dev
```

Web: http://127.0.0.1:3000. API: http://127.0.0.1:3001. Env examples opsional untuk default lokal; langkah copy dan start hasil build ada di [README](../README.md).

## DATABASE CHANGES

Tidak ada schema, migration atau seed. Folder tujuan sudah dibuat. Mulai pada STEP 2/3.

## API CHANGES

NestJS dapat boot dan menerima HTTP. Belum ada business endpoint. `/api/v1/trips` mengembalikan JSON 404 sebagaimana diharapkan. `/health` dengan status database tetap STEP 4; scaffold tidak mengklaim database healthy.

## TESTS PERFORMED

- `npm ci`: instalasi ulang dari lockfile.
- `npm run lint`: zero-warning lint.
- `npm run typecheck`: API, web dan shared source packages.
- `npm test`: satu smoke test HTTP nyata, port sementara, server ditutup sesudah test.
- `npm run build`: kompilasi NestJS dan Next.js production build.
- `npm run format:check`.
- `npm audit`: 0 vulnerability pada dependency tree akhir.
- `npm run dev`: kedua aplikasi aktif dari root; web HTTP 200 dan API JSON HTTP 404 untuk route yang belum dibuat. Ctrl+C menghentikan keduanya.
- Chromium/Chrome melalui Playwright sementara: viewport 320, 390, 1440 px; heading benar, `lang=id`, noindex/nofollow, tanpa horizontal overflow, tanpa runtime page error. Tidak ada kontrol interaktif pada placeholder yang perlu di-click.

## TEST RESULT

PASS. Test ini membuktikan scaffold berjalan; tidak membuktikan alur booking, inventory, auth, koneksi database atau kesiapan launch.

## ACCEPTANCE CRITERIA

- [PASS] Frontend dapat dijalankan: HTTP 200 dan pemeriksaan browser.
- [PASS] Backend dapat dijalankan: NestJS boot dan smoke HTTP.
- [PASS] Root command menjalankan kedua aplikasi.
- [PASS] Lint lulus.
- [PASS] Typecheck lulus.
- [PASS] Build, test dan formatting lulus.

## ISSUES FOUND

1. Dependency upload pada NestJS 11.2.5 membawa tiga temuan high di npm audit. Diperbaiki dengan NestJS 12.0.3; audit akhir 0.
2. ESLint awal memberi warning anonymous default export PostCSS dan lokasi root Next.js. Diperbaiki dengan named config dan `settings.next.rootDir`.
3. Next.js menulis ulang `next-env.d.ts` sehingga pemeriksaan Prettier semula gagal. File generated ini sekarang dikecualikan dari formatter.
4. npm memberi peringatan deprecation ESLint 9.39.5. Versi ini dipertahankan karena peer dependency eslint-plugin-react yang digunakan konfigurasi Next.js masih mencakup major 9, belum 10. Audit tidak menemukan vulnerability; migrasi lint dilakukan saat dependency mendukung.
5. npm 11 memberi notice install script fsevents/unrs-resolver belum di-allow. Tidak menambahkan blanket approval. Install, lint, build dan runtime telah lulus dengan kebijakan yang ada.

Tidak ada error yang belum diperbaiki. Warning dependency di atas bukan klaim production readiness.

## ANTISLOP CHECK

Mode selama pengerjaan dipilih pengguna. Scope visual hanya placeholder scaffold, bukan desain homepage final.

- PASS: teks menyatakan website sedang dikembangkan; tidak ada klaim/foto/testimoni atau data trip fiktif.
- PASS: tidak ada dead link/control; pemeriksaan DOM menemukan 0 kontrol pada main.
- PASS: browser 320/390/1440 px tanpa overflow atau page error; heading dan paragraf terbaca.
- PASS: kompilasi production selesai. Gate desain produk lengkap berlaku ketika UI bisnis mulai dibangun, bukan klaim deliverable pada STEP 1.

## NEXT STEP

STEP 02: PostgreSQL + Prisma Foundation. Belum dimulai; berhenti sesuai instruksi setelah STEP 1.

## STEP STATUS

PASS
