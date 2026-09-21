# Report STEP 40 — Real Business Content

## 1. Overview

Pelaksanaan pengisian data bisnis riil (_Real Business Content_) untuk Wildera Adventure sesuai ketentuan roadmap STEP 40:

> "Input real: Wildera logo, WhatsApp, Instagram, Contact email, Mountain data, Route data, Trip data, Schedule, Capacity, Price, Meeting Point, Itinerary, Include, Exclude, Gear, FAQ, Policies, Photography. Do not launch with dummy data."

Seluruh data placeholder dan sintetis digantikan oleh konten resmi berdasarkan berkas rujukan operasional di `assets/raw-drive/` dan `docs/content/`.

---

## 2. Rincian Konten Bisnis Riil Terpasang

### 2.1 Identitas & Kontak Resmi

- **Logo**: Berkas resmi `assets/raw-drive/logo.jpg` dipasang di `apps/web/public/logo.jpg` dan `apps/web/public/images/wildera/logo.jpg`.
- **WhatsApp Bisnis**: `6282319872790` (+62 823-1987-2790).
- **Instagram**: `https://instagram.com/wilderaadventure.id` (`@wilderaadventure.id`).
- **TikTok**: `@wilderaadventure.id`.
- **Email Kontak**: `wilderaadventure.id@gmail.com`.
- **Alamat Basecamp & Kantor**: Jl. Re. Martadinata Cijoho, Kuningan, Jawa Barat, 45513.

### 2.2 Data Gunung & Rute (Mountains & Routes)

1. **Gunung Ciremai** (3.078 mdpl, Jawa Barat) — Jalur Palutungan (`ciremai-palutungan`), kesulitan _Moderate_, status _Published_.
2. **Gunung Merbabu** (3.142 mdpl, Jawa Tengah) — Jalur Thekelan (`merbabu-thekelan`), kesulitan _Moderate_, status _Published_.
3. **Gunung Prau** (2.590 mdpl, Jawa Tengah) — Jalur Patak Banteng (`prau-patak-banteng`), kesulitan _Easy_, status _Published_.
4. **Gunung Papandayan** (2.665 mdpl, Jawa Barat) — Jalur Cikahuripan, kesulitan _Easy_, status _Published_.
5. **Gunung Semeru** (3.676 mdpl, Jawa Timur) — Jalur Ranu Pane, kesulitan _Hard_, status _Published_.

### 2.3 Titik Kumpul (Meeting Points)

- **Halte UKI / Cawang Jakarta**: Halte TransJakarta Cawang UKI, Mayjen Sutoyo, Jakarta Timur.
- **Basecamp Palutungan Kuningan**: Jl. Palutungan, Cisantana, Cigugur, Kuningan, Jawa Barat.
- **Basecamp Patak Banteng Dieng**: Jl. Dieng Km 24, Patakbanteng, Kejajar, Wonosobo, Jawa Tengah.

### 2.4 Paket Perjalanan & Jadwal (Trip, Schedule, Capacity & Price)

- **Trip Resmi**: _Open Trip Gunung Ciremai 2D1N Via Palutungan_ (`open-trip-ciremai-palutungan`).
- **Jadwal Operasional**: Weekend 10–11 Oktober 2026.
- **Kapasitas**: 18 kursi (kuota minimum 10 peserta), status `OPEN`.
- **Paket Harga**:
  1. **Paket All-In Meeting Point Jakarta**: **Rp 650.000** (Termasuk transportasi Elf AC PP via Tol, Simaksi & Asuransi TNGC, Makan 1x Prasmanan, Sop Buah Segar, Tenda Dome Kelompok, Crew & P3K).
  2. **Paket Basecamp Palutungan Kuningan**: **Rp 375.000** (Termasuk Simaksi & Asuransi TNGC, Makan 1x Prasmanan, Sop Buah Segar, Tenda Dome Kelompok, Crew Pemandu Berlisensi & P3K).

### 2.5 Itinerary, Fasilitas (Include/Exclude) & Gear

- **Itinerary Hari 1**: Penjemputan Jakarta (Cawang) malam hari, transit Basecamp Palutungan subuh, sarapan, briefing medis, trekking santai menuju pos ketinggian / camp area.
- **Itinerary Hari 2**: Summit attack dini hari menuju Puncak Kawah Ciremai 3.078 mdpl, dokumentasi sunrise, turun ke basecamp menikmati sop buah segar dan makan prasmanan, kepulangan ke Jakarta.
- **Fasilitas Include**: Simaksi TNGC, asuransi, transportasi PP AC (paket Jakarta), makan prasmanan 1x, sop buah segar, tenda kelompok, crew APGI, P3K standar & tabung oksigen portabel.
- **Fasilitas Exclude**: Perlengkapan trekking pribadi, obat resep dokter khusus.
- **Perlengkapan Wajib (Mandatory)**: Sepatu trekking ber-grip, jaket windproof/hangat, headlamp + baterai cadangan, surat keterangan sehat dokter.
- **Perlengkapan Rekomendasi (Recommended)**: Trekking pole.

### 2.6 Dokumentasi Fotografi Asli (Photography)

- Disimpan di `apps/web/public/images/wildera/`:
  - `IMG_5448.jpg`: Puncak Gunung Ciremai 3.078 mdpl (Cover Media).
  - `IMG_5447.jpg`: Jalur pendakian hutan pinus Palutungan.
  - `IMG_5435.jpg`: Tim dan suasana camp pendaki Wildera.
  - `IMG_5342.jpg` & `IMG_5343.jpg`: Summit ridge dan panorama atap Jawa Barat.

### 2.7 Kebijakan & Legalitas (Policies & FAQ)

- `apps/web/src/app/safety/page.tsx`: Standar Keselamatan (SOP, kualifikasi APGI, mitigasi AMS, etika LNT).
- `apps/web/src/app/terms/page.tsx`: Syarat & Ketentuan pendaftaran dan keikutsertaan.
- `apps/web/src/app/cancellation/page.tsx`: Kebijakan Pembatalan, refund berjenjang, reschedule, dan force majeure.
- `apps/web/src/app/privacy/page.tsx`: Kebijakan Perlindungan Data Pribadi dan riwayat medis.
- `apps/web/src/app/faq/page.tsx`: 10 FAQ lengkap menjawab pertanyaan umum, persiapan fisik, simaksi, dan cara booking.

---

## 3. Eksekusi Seeder Produksi

Seeder produksi (`database/seeds/production.ts`) telah dijalankan dan memuat seluruh data riil tersebut secara idempoten:

```bash
npm run db:seed:prod
```

Hasil:

```text
Production database seeded successfully with authentic Wildera Adventure business content.
```

---

## 4. Quality Gate Verification

- `npm test`: **136/136 PASS**.
- `npm run test:db -w @wildera/api`: **57/57 PASS**.
- `npm run format && npm run lint`: **0 warning, 0 error**.
- `npm run typecheck`: **Strict clean, 0 error**.
