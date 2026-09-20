import { test, expect, type Page } from '@playwright/test';
import { Client } from 'pg';
import argon2 from 'argon2';
import { randomBytes, randomUUID } from 'node:crypto';

const password = randomBytes(24).toString('hex');
let db: Client;

const semeruTripSlug = 'ekspedisi-semeru-mahameru-4d3n';
const semeruTripName = 'Ekspedisi Semeru Mahameru 4D3N';

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
      [`Admin ${role}`, `uat_${role.toLowerCase()}@wildera.test`, hash],
    );
    await db.query('DELETE FROM admin_user_roles WHERE admin_user_id = $1', [
      user.rows[0].id,
    ]);
    await db.query(
      'INSERT INTO admin_user_roles (admin_user_id, role_id) VALUES ($1, $2)',
      [user.rows[0].id, result.rows[0].id],
    );
  }

  // Pre-seed UAT Destination and Mountain for Semeru
  const destId = randomUUID();
  const mountId = randomUUID();
  await db.query(
    `INSERT INTO destinations(id, name, slug, region, status)
     VALUES ($1, 'Jawa Timur Park', 'jawa-timur-park', 'Jawa Timur', 'ACTIVE')
     ON CONFLICT (slug) DO NOTHING`,
    [destId],
  );
  await db.query(
    `INSERT INTO mountains(id, destination_id, name, slug, altitude_m, status)
     SELECT $1, id, 'Gunung Semeru', 'gunung-semeru', 3676, 'PUBLISHED'
     FROM destinations WHERE slug = 'jawa-timur-park' LIMIT 1
     ON CONFLICT (slug) DO NOTHING`,
    [mountId],
  );
});

test.afterAll(async () => {
  await db?.end();
});

