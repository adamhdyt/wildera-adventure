# PHASE 0: Document validation

Tanggal: 15 September 2026. Acuan: brief implementasi pengguna dan keenam dokumen 01–06. Blueprint lama di root bukan source of truth tambahan.

## MVP scope

Discovery trip/gunung/destinasi, detail dengan jadwal dan paket, konversi WhatsApp, admin auth/RBAC, booking manual, kapasitas jadwal, peserta/manifest, inquiry Private Trip, CMS dasar, media, SEO, analytics, audit, keamanan dan kesiapan operasional produksi.

Pembayaran online, checkout, akun customer, reservasi sementara, Redis, message broker, microservices dan fitur future lain di brief tidak dibangun.

## Architecture

Monorepo: Next.js App Router + React + TypeScript + Tailwind di `apps/web`; NestJS REST modular monolith di `apps/api`. PostgreSQL melalui Prisma adalah sumber data authoritative. Media binary berada di S3-compatible storage. Shared package: ui, types, validation, config. Business API menggunakan `/api/v1`; `/health` berada di luar prefix dan baru dibuat pada STEP 4 bersama pemeriksaan database.

## Core entities

- Katalog: Destination, Mountain, Route, Trip.
- Konten trip: TripItinerary, TripFacility, TripGear, TripFaq.
- Keberangkatan: TripSchedule, MeetingPoint, SchedulePackage.
- Operasional: Customer, Booking, BookingParticipant, PrivateTripInquiry.
- Media/CMS: MediaAsset, TripMedia, MountainMedia, Faq, ContentPage, SiteSetting.
- Keamanan: AdminUser, Role, AdminUserRole, AuditLog.

Hanya 25 entity P0 tersebut untuk schema STEP 2. Guide dan assignment guide adalah P1.

## Core business rules

1. Trip merupakan template; schedule adalah keberangkatan. Paket berbagi kapasitas schedule.
2. `available_seats = capacity - SUM(participant_count WHERE booking.status = CONFIRMED)`. Tidak ada kolom available_seats dan tidak menghitung jumlah row peserta untuk inventory.
3. Konfirmasi, pembuatan booking confirmed, perubahan jumlah peserta confirmed, pembatalan confirmed dan pengurangan kapasitas harus mengikuti transaction/locking yang konsisten (ERD §121). Lock schedule sebelum menghitung dan memvalidasi occupancy.
4. Dua konfirmasi untuk satu seat terakhir menghasilkan satu success dan satu 409. Kapasitas baru tidak boleh di bawah confirmed seats.
5. Paket booking wajib milik schedule terpilih. Participant detail boleh belum lengkap.
6. Tidak ada public booking endpoint. WhatsApp tidak membuat booking atau mengunci seat; admin mencatat dan mengonfirmasi.
7. Backend menegakkan RBAC. CONTENT tidak boleh membaca data peserta atau mengubah booking. Cookie admin HttpOnly; tidak menyimpan token di localStorage.
8. Public API mengecualikan draft dan data pribadi. Analytics tidak mengirim PII; audit append-only. Surat kesehatan tidak di-upload.

## Differences and governing references

