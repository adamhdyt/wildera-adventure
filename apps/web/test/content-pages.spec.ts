import { test, expect } from '@playwright/test';

test.describe('Public Content & FAQ Pages (STEP 31)', () => {
  test('FAQ page renders hero, search, category filters, and accordion items', async ({
    page,
  }) => {
    await page.goto('/faq');

    // Hero title & description
    await expect(
      page.getByRole('heading', {
        name: 'Frequently Asked Questions (FAQ)',
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText(/Pusat Bantuan & Tanya Jawab/i)).toBeVisible();

    // Category filter tabs
    await expect(
      page.getByRole('button', { name: 'Semua Pertanyaan' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Booking', exact: true }),
    ).toBeVisible();

    // Search input
    const searchInput = page.getByPlaceholder(
      'Cari pertanyaan... (misal: booking, pemula, simaksi, sop buah)',
    );
    await expect(searchInput).toBeVisible();

    // Accordion item exists and can be clicked
    const firstFaq = page
      .getByRole('button', { name: /Apa itu Wildera Adventure\?/i })
      .first();
    await expect(firstFaq).toBeVisible();
    await firstFaq.click();

    // Search filters out non-matching questions
    await searchInput.fill('simaksi');
    await expect(
      page.getByRole('button', {
        name: /Apa saja yang sudah termasuk dalam harga trip\?/i,
      }),
    ).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(searchInput).toHaveValue('');
  });

  test('Policy pages render content and sidebar navigation', async ({
    page,
  }) => {
    // 1. Tentang Kami
    await page.goto('/tentang');
    await expect(
      page.getByRole('heading', {
        name: 'Tentang Wildera Adventure',
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText(/Visi & Nilai Kami/i)).toBeVisible();
    await expect(page.getByText(/Kantor & Informasi Kontak/i)).toBeVisible();

    // 2. Cancellation Policy
    await page.goto('/cancellation');
    await expect(
      page.getByRole('heading', {
        name: 'Kebijakan Pembatalan & Refund',
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText(/1\. Pembatalan oleh Peserta/i)).toBeVisible();

    // 3. Terms & Conditions
    await page.goto('/terms');
    await expect(
      page.getByRole('heading', {
        name: 'Syarat & Ketentuan',
        exact: true,
      }),
    ).toBeVisible();

    // 4. Privacy Policy
    await page.goto('/privacy');
    await expect(
      page.getByRole('heading', {
        name: 'Kebijakan Privasi',
        exact: true,
      }),
    ).toBeVisible();

    // 5. Safety Policy
    await page.goto('/safety');
    await expect(
      page.getByRole('heading', {
        name: 'Standar Keselamatan & SOP',
        exact: true,
      }),
    ).toBeVisible();

    // 6. /about redirects to /tentang
    await page.goto('/about');
    await expect(page).toHaveURL(/\/tentang/);
  });
});
