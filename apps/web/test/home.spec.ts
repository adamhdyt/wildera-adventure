import { expect, test } from '@playwright/test';

test.describe('Public Homepage (STEP 18)', () => {
  test('renders all 10 core sections per UX specification', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 1. Header / Navbar
    const nav = page.locator('nav[data-section="navbar"]');
    await expect(nav).toBeVisible();
    await expect(
      nav.getByRole('link', { name: 'Wildera', exact: true }),
    ).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Explore Trip' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Destinasi' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Private Trip' })).toBeVisible();
    await expect(
      nav.getByRole('link', { name: 'Tentang Wildera' }),
    ).toBeVisible();
    await expect(nav.getByRole('link', { name: 'FAQ' })).toBeVisible();

    // 2. Hero Section
    const hero = page.locator('section[aria-label="Hero section"]');
    await expect(hero).toBeVisible();
    await expect(
      hero.getByRole('heading', { name: 'Wildera', exact: true }),
    ).toBeVisible();
    await expect(hero.getByText(/Temukan perjalanan gunungmu/i)).toBeVisible();
    await expect(
      hero.getByRole('link', { name: 'Jelajahi Trip' }),
    ).toBeVisible();
    await expect(
      hero.getByRole('link', { name: 'Private Trip' }),
    ).toBeVisible();

    // 3. Upcoming Trips Section
    const upcoming = page.locator('section[aria-label="Upcoming Trips"]');
    await expect(upcoming).toBeVisible();
    await expect(
      upcoming.getByRole('heading', { name: 'Jadwal Pendakian Terdekat' }),
    ).toBeVisible();
    await expect(upcoming.getByText(/Lihat Semua Jadwal Trip/i)).toBeVisible();

    // 4. Explore Destinations Section
    const destinations = page.locator(
      'section[aria-label="Explore Destinations"]',
    );
    await expect(destinations).toBeVisible();
    await expect(
      destinations.getByRole('heading', { name: 'Eksplorasi Puncak Ikonik' }),
    ).toBeVisible();

    // 5. Why Wildera Section
    const whyWildera = page.locator('section[aria-label="Why Wildera"]');
    await expect(whyWildera).toBeVisible();
    await expect(
      whyWildera.getByText(/Standar Keselamatan Medis Ketat/i),
    ).toBeVisible();
    await expect(
      whyWildera.getByText(/Guide Bersertifikat & Porter Handal/i),
    ).toBeVisible();

    // 6. How It Works Section
    const howItWorks = page.locator('section[aria-label="How It Works"]');
    await expect(howItWorks).toBeVisible();
    await expect(
      howItWorks.getByRole('heading', { name: '5 Langkah Menuju Puncak' }),
    ).toBeVisible();
    await expect(howItWorks.getByText(/Langkah 01/i)).toBeVisible();
    await expect(howItWorks.getByText(/Langkah 05/i)).toBeVisible();

    // 7. Private Trip CTA Section
    const privateTripCta = page.locator(
      'section[aria-label="Private Trip CTA"]',
    );
    await expect(privateTripCta).toBeVisible();
    await expect(
      privateTripCta.getByRole('heading', {
        name: 'Punya Rombongan & Jadwal Sendiri?',
      }),
    ).toBeVisible();
    await expect(
      privateTripCta.getByRole('link', { name: 'Rencanakan Private Trip' }),
    ).toBeVisible();

    // 8. FAQ Section & Accordion Interaction
    const faq = page.locator('section[aria-label="FAQ"]');
    await expect(faq).toBeVisible();
    await expect(
      faq.getByRole('heading', { name: 'Pertanyaan yang Sering Diajukan' }),
    ).toBeVisible();

    // Test accordion open/close
    const secondFaqQuestion = faq.getByRole('button', {
      name: /Apa saja perlengkapan pribadi yang wajib dibawa peserta/i,
    });
    await expect(secondFaqQuestion).toBeVisible();
    await secondFaqQuestion.click();
    await expect(
      faq.getByText(/Perlengkapan pribadi esensial meliputi: sepatu trekking/i),
    ).toBeVisible();

    // 9. Final CTA Section
    const finalCta = page.locator('section[aria-label="Final CTA"]');
    await expect(finalCta).toBeVisible();
    await expect(
      finalCta.getByRole('heading', { name: /Siap Menapaki Puncak Impianmu/i }),
    ).toBeVisible();
    await expect(
      finalCta.getByRole('link', { name: 'Jelajahi Semua Trip' }),
    ).toBeVisible();

    // 10. Site Footer
    const footer = page.locator('footer[data-section="footer"]');
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/© 2026 Wildera Adventure/i)).toBeVisible();
    await expect(
      footer.getByRole('link', { name: 'Syarat & Ketentuan' }),
    ).toBeVisible();
    await expect(
      footer.getByRole('link', { name: 'Kebijakan Privasi' }),
    ).toBeVisible();
  });

  test('mobile responsiveness and navigation drawer', async ({ page }) => {
    // Set mobile viewport (iPhone 14)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Verify hero and title render nicely on mobile
    const hero = page.locator('section[aria-label="Hero section"]');
    await expect(hero).toBeVisible();

    // Check hamburger button exists and toggles menu
    const nav = page.locator('nav[data-section="navbar"]');
    const menuButton = nav.getByRole('button', { name: 'Menu navigasi' });
    await expect(menuButton).toBeVisible();

    // Initially mobile dropdown is not open
    await expect(
      nav.getByRole('link', { name: 'Hubungi via WhatsApp' }),
    ).not.toBeVisible();

    // Click hamburger button to open mobile menu
    await menuButton.click();
    await expect(
      nav.getByRole('link', { name: 'Hubungi via WhatsApp' }),
    ).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Explore Trip' })).toBeVisible();

    // Click again to close
    await menuButton.click();
    await expect(
      nav.getByRole('link', { name: 'Hubungi via WhatsApp' }),
    ).not.toBeVisible();
  });
});
