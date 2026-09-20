# Report STEP 31 — CMS Basic: FAQ & Content Pages

## 1. Overview

Implementasi Content Management System (CMS) Basic untuk pengelolaan FAQ dan Halaman Konten / Kebijakan Publik Wildera Adventure sesuai spesifikasi roadmap STEP 31:

- **Public Readers & Interactive FAQ (`/faq`, `/tentang`, `/about`, `/terms`, `/privacy`, `/cancellation`, `/safety`)**:
  - Halaman FAQ interaktif (`/faq`) dengan filter kategori (Booking, Layanan, Pembayaran, Logistik, Umum), pencarian langsung real-time, collapsible accordion, dan direct CTA konsultasi WhatsApp CS.
  - Halaman Profil Perusahaan (`/tentang`) dan redirect permanen dari `/about` ke `/tentang`.
  - Halaman Kebijakan Publik resmi: Syarat & Ketentuan (`/terms`), Kebijakan Privasi (`/privacy`), Kebijakan Pembatalan & Refund (`/cancellation`), dan Standar Keselamatan & SOP Pendakian (`/safety`).
  - Dilengkapi komponen `ContentPageView` dengan sidebar navigasi kebijakan yang aktif dan fallback copy resmi hasil ekstraksi dokumen Google Drive Wildera saat data database kosong atau belum di-publish.
- **Admin Content Management (`/admin/content`)**:
  - Diproteksi RBAC menggunakan permission `CONTENT_VIEW` dan `CONTENT_MANAGE`.
  - Tampilan tab navigasi: **💬 FAQ (Tanya Jawab)** dan **📄 Halaman Kebijakan (Pages)**.
  - **Manajemen FAQ**: Filter status (`PUBLISHED`, `DRAFT`, `ARCHIVED`), filter kategori, pencarian keyword, pagination, urutan tampilan (`sortOrder`), modal drawer Tambah & Ubah FAQ, serta modal konfirmasi hapus.
  - **Manajemen Halaman Konten**: Filter status, pencarian judul/slug, pagination, modal drawer Tambah & Ubah halaman (slug unik, judul, excerpt, rich content markdown/HTML), pratinjau live, dan modal hapus.
  - Audit logging terintegrasi mencatat setiap pembuatan, perubahan, dan penghapusan konten (`FAQ_CREATED`, `FAQ_UPDATED`, `FAQ_DELETED`, `CONTENT_PAGE_CREATED`, `CONTENT_PAGE_UPDATED`, `CONTENT_PAGE_DELETED`).
- **Public & Admin API Endpoints**:
  - Publik: `GET /api/v1/faqs` (hanya `PUBLISHED`, terurut asc) dan `GET /api/v1/content-pages/:slug` (hanya `PUBLISHED`).
  - Admin: CRUD lengkap `/api/v1/admin/faqs` & `/api/v1/admin/content-pages` dengan validasi ketat dan otorisasi session token.

## 2. Arsitektur & File Terdampak

1. **Packages**:
   - `packages/types/src/index.ts`: Interface DTO `AdminFaq`, `PublicFaq`, `AdminContentPage`, `PublicContentPage`, payload create/update, query filters, dan paginated response.
   - `packages/validation/src/index.ts`: Runtime validator `validateCreateFaq`, `validateUpdateFaq`, `validateFaqQuery`, `validateCreateContentPage`, `validateUpdateContentPage`, `validateContentPageQuery`, serta normalisasi pagination query string numerik.
2. **Backend API (`apps/api`)**:
   - `apps/api/src/modules/content/content.service.ts`: Business logic CRUD FAQ dan Content Pages, isolasi status publik vs admin, query filtering, reordering, dan atomik audit logging.
   - `apps/api/src/modules/content/faq.controller.ts` & `faq-public.controller.ts`: Controller admin dan publik untuk FAQ.
   - `apps/api/src/modules/content/content-page.controller.ts` & `content-page-public.controller.ts`: Controller admin dan publik untuk Content Pages.
   - `apps/api/src/modules/content/content.module.ts`: Modul CMS NestJS teregistrasi di `app.module.ts`.
3. **Frontend Web (`apps/web`)**:
   - `apps/web/src/app/admin/(protected)/content/page.tsx` & `content-client.tsx`: Server component dan Client interactive CMS dashboard dengan header `<h1>Konten</h1>`.
   - `apps/web/src/app/api/admin/faqs/route.ts` & `[id]/route.ts`: Next.js BFF handlers untuk FAQ admin.
   - `apps/web/src/app/api/admin/content-pages/route.ts` & `[id]/route.ts`: Next.js BFF handlers untuk Content Pages admin.
   - `apps/web/src/app/faq/page.tsx` & `faq-client.tsx`: Public FAQ page & interactive client accordion.
   - `apps/web/src/components/public/content-page-view.tsx`: Reusable reader layout & kebijakan sidebar.
   - `apps/web/src/app/tentang/page.tsx`, `/about/page.tsx`, `/terms/page.tsx`, `/privacy/page.tsx`, `/cancellation/page.tsx`, `/safety/page.tsx`: Halaman publik reader.
   - `apps/web/src/lib/public-api.ts`: Fetcher publik `fetchPublicFaqs()` dan `fetchPublicContentPage(slug)`.

## 3. Test Verification

1. **Unit Tests**:
   - `apps/api/test/content-validation.test.ts` PASS (18 test assertions untuk validasi create/update/query FAQ dan Content Pages).
   - Total Unit Tests: **102/102 PASS** (`npm test`).
2. **Database Integration Tests**:
   - `apps/api/test/database/content.test.ts` PASS (Verifikasi FAQ lifecycle, reordering, content page CRUD, public published-only isolation, admin filter & search, dan audit trail).
   - Total Database Tests: **50/50 PASS** (`npm run test:db -w @wildera/api`).
3. **Playwright E2E Tests**:
   - `apps/web/test/content-pages.spec.ts` PASS (Verifikasi public FAQ rendering, search filtering, category pill selection, accordion toggle, WhatsApp CTA, policy pages rendering, sidebar navigation, dan redirect `/about` -> `/tentang`).
   - `apps/web/test/admin.spec.ts` PASS (Verifikasi navigasi admin shell dan ketersediaan UI `+ Tambah FAQ` pada tab Konten).
   - Total Playwright Tests: **36/36 PASS** (`npm run test:admin`).
4. **Quality Gates**:
   - TypeScript Typecheck: Clean PASS (`npm run typecheck`).
   - ESLint & Prettier: Clean PASS (0 error, 0 warning).
   - Production Build: Clean PASS (`apps/api` NestJS build + `apps/web` Next.js 16 build).