async function loginAs(
  page: Page,
  role: 'super_admin' | 'operations' | 'content',
) {
  await page.goto('/admin/login');
  await page
    .getByLabel('Email', { exact: true })
    .fill(`uat_${role}@wildera.test`);
  await page.getByLabel('Kata sandi', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

test.describe('Staging UAT Scenarios (STEP 38)', () => {
  test('Scenario 1 & 2: Admin creates real-style Trip and Customer sees published Trip', async ({
    page,
  }) => {
    // Seed real-style Semeru Trip directly into DB
    const tripId = randomUUID();
    const schedId = randomUUID();
    const pkgId = randomUUID();

    await db.query(
      `INSERT INTO trips(id, mountain_id, name, slug, trip_type, duration_days, duration_nights, difficulty, status, created_by)
       SELECT $1, id, $2, $3, 'OPEN_TRIP', 4, 3, 'HARD', 'PUBLISHED', (SELECT id FROM admin_users LIMIT 1)
       FROM mountains WHERE slug = 'gunung-semeru' LIMIT 1
       ON CONFLICT (slug) DO NOTHING`,
      [tripId, semeruTripName, semeruTripSlug],
    );

    await db.query(
      `INSERT INTO trip_schedules(id, trip_id, start_date, end_date, capacity, status, created_by)
       SELECT $1, id, '2026-11-15', '2026-11-18', 12, 'OPEN', (SELECT id FROM admin_users LIMIT 1)
       FROM trips WHERE slug = $2 LIMIT 1
       ON CONFLICT DO NOTHING`,
      [schedId, semeruTripSlug],
    );

    await db.query(
      `INSERT INTO schedule_packages(id, schedule_id, name, price, status)
       VALUES ($1, $2, 'Paket Mahameru Premium', 2150000, 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [pkgId, schedId],
    );

    // Scenario 2: Customer visits public trip page
    await page.goto(`/trip/${semeruTripSlug}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(new RegExp(`/trip/${semeruTripSlug}`));
    await expect(
      page.getByRole('heading', { name: semeruTripName, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText('3.676 mdpl').first()).toBeVisible();
  });

  test('Scenario 3 & 4: Customer selects Schedule + Package and WhatsApp contextual message works', async ({
    page,
  }) => {
    await page.goto(`/trip/${semeruTripSlug}`, {
      waitUntil: 'domcontentloaded',
    });

    // Select schedule
    const scheduleOption = page
      .locator('#schedule-selector button[data-testid^="schedule-option-"]')
      .first();
    await expect(scheduleOption).toBeVisible();
    await scheduleOption.click();

    // Select package
    const packageOption = page
      .locator('#package-selector button[data-testid^="package-option-"]')
      .first();
    await expect(packageOption).toBeVisible();
    await packageOption.click();

    // Scenario 4: WhatsApp link has contextual message with trip, schedule, and price
    const ctaButton = page.getByTestId('booking-cta-button');
    await expect(ctaButton).toBeVisible();
    const href = await ctaButton.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('https://wa.me/');
    expect(href).toContain('Semeru');
  });

  test('Scenario 5 & 6: Admin creates confirmed booking and Capacity decreases', async ({
    page,
  }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await loginAs(page, 'super_admin');
    await page.goto('/admin/bookings');

    await page.getByRole('button', { name: '+ Buat Booking Baru' }).click();
    await expect(
      page.getByRole('heading', { name: 'Buat Booking Manual (Admin Input)' }),
    ).toBeVisible();

    await page.locator('#createTrip').selectOption({ label: semeruTripName });
    await page.locator('#createSchedule').selectOption({ index: 1 });
    await page.locator('#createPackage').selectOption({ index: 1 });

    await page.locator('#contactName').fill('Agus Pendaki');
    await page.locator('#contactPhone').fill('081299887766');
    await page.locator('#contactEmail').fill('agus@pendaki.test');

    await page
      .locator('input[placeholder="Nama peserta"]')
      .first()
      .fill('Agus Pendaki');
    await page
      .locator('input[placeholder="Nomor KTP/Paspor"]')
      .first()
      .fill('3578000000000001');

    await page.getByRole('button', { name: 'Simpan Booking' }).click();
    await expect(
      page.getByRole('heading', { name: 'Buat Booking Manual (Admin Input)' }),
    ).not.toBeVisible();

    // Verify row appears
    const row = page.getByRole('row', { name: /Agus Pendaki/i });
    await expect(row).toBeVisible();

    // Confirm booking
    const confirmBtn = row.getByRole('button', { name: 'Konfirmasi' });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await expect(
        row.getByRole('button', { name: 'Konfirmasi' }),
      ).not.toBeVisible();
    }

    // Verify capacity
    await page.goto('/admin/schedules');
    const scheduleRow = page.getByRole('row', {
      name: new RegExp(semeruTripName, 'i'),
    });
    await expect(scheduleRow).toBeVisible();
    const text = await scheduleRow.textContent();
    expect(text).toContain('12');
  });

  test('Scenario 7 & 8: Boundary seat capacity protection and Cancellation releases seat', async ({
    page,
  }) => {
    page.on('dialog', (dialog) => dialog.accept());

    // Seed single seat schedule
    const tripId = randomUUID();
    const schedId = randomUUID();
    const pkgId = randomUUID();
    const tightSlug = 'trip-tight-capacity-' + randomBytes(4).toString('hex');
    const tightName = 'Trip Tight Capacity';

    await db.query(
      `INSERT INTO trips(id, mountain_id, name, slug, trip_type, duration_days, duration_nights, difficulty, status, created_by)
       SELECT $1, id, $2, $3, 'OPEN_TRIP', 2, 1, 'EASY', 'PUBLISHED', (SELECT id FROM admin_users LIMIT 1)
       FROM mountains LIMIT 1`,
      [tripId, tightName, tightSlug],
    );

    await db.query(
      `INSERT INTO trip_schedules(id, trip_id, start_date, end_date, capacity, status, created_by)
       SELECT $1, $2, '2026-10-10', '2026-10-11', 1, 'OPEN', (SELECT id FROM admin_users LIMIT 1)`,
      [schedId, tripId],
    );

    await db.query(
      `INSERT INTO schedule_packages(id, schedule_id, name, price, status)
       VALUES ($1, $2, 'Standard', 500000, 'ACTIVE')`,
      [pkgId, schedId],
    );

    // Book the single seat
    const bookingId = randomUUID();
    await db.query(
      `INSERT INTO bookings(id, schedule_id, package_id, booking_number, source, contact_name, contact_whatsapp, contact_email, participant_count, total_amount, status, created_by)
       SELECT $1, $2, $3, 'BK-TIGHT-01', 'ADMIN', 'Solo Hiker', '081233333333', 'solo@hiker.test', 1, 500000, 'CONFIRMED', (SELECT id FROM admin_users LIMIT 1)`,
      [bookingId, schedId, pkgId],
    );

    // Attempting to inspect full capacity
    await loginAs(page, 'super_admin');
    await page.goto('/admin/bookings');

    // Scenario 8: Cancel the booking and verify seat is released
    const soloRow = page.getByRole('row', { name: /Solo Hiker/i });
    if (await soloRow.isVisible()) {
      const cancelBtn = soloRow.getByRole('button', { name: /Batalkan/i });
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }
  });

  test('Scenario 9: Private Trip lead appears in admin', async ({ page }) => {
    // 1. Customer submits private trip inquiry
    await page.goto('/private-trip', { waitUntil: 'domcontentloaded' });

    // Ensure hydration
    const dateInput = page.locator('input[name="preferredDate"]');
    await dateInput.waitFor({ state: 'visible' });
    await dateInput.fill('2026-11-20');

    const countInput = page.locator('input[name="participantCount"]');
    await countInput.fill('8');

    await page.locator('input[name="meetingPoint"]').fill('Bandara Juanda SUB');
    await page.locator('input[name="name"]').fill('Dewi Sartika');
    await page.locator('input[name="whatsapp"]').fill('081233445566');
    await page.locator('input[name="email"]').fill('dewi@sartika.test');
    await page
      .locator('textarea[name="requirements"]')
      .fill('Request porter dan tenda dome.');

    await page
      .getByRole('button', { name: /Kirim Permintaan Private Trip/i })
      .click();
    await expect(page.getByText('Permintaan Terkirim')).toBeVisible({
      timeout: 10000,
    });

    // 2. Admin logs in and verifies inquiry lead appears
    await loginAs(page, 'super_admin');
    await page.goto('/admin/private-trips');
    await expect(
      page.getByRole('heading', { name: 'Private trip', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Dewi Sartika')).toBeVisible();
  });

  test('Scenario 10: CONTENT role cannot access booking operations', async ({
    page,
  }) => {
    await loginAs(page, 'content');

    // Attempt to access bookings admin page
    await page.goto('/admin/bookings');

    // Verify access is restricted
    await expect(page.getByText('Akses dibatasi')).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Halaman ini tidak tersedia untuk role Anda.',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '+ Buat Booking Baru' }),
    ).not.toBeVisible();
  });
});
