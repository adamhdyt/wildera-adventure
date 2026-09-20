# Report STEP 35 — Analytics & Conversion Tracking System

## 1. Overview

Penyelesaian implementasi sistem analitik dan pelacakan konversi berstandar privasi tinggi untuk seluruh platform publik Wildera Adventure sesuai spesifikasi roadmap STEP 35:

- **8 Standard Analytics Events**:
  1. `view_home`: Ditembakkan saat pengunjung membuka halaman utama (`/`).
  2. `view_trip_list`: Ditembakkan saat pengunjung membuka katalog perjalanan/trip (`/trip`).
  3. `view_trip`: Ditembakkan saat pengunjung melihat detail ekspedisi tertentu (`/trip/[slug]`).
  4. `select_schedule`: Ditembakkan saat pengunjung memilih tanggal keberangkatan jadwal pendakian.
  5. `select_package`: Ditembakkan saat pengunjung memilih paket layanan pendakian (Reguler, VIP, Porter, dll).
  6. `click_book_whatsapp`: Ditembakkan saat pengunjung menekan tombol pemesanan via WhatsApp pada booking card desktop atau sticky bottom bar mobile.
  7. `click_health_whatsapp`: Ditembakkan saat pengunjung menekan CTA konsultasi kesiapan fisik & medis pendakian via WhatsApp.
  8. `private_trip_inquiry`: Ditembakkan saat pengunjung berhasil mengirimkan inkuiri kustom private trip.
- **Strict PII Protection (Kepatuhan Privasi Konsumen)**:
  - Pelarangan keras pengiriman Personally Identifiable Information (PII) ke event payload analitik.
  - Implementasi fungsi sanitasi otomatis `sanitizeAnalyticsProperties` di `@wildera/validation` dan client wrapper `@/lib/analytics`.
  - Secara deterministik memfilter atau menolak key bertema identitas seperti `phone`, `phoneNumber`, `whatsapp`, `whatsappNumber`, `email`, `contactEmail`, `name`, `fullName`, `customerName`, `identity`, `nik`, `passport`, `medical`, `medicalData`, `medicalHistory`, `healthNote`, dan `allergies`.
  - Regex pattern matcher otomatis yang memindai dan menghapus properti dengan nilai menyerupai nomor telepon atau format alamat email.
- **Resilient & Non-Blocking Client-Side Architecture**:
  - Abstraksi pengiriman analitik client di `apps/web/src/lib/analytics.ts`.
  - Dispatch langsung ke `window.dataLayer` (Google Tag Manager / Google Analytics 4) jika terpasang tanpa membebani browser dengan third-party SDK yang blocking.
  - Dev console logging yang terstruktur dan aman saat lingkungan berjalan di mode pengembangan.
  - In-memory event ledger (`window.__WILDERA_ANALYTICS_EVENTS__`) yang memungkinkan pengujian otomatis end-to-end tanpa bergantung pada mock jaringan eksternal.

---

## 2. Arsitektur & File Terdampak

1. **Shared Types (`packages/types`)**:
   - `packages/types/src/index.ts`: Menambahkan union type `AnalyticsEventName`, kontrak payload `AnalyticsEventPayload`, serta struktur data event `AnalyticsEvent`.

2. **Validation & PII Sanitizer (`packages/validation`)**:
   - `packages/validation/src/index.ts`:
     - Konstanta daftar event `VALID_ANALYTICS_EVENTS`.
     - Fungsi validasi runtime `validateAnalyticsEvent`.
     - Engine penyaring data sensitif `sanitizeAnalyticsProperties`.

3. **Web Analytics Library & Wrappers (`apps/web/src/lib`)**:
   - `apps/web/src/lib/analytics.ts`: Modul client layer analitik dengan fungsi `trackEvent` generik dan 8 fungsi helper spesifik bertipe aman (`trackViewHome`, `trackViewTripList`, `trackViewTrip`, `trackSelectSchedule`, `trackSelectPackage`, `trackClickBookWhatsApp`, `trackClickHealthWhatsApp`, `trackPrivateTripInquiry`).

4. **Public UI Integration (`apps/web/src/components` & `apps/web/src/app`)**:
   - `apps/web/src/components/home/hero.tsx`: Hooking event `view_home` pada siklus hidup mount komponen hero.
   - `apps/web/src/components/trip/trip-catalog-client.tsx`: Hooking event `view_trip_list` saat pengunjung membuka katalog.
   - `apps/web/src/components/trip-detail/trip-detail-client.tsx`:
     - Hooking event `view_trip` saat halaman trip detail dimuat.
     - Hooking event `select_schedule` saat pengunjung beralih jadwal.
     - Hooking event `select_package` saat memilih paket pendakian.
     - Hooking event `click_health_whatsapp` saat CTA konsultasi kesehatan ditekan.
     - Hooking event `click_book_whatsapp` pada tombol pesan sticky bottom bar di layar perangkat bergerak (mobile).
   - `apps/web/src/components/trip-detail/booking-card.tsx`: Hooking event `click_book_whatsapp` pada kartu pemesanan desktop.
   - `apps/web/src/app/private-trip/private-trip-client.tsx`: Hooking event `private_trip_inquiry` saat inkuiri kustom berhasil disubmit, memastikan atribut PII seperti nama kontak, nomor WhatsApp, email, dan catatan medis disaring keluar dari event tracking.

5. **Automated Testing Suites**:
   - `apps/api/test/analytics-validation.test.ts`: 7 unit test menyeluruh untuk validasi payload event analitik, verifikasi ke-8 nama event standar P0, dan sanitasi ketat data PII.
   - `apps/web/test/analytics.spec.ts`: 5 Playwright E2E browser tests yang menguji eksekusi ke-8 event analitik dalam interaksi pengguna nyata dan memverifikasi ketiadaan PII pada payload event.

---

## 3. Hasil Verifikasi Quality Gates

- **Unit Tests Monorepo**: 130/130 PASS (`npm test`).
- **Database Integration Tests**: 57/57 PASS (`npm run test:db -w @wildera/api`).
- **Playwright Browser Tests**: 51/51 PASS (`npm run test:admin`).
- **TypeScript Typecheck**: PASS (`npm run typecheck`).
- **ESLint & Prettier**: 0 errors, 0 warnings (`npm run format && npm run lint`).
- **Full Monorepo Production Build**: PASS (`npm run build`).