| Temuan                                                                                                        | Acuan dan penanganan                                                                                                                                                                                                                                                      | Dampak/dependency                                                                                 |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| PRD §25 mencampur availability dengan status; ERD §25 memisahkan lifecycle                                    | Brief STEP 15 eksplisit: DRAFT/OPEN/CLOSED/CANCELLED/COMPLETED disimpan; availability dihitung. Ini klarifikasi langsung pengguna.                                                                                                                                        | STEP 2, 15, 24; PRD/UX perlu dibaca sebagai status tampilan untuk AVAILABLE/ALMOST_FULL/SOLD_OUT. |
| PRD §37 memakai WEBSITE; arsitektur §100, ERD §40 dan API memakai WEBSITE_WHATSAPP                            | Brief STEP 23 secara eksplisit menggunakan WEBSITE_WHATSAPP.                                                                                                                                                                                                              | Enum STEP 2 dan booking STEP 23.                                                                  |
| PRD §39 menyebut nama dan tanggal lahir minimum; ERD §43–44/API §102 mengizinkan tanggal lahir nullable       | PRD §80 menyatakan exact mandatory participant data masih terbuka. Brief STEP 28: nama wajib universal kecuali business rule menentukan lain. Simpan nullable sesuai ERD; finalisasi kewajiban operasional sebelum STEP 28/launch, tanpa mengklaim kebijakan sudah final. | Tidak menghalangi scaffold; validasi final peserta perlu keputusan bisnis.                        |
| Meeting point Private Trip minimum di PRD §44, optional di UX §51/ERD §59/API §43                             | PRD lebih tinggi: form dan API harus mewajibkan meeting point request; DB nullable tetap dapat menampung data lama/tidak lengkap.                                                                                                                                         | STEP 30: validasi mengikuti PRD; catat penyesuaian UX/API sebelum implementasi.                   |
| PRD §59 menggunakan private_trip_view; UX §108 menggunakan view_private_trip; backlog tidak mencantumkan view | Gunakan nama PRD private_trip_view saat STEP 35; event submission tetap private_trip_inquiry.                                                                                                                                                                             | Hindari dua event untuk satu view.                                                                |
| Header semua dokumen APPROVED FOR DEVELOPMENT; PRD §84 dan backlog §52 masih REVIEW                           | Pengguna menginstruksikan mulai validasi lalu scaffold. Approval produksi/kebijakan belum dianggap selesai.                                                                                                                                                               | Tidak menghalangi STEP 1; kebijakan dan UAT tetap dependency launch.                              |
| Arsitektur §13 menyarankan packages/contracts; struktur brief STEP 1 tidak memasukkannya                      | Gunakan empat shared package yang diminta. Contracts belum dibutuhkan.                                                                                                                                                                                                    | Tidak ada package domain spekulatif.                                                              |
| Backlog Sprint 0 mencakup DB, auth, staging; STEP 1 hanya scaffold                                            | Ikuti urutan STEP eksplisit pengguna; DB STEP 2, seed STEP 3, backend foundation STEP 4, auth STEP 5.                                                                                                                                                                     | STEP 1 PASS tidak berarti seluruh Sprint 0 atau MVP PASS.                                         |
| UX §37 CTA utama disabled tanpa jadwal; §120 sticky CTA scroll ke selector                                    | Dua konteks kontrol berbeda, bukan konflik.                                                                                                                                                                                                                               | STEP 21 menerapkan perilaku masing-masing.                                                        |
| ERD diagram §7 menunjukkan ContentPage → MediaAsset tanpa FK pada definisi tabel                              | Jangan membuat FK baru berdasarkan diagram saja; gunakan tabel media §65 dan content §70.                                                                                                                                                                                 | Review saat CMS/media membutuhkan attachment halaman; tidak menambah schema sekarang.             |

Tidak ada blocking conflict untuk STEP 1. Enam dokumen baseline tidak diubah. Catatan ini tidak menetapkan kebijakan bisnis yang masih terbuka.

## Critical dependencies

Scaffold → PostgreSQL/Prisma → seed → backend foundation → auth/RBAC → katalog → trip/content/media → schedule/package → public API/UI/WhatsApp → booking/capacity → peserta → Private Trip/CMS → SEO/analytics/audit → hardening/UAT/launch.

Sebelum launch: finalisasi cancellation/refund/reschedule/minimum peserta dan usia, data peserta wajib, requirement kesehatan, aset/foto/harga asli, kontak bisnis, kredensial terpisah staging/production, backup dan restore, concurrency test dan RBAC.

## Validation result

- PASS: enam dokumen dibaca, scope dan entity P0 dipetakan.
- PASS: aturan inventory/WhatsApp sesuai brief; perbedaan dicatat dengan referensi bagian.
- PASS: dependency STEP 1 tidak memerlukan keputusan kebijakan produksi.
- Lint/typecheck/test: tidak berlaku untuk validasi dokumen; belum ada aplikasi.

PHASE 0 STATUS: PASS (untuk melanjutkan STEP 1).
