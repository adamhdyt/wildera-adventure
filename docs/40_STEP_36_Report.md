# Report STEP 36 — Security Hardening

## 1. Overview

Penyelesaian audit, penguatan keamanan (security hardening), perlindungan privasi, serta mitigasi celah eksploitasi sesuai spesifikasi roadmap STEP 36:

- **Strict Security Headers (OWASP Compliant)**:
  - `X-Content-Type-Options: nosniff` (Mencegah MIME-sniffing).
  - `X-Frame-Options: DENY` (Mencegah serangan Clickjacking pada portal admin maupun rute publik).
  - `X-XSS-Protection: 0` (Standar modern untuk mencegah vulnerability auditor XSS filter).
  - `Referrer-Policy: strict-origin-when-cross-origin` (Melindungi URI param dan privasi perujuk).
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` (Menonaktifkan sensor dan API perambah yang tidak dibutuhkan).
  - `Strict-Transport-Security (HSTS)`: Mengunci komunikasi HTTPS dengan `max-age=63072000; includeSubDomains; preload` pada environment staging & production.
  - Content Security Policy pada Next.js `next.config.ts`.
- **Session & Cookie Security**:
  - `httpOnly: true` (Mencegah akses token dari script client / XSS).
  - `sameSite: 'lax'` (Mitigasi serangan CSRF antar-domain).
  - `secure: true` (Diaktifkan pada mode staging dan production untuk transmisi terenkripsi via HTTPS).
  - Path dibatasi ke root (`/`) dan masa berlaku terkontrol (TTL 8 jam).
- **Authentication & RBAC (Role-Based Access Control)**:
  - Argon2 password hashing untuk seluruh kredensial administrator.
  - Session validation berbasis database dengan pengecekan `sessionVersion` dan status akun aktif/nonaktif secara real-time.
  - Hierarki peran administrator yang ketat: `SUPER_ADMIN`, `OPERATIONS`, dan `CONTENT`. Setiap endpoint dilindungi oleh `@Authorize(Permission.XXX)`. Peran `CONTENT` diblokir total dari manipulasi booking dan data privasi peserta.
- **CSRF & Origin Mitigation**:
  - Validasi header `Origin` pada backend server-action proxy (`apps/web/src/app/api/admin/auth/[action]/route.ts`), secara instan menolak permohonan lintas domain (`403 Forbidden`).
  - CORS whitelist di `apps/api/src/app.ts` yang membatasi akses origin ke domain resmi (`https://wildera.id`, `https://staging.wildera.id`, dan port dev lokal).
- **Native Rate Limiting (Brute Force & Abuse Protection)**:
  - Implementasi rate limiter in-memory sliding-window di `apps/api/src/common/security/rate-limiter.middleware.ts` tanpa external dependencies.
  - Membatasi upaya login admin (`/auth/login`) hingga maksimal 20 request/menit per IP.
  - Membatasi endpoint publik umum hingga maksimal 180 request/menit per IP.
  - Mengembalikan status `429 Too Many Requests` beserta header `Retry-After` dan `X-RateLimit-*`.
- **Sensitive Data & Secret Redaction in Logs**:
  - `AppLogger` (`apps/api/src/common/logger/app-logger.service.ts`) dilengkapi sanitasi otomatis `redactSensitiveData`.
  - Secara deterministik menyamarkan string connection string database (`postgresql://[REDACTED]:[REDACTED]@...`), Bearer tokens, token auth, kata sandi, NIK, dan data riwayat medis pada error traces dan stdout/stderr logs.
- **Strict Input & Upload Validation**:
  - Validasi ekstensi dan MIME type berkas unggahan gambar (JPG, PNG, WEBP, AVIF) dengan pembatasan ukuran maksimal 5MB, menolak executable/SVG untuk mencegah upload-based XSS.

---

## 2. Arsitektur & File Terdampak

1. **API Security Engine (`apps/api/src/common/security`)**:
   - `apps/api/src/common/security/security-headers.middleware.ts`: Middleware pembuat header keamanan OWASP dan HSTS.
   - `apps/api/src/common/security/rate-limiter.middleware.ts`: Engine rate limiting sliding-window dengan header `X-RateLimit-*`.
2. **Logging Hardening (`apps/api/src/common/logger`)**:
   - `apps/api/src/common/logger/app-logger.service.ts`: Sanitasi otomatis connection string, kredensial, token, dan NIK pada log.
3. **Application Bootstrap & CORS (`apps/api/src/app.ts`)**:
   - Pemasangan `securityHeaders`, `rateLimiter`, serta whitelist CORS terkonfigurasi.
4. **Web Security Headers (`apps/web/next.config.ts`)**:
   - Konfigurasi security headers global Next.js untuk rute publik dan administratif.
5. **Security Unit Test Suite (`apps/api/test/security.test.ts`)**:
   - 6 automated tests pengujian security headers, HSTS, rate limiter throttling, sanitasi log credentials, dan cookie security options.

---

## 3. Hasil Verifikasi Quality Gates

- **Unit Tests Monorepo**: 136/136 PASS (`npm test`).
- **Security Tests**: 6/6 PASS (`apps/api/test/security.test.ts`).
- **Database Integration Tests**: 57/57 PASS (`npm run test:db -w @wildera/api`).
- **Playwright Browser Tests**: 51/51 PASS (`npm run test:admin`).
- **TypeScript Typecheck**: PASS (`npm run typecheck`).
- **ESLint & Prettier**: 0 errors, 0 warnings (`npm run format && npm run lint`).
- **Full Monorepo Production Build**: PASS (`npm run build`).
