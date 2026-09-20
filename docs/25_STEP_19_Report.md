# STEP

STEP 19: Public Trip Catalog (`/trip`, Search, Filters, Sort, Mobile Bottom Sheet, Empty/Loading/Error States)

## OBJECTIVE

Membangun Public Trip Catalog Wildera Adventure (`/trip` dan redirect `/trips`) sesuai spesifikasi UX Section 18–25 dan roadmap Prompt Master STEP 19. Memungkinkan calon pendaki mencari dan menyaring jadwal perjalanan pendakian gunung di Indonesia secara cepat, mobile-first, dengan pencarian teks, filter bulan keberangkatan, tipe trip, tingkat kesulitan, status ketersediaan kuota (tanpa false urgency), pengurutan, state loading, empty state komunikatif, serta drawer bottom sheet di perangkat bergerak.

---

## IMPLEMENTATION SUMMARY

1. **Komponen Modular Trip Catalog (`apps/web/src/components/trip/`)**:
   - `trip-card.tsx`: Menampilkan kartu trip dengan cover foto, badge tipe (`OPEN TRIP` / `PRIVATE TRIP`), elevasi mdpl, konteks gunung, rentang tanggal keberangkatan, durasi hari/malam, badge tingkat kesulitan (`DifficultyLevel`), tag ramah pemula, badge ketersediaan kursi (`X seat tersedia`, `Tersisa X seat`, atau `Sold Out` tanpa kata-kata manipulatif), starting price terformat IDR (`formatRupiah`), dan tombol CTA menuju `/trip/[slug]`.
   - `trip-filter-sidebar.tsx`: Sidebar filter desktop dengan sticky positioning, badge jumlah filter aktif, tombol "Reset Semua", filter Bulan Keberangkatan, Tipe Perjalanan (`OPEN_TRIP`, `PRIVATE_TRIP`), Tingkat Kesulitan (`EASY`, `MODERATE`, `HARD`, `EXTREME`), dan Ketersediaan Kuota (`AVAILABLE`, `ALMOST_FULL`).
   - `trip-filter-bottom-sheet.tsx`: Bottom sheet / drawer filter untuk mobile yang meluncur halus dari bawah layar dengan backdrop gelap, drag handle, header modal, tombol pilihan responsif, tombol "Reset Semua", dan CTA "Terapkan Filter".
   - `trip-catalog-client.tsx`: Komponen klien interaktif yang mengelola sinkronisasi state pencarian, filter, dan pengurutan dengan URL search params secara non-blocking melalui `window.history.replaceState` di dalam `useEffect`. Mendukung:
     - Real-time search (nama gunung, trip, destinasi).
     - Filter kombinasi bulan, tipe, tingkat kesulitan, dan status kuota.
     - Pengurutan dinamis (`Keberangkatan Terdekat`, `Harga: Terendah ke Tertinggi`, `Harga: Tertinggi ke Terendah`, `Terbaru Ditambahkan`).
     - Indikator jumlah trip ditemukan (`X Trip ditemukan`).
     - **Loading State**: Shimmer animated skeleton cards.
     - **Empty State**: Tampilan kosong ramah pengguna per UX spec section 25 ("Belum ada trip yang cocok", "Coba ubah tanggal atau filter pencarianmu", tombol "Reset Filter", dan link WhatsApp Wildera).
     - **Error State**: Tampilan peringatan gagal memuat dengan tombol coba lagi.

2. **Next.js Routing & Server Rendering (`apps/web/src/app/trip/page.tsx` & `apps/web/src/app/trips/page.tsx`)**:
   - `apps/web/src/app/trip/page.tsx`: Server Component Next.js yang mengambil data trip publik (`fetchPublicTrips()`) dan pengaturan situs (`fetchPublicSiteSettings()`) secara paralel, menyajikan data server-rendered awal, membungkus `TripCatalogClient` dalam `<Suspense>`, serta menyematkan navbar dan footer konsisten.
   - `apps/web/src/app/trips/page.tsx`: Route redirect otomatis dari `/trips` ke `/trip`.

3. **Gaya Tampilan & Layout Responsif (`apps/web/src/app/globals.css`)**:
   - Memastikan kompatibilitas Tailwind v4 dengan aturan utility `.desktop-sidebar` (`display: flex !important` pada `min-width: 1024px`, `none` pada mobile) dan `.mobile-filter-bar` (`display: flex !important` pada `max-width: 1023px`, `none` pada desktop) sehingga tidak ada benturan spesifisitas CSS.

4. **Automated End-to-End Testing (`apps/web/test/trip-catalog.spec.ts`)**:
   - Test 1: Rendering halaman katalog utama, search bar, filter sidebar desktop, dropdown sort, dan kartu trip.
   - Test 2: Redirect route `/trips` ke `/trip`.
   - Test 3: Filter real-time input pencarian.
   - Test 4: Filter tingkat kesulitan dan verifikasi badge jumlah filter aktif serta tombol reset.
   - Test 5: Pengurutan berdasarkan harga.
   - Test 6: Empty state saat pencarian tidak menemukan hasil dan pemulihan kartu setelah reset filter.
   - Test 7: Pengujian viewport mobile (iPhone 390x844) membuka bottom sheet, memilih filter, dan menerapkannya.

---

## VERIFICATION & TEST RESULTS

- **Playwright E2E Tests (`npm run test:admin`)**: 19/19 PASS (10 Admin tests + 2 Public Home tests + 7 Trip Catalog tests).
- **Unit Tests (`npm test`)**: 57/57 PASS.
- **Database Integration Tests (`npm run db:test`)**: 44/44 test suites PASS.
- **TypeScript Typecheck (`npm run typecheck`)**: 0 error.
- **ESLint (`npm run lint`)**: 0 error / 0 warning.
- **Prettier Format (`npm run format`)**: Clean formatting.
- **Production Build (`npm run build`)**: Next.js 16 (Webpack) & NestJS 12 production build PASS.

---

## CONCLUSION & NEXT STEP

STEP 19 (Public Trip Catalog) tuntas 100%.
Selanjutnya: Melanjutkan ke **STEP 20 — MOUNTAIN PUBLIC PAGES** (`/gunung` direktori gunung, overview, elevasi, tingkat kesulitan, jalur pendakian, dan `/gunung/[slug]` detail gunung dengan upcoming trips).
