import { expect, test } from '@playwright/test';

test.describe('WhatsApp Conversion & Utilities (STEP 22)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('floating WhatsApp button renders on public pages and opens with global message', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Floating WA button
    const floatingAside = page.locator('aside[aria-label="Floating WhatsApp"]');
    await expect(floatingAside).toBeVisible();

    const floatingLink = floatingAside.locator('a');
    await expect(floatingLink).toBeVisible();

    const href = await floatingLink.getAttribute('href');
    expect(href).toContain('https://wa.me/6281234567890');
    expect(href).toContain(
      encodeURIComponent(
        'Halo Wildera Adventure 👋\n\nSaya ingin bertanya mengenai jadwal trip pendakian dan ekspedisi alam terbuka Wildera.',
      ),
    );
  });

  test('floating WhatsApp button does not render on admin pages', async ({
    page,
  }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    const floatingAside = page.locator('aside[aria-label="Floating WhatsApp"]');
    await expect(floatingAside).toHaveCount(0);
  });

  test('trip detail booking card generates contextual WhatsApp link with trip, schedule, package, and price', async ({
    page,
  }) => {
    await page.goto('/trip/open-trip-rinjani-summit-4d3n', {
      waitUntil: 'domcontentloaded',
    });

    const bookingCard = page.getByTestId('booking-card');
    await expect(bookingCard).toBeVisible();

    // Select schedule (first schedule)
    const scheduleSelector = bookingCard.getByTestId('schedule-selector');
    await expect(scheduleSelector).toBeVisible();

    // Select package (first package)
    const packageSelector = bookingCard.getByTestId('package-selector');
    await expect(packageSelector).toBeVisible();
    await packageSelector.locator('button').first().click();

    // Verify WhatsApp CTA link
    const ctaButton = bookingCard.getByTestId('booking-cta-button');
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveText(/Book via WhatsApp/i);

    const href = await ctaButton.getAttribute('href');
    expect(href).toContain('https://wa.me/6281234567890');
    expect(href).toContain(encodeURIComponent('Halo Wildera Adventure 👋'));
    expect(href).toContain(
      encodeURIComponent('Trip: Open Trip Rinjani Summit & Segara Anak 4D3N'),
    );
    expect(href).toContain(
      encodeURIComponent('Paket: Paket Start Jakarta (All-in)'),
    );
    expect(href).toContain(
      encodeURIComponent('Mohon info untuk proses booking selanjutnya.'),
    );
  });

  test('health consultation WhatsApp CTA generates contextual medical inquiry message', async ({
    page,
  }) => {
    await page.goto('/trip/open-trip-rinjani-summit-4d3n', {
      waitUntil: 'domcontentloaded',
    });

    const healthSection = page.getByTestId('trip-health-difficulty-section');
    await expect(healthSection).toBeVisible();

    const healthCta = page.getByTestId('health-whatsapp-cta');
    await expect(healthCta).toBeVisible();

    const href = await healthCta.getAttribute('href');
    expect(href).toContain('https://wa.me/6281234567890');
    expect(href).toContain(
      encodeURIComponent(
        'Saya ingin berkonsultasi mengenai persyaratan surat keterangan sehat untuk trip: Open Trip Rinjani Summit & Segara Anak 4D3N.',
      ),
    );
  });

  test('navbar and footer links have properly formatted global WhatsApp links', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Navbar WA
    const navbarWa = page.locator(
      'nav[data-section="navbar"] a[href^="https://wa.me"]',
    );
    await expect(navbarWa.first()).toBeVisible();
    const navHref = await navbarWa.first().getAttribute('href');
    expect(navHref).toContain('https://wa.me/6281234567890');

    // Footer WA
    const footerWa = page.locator(
      'footer[data-section="footer"] a[href^="https://wa.me"]',
    );
    await expect(footerWa).toBeVisible();
    const footerHref = await footerWa.getAttribute('href');
    expect(footerHref).toContain('https://wa.me/6281234567890');
  });

  test('mobile sticky bottom bar has contextual WhatsApp link on mobile viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/trip/open-trip-rinjani-summit-4d3n', {
      waitUntil: 'domcontentloaded',
    });

    const mobileStickyCta = page.getByTestId('mobile-sticky-cta');
    await expect(mobileStickyCta).toBeVisible();

    // Link should be active since default schedule & package are selected
    const bookWaLink = mobileStickyCta.locator('a');
    await expect(bookWaLink).toBeVisible();
    await expect(bookWaLink).toContainText('Book via WA');

    const href = await bookWaLink.getAttribute('href');
    expect(href).toContain('https://wa.me/6281234567890');
    expect(href).toContain(
      encodeURIComponent('Trip: Open Trip Rinjani Summit & Segara Anak 4D3N'),
    );
  });
});
