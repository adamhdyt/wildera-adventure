import { expect, test } from '@playwright/test';

test.describe('Analytics & Conversion Tracking (STEP 35)', () => {
  test('tracks view_home on homepage load with zero PII', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect
      .poll(
        async () => {
          return await page.evaluate(() => {
            return (
              window.__WILDERA_ANALYTICS_EVENTS__?.map((e) => e.event) || []
            );
          });
        },
        { timeout: 10000 },
      )
      .toContain('view_home');

    const events = await page.evaluate(() => {
      return window.__WILDERA_ANALYTICS_EVENTS__ || [];
    });

    const homeEvent = events.find((e) => e.event === 'view_home');
    expect(homeEvent).toBeDefined();
    expect(homeEvent?.timestamp).toBeTruthy();
    expect(homeEvent?.properties?.page).toBe('home');

    // Confirm zero PII fields
    expect(homeEvent?.properties?.phone).toBeUndefined();
    expect(homeEvent?.properties?.email).toBeUndefined();
    expect(homeEvent?.properties?.name).toBeUndefined();
  });

  test('tracks view_trip_list on catalog page load', async ({ page }) => {
    await page.goto('/trip', { waitUntil: 'domcontentloaded' });

    await expect
      .poll(
        async () => {
          return await page.evaluate(() => {
            return (
              window.__WILDERA_ANALYTICS_EVENTS__?.map((e) => e.event) || []
            );
          });
        },
        { timeout: 10000 },
      )
      .toContain('view_trip_list');

    const events = await page.evaluate(() => {
      return window.__WILDERA_ANALYTICS_EVENTS__ || [];
    });

    const catalogEvent = events.find((e) => e.event === 'view_trip_list');
    expect(catalogEvent).toBeDefined();
    expect(catalogEvent?.timestamp).toBeTruthy();
  });

  test('tracks view_trip, select_schedule, select_package, and click_book_whatsapp', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/trip/open-trip-rinjani-summit-4d3n', {
      waitUntil: 'domcontentloaded',
    });

    // 1. view_trip tracked on mount
    await expect
      .poll(
        async () => {
          return await page.evaluate(() => {
            return (
              window.__WILDERA_ANALYTICS_EVENTS__?.map((e) => e.event) || []
            );
          });
        },
        { timeout: 10000 },
      )
      .toContain('view_trip');

    let events = await page.evaluate(() => {
      return window.__WILDERA_ANALYTICS_EVENTS__ || [];
    });
    const viewTripEvent = events.find((e) => e.event === 'view_trip');
    expect(viewTripEvent).toBeDefined();
    expect(viewTripEvent?.properties?.tripSlug).toBe(
      'open-trip-rinjani-summit-4d3n',
    );
    expect(viewTripEvent?.properties?.phone).toBeUndefined();

    // 2. select_schedule
    const scheduleButtons = page.locator(
      '#schedule-selector button[data-testid^="schedule-option-"]',
    );
    const scheduleCount = await scheduleButtons.count();
    if (scheduleCount > 0) {
      await scheduleButtons.first().click();

      await expect
        .poll(
          async () => {
            return await page.evaluate(() => {
              return (
                window.__WILDERA_ANALYTICS_EVENTS__?.map((e) => e.event) || []
              );
            });
          },
          { timeout: 10000 },
        )
        .toContain('select_schedule');

      events = await page.evaluate(() => {
        return window.__WILDERA_ANALYTICS_EVENTS__ || [];
      });
      const schedEvent = events.find((e) => e.event === 'select_schedule');
      expect(schedEvent).toBeDefined();
      expect(schedEvent?.properties?.tripSlug).toBe(
        'open-trip-rinjani-summit-4d3n',
      );
    }

    // 3. select_package
    const packageButtons = page.locator(
      '#package-selector button[data-testid^="package-option-"]',
    );
    const packageCount = await packageButtons.count();
    if (packageCount > 0) {
      await packageButtons.first().click();

      await expect
        .poll(
          async () => {
            return await page.evaluate(() => {
              return (
                window.__WILDERA_ANALYTICS_EVENTS__?.map((e) => e.event) || []
              );
            });
          },
          { timeout: 10000 },
        )
        .toContain('select_package');

      events = await page.evaluate(() => {
        return window.__WILDERA_ANALYTICS_EVENTS__ || [];
      });
      const pkgEvent = events.find((e) => e.event === 'select_package');
      expect(pkgEvent).toBeDefined();
      expect(pkgEvent?.properties?.price).toBeGreaterThan(0);
    }

    // 4. click_book_whatsapp
    const bookingBtn = page.getByTestId('booking-cta-button');
    if (await bookingBtn.isVisible()) {
      await bookingBtn.click();

      await expect
        .poll(
          async () => {
            return await page.evaluate(() => {
              return (
                window.__WILDERA_ANALYTICS_EVENTS__?.map((e) => e.event) || []
              );
            });
          },
          { timeout: 10000 },
        )
        .toContain('click_book_whatsapp');

      events = await page.evaluate(() => {
        return window.__WILDERA_ANALYTICS_EVENTS__ || [];
      });
      const clickEvent = events.find((e) => e.event === 'click_book_whatsapp');
      expect(clickEvent).toBeDefined();
      expect(clickEvent?.properties?.phone).toBeUndefined();
      expect(clickEvent?.properties?.email).toBeUndefined();
    }
  });

  test('tracks click_health_whatsapp with zero medical data', async ({
    page,
  }) => {
    await page.goto('/trip/open-trip-rinjani-summit-4d3n', {
      waitUntil: 'domcontentloaded',
    });

    const healthBtn = page.getByTestId('health-whatsapp-cta');
    if (await healthBtn.isVisible()) {
      await healthBtn.click();

      await expect
        .poll(
          async () => {
            return await page.evaluate(() => {
              return (
                window.__WILDERA_ANALYTICS_EVENTS__?.map((e) => e.event) || []
              );
            });
          },
          { timeout: 10000 },
        )
        .toContain('click_health_whatsapp');

      const events = await page.evaluate(() => {
        return window.__WILDERA_ANALYTICS_EVENTS__ || [];
      });
      const healthEvent = events.find(
        (e) => e.event === 'click_health_whatsapp',
      );
      expect(healthEvent).toBeDefined();
      expect(healthEvent?.properties?.tripSlug).toBe(
        'open-trip-rinjani-summit-4d3n',
      );

      // Confirm no medical or personal data
      expect(healthEvent?.properties?.medical).toBeUndefined();
      expect(healthEvent?.properties?.medicalData).toBeUndefined();
      expect(healthEvent?.properties?.phone).toBeUndefined();
      expect(healthEvent?.properties?.name).toBeUndefined();
    }
  });

  test('tracks private_trip_inquiry on successful inquiry submission with strictly sanitized non-PII properties', async ({
    page,
  }) => {
    await page.goto('/private-trip');

    // Ensure hydration
    const dateInput = page.locator('input[name="preferredDate"]');
    await dateInput.waitFor({ state: 'visible' });
    await dateInput.fill('2026-11-20');
    await expect(dateInput).toHaveValue('2026-11-20');

    const countInput = page.locator('input[name="participantCount"]');
    await countInput.fill('6');
    await expect(countInput).toHaveValue('6');

    await page.locator('input[name="meetingPoint"]').fill('Bandara Lombok LOP');
    await page.locator('input[name="name"]').fill('Alex Traveler');
    await page.locator('input[name="whatsapp"]').fill('081234567890');
    await page.locator('input[name="email"]').fill('alex@example.com');
    await page
      .locator('textarea[name="requirements"]')
      .fill('Tenda kapasitas 2 orang per dome');

    // Submit form
    await page
      .getByRole('button', { name: /Kirim Permintaan Private Trip/i })
      .click();

    // Wait for success screen
    await expect(page.getByText('Permintaan Terkirim')).toBeVisible({
      timeout: 10000,
    });

    // Check tracked events with polling
    await expect
      .poll(
        async () => {
          return await page.evaluate(() => {
            return (
              window.__WILDERA_ANALYTICS_EVENTS__?.map((e) => e.event) || []
            );
          });
        },
        { timeout: 10000 },
      )
      .toContain('private_trip_inquiry');

    const events = await page.evaluate(() => {
      return window.__WILDERA_ANALYTICS_EVENTS__ || [];
    });

    const inquiryEvent = events.find((e) => e.event === 'private_trip_inquiry');
    expect(inquiryEvent).toBeDefined();
    expect(inquiryEvent?.properties?.participantCount).toBe(6);
    expect(inquiryEvent?.properties?.destination).toBeTruthy();

    // STRICT ROADMAP CONSTRAINT: Do not send phone, email, name, identity, medical data
    expect(inquiryEvent?.properties?.phone).toBeUndefined();
    expect(inquiryEvent?.properties?.whatsappNumber).toBeUndefined();
    expect(inquiryEvent?.properties?.customerName).toBeUndefined();
    expect(inquiryEvent?.properties?.name).toBeUndefined();
    expect(inquiryEvent?.properties?.email).toBeUndefined();
    expect(inquiryEvent?.properties?.identity).toBeUndefined();
    expect(inquiryEvent?.properties?.medicalData).toBeUndefined();
  });
});
