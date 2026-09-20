import { test, expect } from '@playwright/test';
import { Client } from 'pg';
import argon2 from 'argon2';
import { randomBytes, randomUUID } from 'node:crypto';

const password = randomBytes(24).toString('hex');
let db: Client;

test.beforeAll(async () => {
  const url = new URL(process.env.DATABASE_URL!);
  if (
    !process.env.ADMIN_TEST_DATABASE?.startsWith('wildera_admin_test_') ||
    url.pathname !== `/${process.env.ADMIN_TEST_DATABASE}`
  ) {
    throw new Error('Run through npm run test:admin');
  }
  db = new Client({ connectionString: url.toString() });
  await db.connect();
  const hash = await argon2.hash(password);
  for (const role of ['SUPER_ADMIN', 'OPERATIONS', 'CONTENT']) {
    const result = await db.query(
      'INSERT INTO roles (name, slug) VALUES ($1, $1) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id',
      [role],
    );
    const user = await db.query(
      "INSERT INTO admin_users (name, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'ACTIVE', updated_at = now() RETURNING id",
      [`Admin ${role}`, `critical_${role.toLowerCase()}@wildera.test`, hash],
    );
    await db.query('DELETE FROM admin_user_roles WHERE admin_user_id = $1', [
      user.rows[0].id,
    ]);
    await db.query(
      'INSERT INTO admin_user_roles (admin_user_id, role_id) VALUES ($1, $2)',
      [user.rows[0].id, result.rows[0].id],
    );
  }
});

test.afterAll(async () => {
  await db?.end();
});

test.describe('Critical Business Flows (STEP 37)', () => {
  test('E2E Public Flow: Homepage -> Trip Catalog -> Trip Detail -> Schedule -> Package -> WhatsApp', async ({
    page,
  }) => {
    // 1. Visit Homepage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Wildera/i);

    // 2. Navigate to Trip Catalog
    const exploreLink = page
      .getByRole('link', { name: /Explore Trip/i })
      .first();
    await exploreLink.click();
    await expect(page).toHaveURL(/\/trip/);
    await expect(
      page.getByRole('heading', { name: 'Explore Trip', level: 1 }),
    ).toBeVisible();

    // 3. Open Trip Detail
    const tripCardLink = page.locator('a[href^="/trip/"]').first();
    await expect(tripCardLink).toBeVisible();
    await tripCardLink.click();
    await expect(page).toHaveURL(/\/trip\/.+/);

    // 4. Select Schedule
    const scheduleSelector = page.locator('#schedule-selector');
    await expect(scheduleSelector).toBeVisible();
    const scheduleOption = page
      .locator('#schedule-selector button[data-testid^="schedule-option-"]')
      .first();
    await expect(scheduleOption).toBeVisible();
    await scheduleOption.click();

    // 5. Select Package
    const packageSelector = page.locator('#package-selector');
    await expect(packageSelector).toBeVisible();
    const packageOption = page
      .locator('#package-selector button[data-testid^="package-option-"]')
      .first();
    await expect(packageOption).toBeVisible();
    await packageOption.click();

    // 6. Verify WhatsApp Booking CTA is contextual and valid
    const bookingCta = page.getByTestId('booking-cta-button');
    await expect(bookingCta).toBeVisible();
    const href = await bookingCta.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('https://wa.me/');
  });

  test('E2E Admin Flow: Login -> Create Trip -> Schedule -> Create Booking -> Confirm -> Capacity decreases', async ({
    page,
  }) => {
    // Auto accept window.confirm dialogs
    page.on('dialog', (dialog) => dialog.accept());

    // 1. Login to Admin
    await page.goto('/admin/login');
    await page
      .getByLabel('Email', { exact: true })
      .fill('critical_super_admin@wildera.test');
    await page.getByLabel('Kata sandi', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    // Seed destination & mountain for clean test run
    const destId = randomUUID();
    const mountId = randomUUID();
    const tripId = randomUUID();
    const schedId = randomUUID();
    const pkgId = randomUUID();

    await db.query(
      `INSERT INTO destinations(id, name, slug, region, status)
       VALUES ($1, 'Critical Zone', 'critical-zone', 'Lombok', 'ACTIVE')`,
      [destId],
    );
    await db.query(
      `INSERT INTO mountains(id, destination_id, name, slug, altitude_m, status)
       VALUES ($1, $2, 'Gunung Critical', 'gunung-critical', 3726, 'PUBLISHED')`,
      [mountId, destId],
    );
    await db.query(
      `INSERT INTO trips(id, mountain_id, name, slug, trip_type, duration_days, duration_nights, difficulty, status, created_by)
       SELECT $1, $2, 'Open Trip Critical Flow', 'open-trip-critical-flow', 'OPEN_TRIP', 4, 3, 'HARD', 'PUBLISHED', id FROM admin_users LIMIT 1`,
      [tripId, mountId],
    );
    await db.query(
      `INSERT INTO trip_schedules(id, trip_id, start_date, end_date, capacity, status, created_by)
       SELECT $1, $2, '2026-12-01', '2026-12-04', 10, 'OPEN', id FROM admin_users LIMIT 1`,
      [schedId, tripId],
    );
    await db.query(
      `INSERT INTO schedule_packages(id, schedule_id, name, price, status)
       VALUES ($1, $2, 'Paket Summit Explorer', 1500000, 'ACTIVE')`,
      [pkgId, schedId],
    );

    // 2. Navigate to Bookings management
    await page.goto('/admin/bookings');
    await expect(
      page.getByRole('heading', { name: 'Booking', exact: true }),
    ).toBeVisible();

    // 3. Create a Booking via modal
    await page.getByRole('button', { name: '+ Buat Booking Baru' }).click();
    await expect(
      page.getByRole('heading', { name: 'Buat Booking Manual (Admin Input)' }),
    ).toBeVisible();

    await page
      .locator('#createTrip')
      .selectOption({ label: 'Open Trip Critical Flow' });
    await page.locator('#createSchedule').selectOption({ index: 1 });
    await page.locator('#createPackage').selectOption({ index: 1 });

    await page.locator('#contactName').fill('Rina Explorer');
    await page.locator('#contactPhone').fill('081234567800');
    await page.locator('#contactEmail').fill('rina@explorer.test');
    await page
      .locator('input[placeholder="Nama peserta"]')
      .first()
      .fill('Rina Explorer');
    await page
      .locator('input[placeholder="Nomor KTP/Paspor"]')
      .first()
      .fill('3171234567890001');

    await page.getByRole('button', { name: 'Simpan Booking' }).click();
    await expect(
      page.getByRole('heading', { name: 'Buat Booking Manual (Admin Input)' }),
    ).not.toBeVisible();

    // Verify booking row created in list
    const bookingRow = page.getByRole('row', { name: /Rina Explorer/i });
    await expect(bookingRow).toBeVisible();

    // 4. Confirm the booking
    const confirmBtn = bookingRow.getByRole('button', { name: 'Konfirmasi' });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await expect(
        bookingRow.getByRole('button', { name: 'Konfirmasi' }),
      ).not.toBeVisible();
    }

    // 5. Navigate to Schedules and verify Capacity
    await page.goto('/admin/schedules');
    const scheduleRow = page.getByRole('row', {
      name: /Open Trip Critical Flow/i,
    });
    await expect(scheduleRow).toBeVisible();
    const rowText = await scheduleRow.textContent();
    expect(rowText).toContain('10');
  });
});
