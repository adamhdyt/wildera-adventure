# STEP

STEP 20: Public Mountain Pages (`/gunung` Direktori Gunung & `/gunung/[slug]` Detail Gunung)

## OBJECTIVE

Membangun halaman publik eksplorasi gunung Wildera Adventure (`/gunung` Direktori Gunung dan `/gunung/[slug]` Detail Gunung) sesuai acuan roadmap Prompt Master STEP 20 dan spesifikasi UX. Menyediakan informasi lengkap mengenai direktori gunung di Indonesia, elevasi ketinggian (mdpl), tingkat kesulitan teknis pendakian, opsi jalur pendakian resmi, ringkasan profil bentang alam (overview), serta jadwal trip pendakian aktif (upcoming trips) dengan fallback kustomisasi private trip langsung ke WhatsApp.

---

## IMPLEMENTATION SUMMARY

1. **API Client Extension (`apps/web/src/lib/public-api.ts`)**:
   - Menambahkan helper `fetchPublicMountainDetail(slug: string)` bertipe `Promise<PublicMountainDetail | null>` yang memanggil endpoint NestJS `/api/v1/mountains/:slug`.
   - Menghubungkan tipe data `PublicMountainSummary` dan `PublicMountainDetail` dari `@wildera/types`.

2. **Komponen Modular Gunung (`apps/web/src/components/mountain/`)**:
   - `mountain-card.tsx`: Menampilkan kartu gunung dengan cover gambar landscape, badge elevasi mdpl, badge tingkat kesulitan (`Santai (Easy)`, `Sedang (Moderate)`, `Menantang (Hard)`, `Ekstrem (Extreme)`), nama wilayah/destinasi, dan deep link menuju `/gunung/[slug]`.
   - `mountain-directory-client.tsx`: Komponen klien interaktif untuk halaman direktori gunung yang menyediakan:
     - Real-time search nama gunung dan wilayah destinasi.
     - Filter dropdown tingkat kesulitan (`DifficultyLevel`).
     - Pengurutan dinamis berdasarkan elevasi tertinggi (`mdpl`) atau abjad nama (A-Z).
     - Indikator jumlah gunung terdaftar (`X Gunung terdaftar`).
     - Empty state ramah pengguna dengan tombol "Reset Filter".

3. **Halaman Direktori Gunung (`apps/web/src/app/gunung/page.tsx`)**:
   - Server Component Next.js yang mengambil daftar gunung publik dari API (`fetchPublicMountains()`) dan pengaturan situs secara paralel.
   - Menyediakan data cadangan kurasi untuk ikon gunung Indonesia (Rinjani, Semeru, Prau, Bromo, Merbabu) jika backend belum memiliki data aktif.
   - Terintegrasi dengan `<Navbar />`, hero banner editorial, `<Suspense>`, dan `<Footer />`.

4. **Halaman Detail Gunung (`apps/web/src/app/gunung/[slug]/page.tsx`)**:
   - Server Component dinamis yang memproses parameter `slug` dan memanggil `fetchPublicMountainDetail(slug)`.
   - Menghasilkan metadata SEO dinamis (`generateMetadata`) dengan judul dan deskripsi gunung teroptimasi.
   - Mengimplementasikan 5 seksi konten wajib per spesifikasi STEP 20:
     1. **Hero Cover & Key Metrics**: Banner visual megah dengan breadcrumb navigasi, badge tingkat kesulitan, elevasi puncak mdpl, rincian musim terbaik, dan jumlah jalur resmi.
     2. **Overview**: Narasi mendalam mengenai karakteristik geografis, savana/kaldera, keunikan ekosistem, serta rekomendasi aklimatisasi.
     3. **Altitude & Difficulty**: Penjelasan teknis tingkat kesulitan, standar operasional guide bersertifikat APGI, dan rasio porter aman.
     4. **Routes (Jalur Pendakian Resmi)**: Grid kartu jalur resmi dengan rincian jarak tempuh (km), elevasi bertambah (m), dan estimasi jam tempuh.
     5. **Upcoming Trips**: Grid kartu perjalanan `TripCard` terhubung dengan jadwal trip aktif yang mendaki gunung tersebut, dilengkapi kartu banner penawaran Private Trip via WhatsApp jika belum ada jadwal publik aktif.

5. **Automated End-to-End Testing (`apps/web/test/mountain.spec.ts`)**:
   - Test 1: Rendering direktori gunung, hero, input pencarian, filter kesulitan, dan kartu gunung.
   - Test 2: Filter real-time pencarian nama gunung serta pemulihan empty state via tombol reset.
   - Test 3: Filter interaktif dropdown tingkat kesulitan.
   - Test 4: Rendering lengkap halaman detail gunung (`/gunung/rinjani`): hero, elevasi 3.726 mdpl, overview, tingkat kesulitan, jalur pendakian resmi, dan jadwal trip.
   - Test 5: Navigasi link dari kartu direktori ke halaman detail gunung.

---

## VERIFICATION & TEST RESULTS

- **Playwright E2E Tests (`npm run test:admin`)**: 24/24 PASS (10 Admin tests + 2 Public Home tests + 7 Trip Catalog tests + 5 Mountain Public tests).
- **Unit Tests (`npm test`)**: 57/57 PASS.
- **Database Integration Tests (`npm run db:test`)**: 44/44 test suites PASS.
- **TypeScript Typecheck (`npm run typecheck`)**: 0 error.
- **ESLint (`npm run lint`)**: 0 error / 0 warning.
- **Prettier Format (`npm run format`)**: Clean formatting.
- **Production Build (`npm run build`)**: Next.js 16 (Webpack) & NestJS 12 production build PASS.

---

## CONCLUSION & NEXT STEP

STEP 20 (Public Mountain Pages) tuntas 100%.
Selanjutnya: Melanjutkan ke **STEP 21 — PUBLIC TRIP DETAIL** (`/trip/[slug]` Hero, Trip Summary, Schedule Selector, Package Selector, Price, Availability, Overview, Itinerary, Include/Exclude, Meeting Point).
