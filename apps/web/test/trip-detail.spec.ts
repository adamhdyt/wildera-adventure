import { expect, test } from '@playwright/test';

test.describe('Public Trip Detail (STEP 21)', () => {
  const TRIP_SLUG = 'open-trip-rinjani-summit-4d3n';

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('renders full trip detail page with hero, summary, itinerary, facilities, and policies', async ({
    page,
  }) => {
    await page.goto(`/trip/${TRIP_SLUG}`, { waitUntil: 'domcontentloaded' });

    // 1. Hero
    const hero = page.getByTestId('trip-hero');
    await expect(hero).toBeVisible();
    await expect(page.getByTestId('trip-title')).toBeVisible();
    await expect(hero.getByText(/Gunung Rinjani/i)).toBeVisible();

    // 2. Summary
    const summary = page.getByTestId('trip-summary-section');
    await expect(summary).toBeVisible();
    await expect(summary.getByText(/3.726 mdpl/i)).toBeVisible();

    // 3. Overview
    const overview = page.getByTestId('trip-overview-section');
    await expect(overview).toBeVisible();

    // 4. Itinerary
    const itinerary = page.getByTestId('trip-itinerary-section');
    await expect(itinerary).toBeVisible();
    await expect(page.getByTestId('itinerary-day-1')).toBeVisible();

    // 5. Facilities (Include / Exclude)
    const facilities = page.getByTestId('trip-facilities-section');
    await expect(facilities).toBeVisible();
    await expect(facilities.getByText(/Sudah Termasuk/i)).toBeVisible();
    await expect(facilities.getByText(/Tidak Termasuk/i)).toBeVisible();

    // 6. Meeting Point
    const meetingPoint = page.getByTestId('trip-meeting-point-section');
    await expect(meetingPoint).toBeVisible();

    // 7. Gear
    const gear = page.getByTestId('trip-gear-section');
    await expect(gear).toBeVisible();
    await expect(gear.getByText(/Perlengkapan Wajib/i)).toBeVisible();

    // 8. Health & Difficulty
    const health = page.getByTestId('trip-health-difficulty-section');
    await expect(health).toBeVisible();

    // 9. FAQ
    const faq = page.getByTestId('trip-faq-section');
    await expect(faq).toBeVisible();

    // 10. Policies
    const policies = page.getByTestId('trip-policies-section');
    await expect(policies).toBeVisible();
  });

  test('desktop sticky booking card allows schedule & package selection and generates WhatsApp CTA', async ({
    page,
  }) => {
    await page.goto(`/trip/${TRIP_SLUG}`, { waitUntil: 'domcontentloaded' });

    const bookingCard = page.getByTestId('booking-card');
    await expect(bookingCard).toBeVisible();

    // Schedule selector
    const scheduleSelector = page.getByTestId('schedule-selector');
    await expect(scheduleSelector).toBeVisible();

    // Package selector
    const packageSelector = page.getByTestId('package-selector');
    await expect(packageSelector).toBeVisible();

    // Click first package option (e.g. Start Jakarta)
    const firstPackage = packageSelector.locator('button').first();
    await firstPackage.click();

    // Price should be formatted IDR
    const priceDisplay = page.getByTestId('booking-card-price');
    await expect(priceDisplay).toBeVisible();
    await expect(priceDisplay).toContainText('Rp');

    // CTA button should be active WhatsApp link
    const ctaButton = page.getByTestId('booking-cta-button');
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveAttribute('href', /wa\.me/);
    const href = (await ctaButton.getAttribute('href')) || '';
    expect(href).toContain('Rinjani');
  });

  test('mobile sticky bottom CTA is visible on mobile viewport and provides smooth scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/trip/${TRIP_SLUG}`, { waitUntil: 'domcontentloaded' });

    const mobileCta = page.getByTestId('mobile-sticky-cta');
    await expect(mobileCta).toBeVisible();

    const priceText = page.getByTestId('mobile-sticky-price');
    await expect(priceText).toBeVisible();
    await expect(priceText).toContainText('Rp');

    const actionButton = mobileCta.locator('a, button');
    await expect(actionButton).toBeVisible();
    await actionButton.click();
  });
});
