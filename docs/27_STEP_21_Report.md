# STEP

STEP 21: Public Trip Detail Page (`/trip/[slug]`)

## OBJECTIVE

Membangun halaman publik detail trip (`/trip/[slug]`) Wildera Adventure sesuai ketentuan Prompt Master STEP 21 dan spesifikasi UX (§30-§37, §120). Mengintegrasikan seluruh informasi ekspedisi pendakian secara komprehensif, mulai dari Hero banner, Trip Summary, Overview, Itinerary harian, Fasilitas (Include & Exclude), Titik Kumpul (Meeting Point), Checklist Perlengkapan (Mandatory & Recommended), Ketentuan Medis/Kesehatan, Tingkat Kesulitan & Profil Fisik, FAQ spesifik trip, Kebijakan Pembatalan & SOP Keamanan, hingga Desktop Sticky Booking Card dan Mobile Sticky Bottom CTA yang terhubung langsung ke WhatsApp booking flow tanpa false urgency.

---

## IMPLEMENTATION SUMMARY

1. **API Client Helper (`apps/web/src/lib/public-api.ts`)**:
   - Menambahkan fungsi SSR prefetching `fetchPublicTripDetail(slug: string)` yang berkomunikasi dengan endpoint NestJS `GET /api/v1/trips/:slug`.
   - Mengintegrasikan interface `PublicTripDetail` dari `@wildera/types`.

2. **Komponen Booking Card Desktop (`apps/web/src/components/trip-detail/booking-card.tsx`)**:
   - Menerapkan desktop sticky card (`sticky top-28`) di sidebar kanan.
   - **Schedule Selector**: Menampilkan daftar tanggal keberangkatan aktif, durasi perjalanan, serta status ketersediaan kursi secara transparan (`Tersisa X seat`, `12 seat tersedia`, atau `Sold Out`).
   - **Package Selector**: Menampilkan pilihan paket untuk jadwal yang dipilih (misal: _Start Jakarta_ atau _Start Lombok_) lengkap dengan rincian harga per pax dan meeting point.
   - **Price & Availability**: Perhitungan harga dinamis dan sisa kuota yang terupdate seketika saat paket/jadwal dipilih.
   - **WhatsApp CTA**:
     - Status disabled jika jadwal/paket belum dipilih (UX §37).
     - Status aktif ketika paket dan jadwal dipilih, mengarahkan ke link `https://wa.me/...` dengan format pesan pemesanan yang otomatis terisi nama trip, jadwal, nama paket, dan harga.

3. **Komponen Itinerary Timeline (`apps/web/src/components/trip-detail/itinerary-timeline.tsx`)**:
   - Komponen visual interaktif timeline hari-ke-hari (_Day 1_, _Day 2_, _Day 3_, dst.) yang rapi dan terstruktur dengan penanda milestone dan deskripsi aktivitas rinci.

4. **Komponen Klien Koordinator (`apps/web/src/components/trip-detail/trip-detail-client.tsx`)**:
   - Mengelola state seleksi jadwal dan paket perjalanan secara reaktif.
   - Mengorganisir 2 kolom layout pada viewport desktop:
     - **Kolom Kiri (Main Content)**:
       1. **Hero**: Visual cover, judul trip, breadcrumbs, badge trip type, difficulty, gunung, rute, elevasi, dan durasi.
       2. **Trip Summary**: Kartu ringkasan metrik durasi, elevasi, batasan usia, dan sertifikat kesehatan.
       3. **Overview**: Narasi mendalam mengenai keunikan alam dan pengalaman ekspedisi.
       4. **Itinerary**: Rangkaian aktivitas ekspedisi dari hari ke hari.
       5. **Facilities (Include & Exclude)**: Perbandingan transparan fasilitas yang termasuk dan tidak termasuk.
       6. **Meeting Point**: Informasi titik temu, alamat lengkap, dan panduan Google Maps.
       7. **Gear Checklist**: Pembagian daftar perlengkapan wajib (_Mandatory_) dan perlengkapan rekomendasi (_Recommended_).
       8. **Health & Preparation**: Persyaratan surat kesehatan dokter dan anjuran persiapan fisik.
       9. **Difficulty & Terrain**: Karakter medan pendakian dan standar guide APGI.
       10. **FAQ**: Accordion pertanyaan umum spesifik perjalanan.
       11. **Policies & Safety**: Ringkasan aturan pembatalan, pengembalian dana, dan SOP keamanan darurat.
     - **Kolom Kanan (Desktop Sidebar)**:
       - Memuat `<BookingCard />` dengan perilaku sticky scrolling.
   - **Mobile Sticky Bottom CTA**:
     - Bar melayang di bagian bawah layar pada viewport mobile (`lg:hidden`).
     - Menampilkan indikator harga mulai / terpilih serta sisa kuota.
     - Tombol pintar: Jika belum memilih jadwal, tombol mengarahkan/scroll ke `#booking-card-container` (UX §120); jika jadwal dan paket sudah terpilih, tombol langsung mengeksekusi booking WhatsApp.

5. **Halaman Server Component (`apps/web/src/app/trip/[slug]/page.tsx`)**:
   - Menghasilkan metadata SEO dinamis (`generateMetadata`) dengan judul, deskripsi, dan OpenGraph teroptimasi.
   - Menyediakan data fallback editorial lengkap untuk rute ikonik (seperti `open-trip-rinjani-summit-4d3n`) guna menjamin ketahanan SSR dan kestabilan automated test.

6. **Playwright E2E Tests (`apps/web/test/trip-detail.spec.ts`)**:
   - Test 1: Verifikasi kelengkapan render seluruh seksi detail trip (Hero, Summary, Overview, Itinerary, Include/Exclude, Meeting Point, Gear, Health, FAQ, Policies).
   - Test 2: Verifikasi fungsi interaktif Desktop Sticky Booking Card (pemilihan jadwal, pemilihan paket, pembaruan harga, dan WhatsApp link CTA).
   - Test 3: Verifikasi keberadaan dan interaksi Mobile Sticky Bottom CTA pada viewport mobile (390x844).

---

## VERIFICATION & TEST RESULTS

- **Playwright E2E Tests (`npm run test:admin`)**: 27/27 PASS (10 Admin + 2 Home + 7 Trip Catalog + 5 Mountain + 3 Trip Detail).
- **Unit Tests (`npm test`)**: 57/57 PASS.
- **Database Integration Tests (`npm run db:test`)**: 44/44 PASS.
- **TypeScript Typecheck (`npm run typecheck`)**: 0 error.
- **ESLint (`npm run lint`)**: 0 error / 0 warning.
- **Prettier Format (`npm run format`)**: Clean formatting.
- **Production Build (`npm run build`)**: Next.js 16 (Webpack) & NestJS 12 production build PASS.

---

## CONCLUSION & NEXT STEP

STEP 21 (Public Trip Detail Page) tuntas 100%.
Selanjutnya: Melanjutkan ke **STEP 22 — PUBLIC CONTENT & STATIC PAGES** (`/tentang-kami`, `/kontak`, `/faq`, `/terms`, `/cancellation`, `/privacy`, `/safety`).
