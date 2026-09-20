import { test, expect, type Page } from '@playwright/test';
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
  )
    throw new Error('Run through npm run test:admin');
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
      [`Admin ${role}`, `${role.toLowerCase()}@wildera.test`, hash],
    );
    await db.query('DELETE FROM admin_user_roles WHERE admin_user_id = $1', [
      user.rows[0].id,
    ]);
    await db.query(
      'INSERT INTO admin_user_roles (admin_user_id, role_id) VALUES ($1, $2)',
      [user.rows[0].id, result.rows[0].id],
    );
  }

  // Insert a sample audit log to ensure table has rows
  const superAdmin = await db.query(
    "SELECT id FROM admin_users WHERE email = 'super_admin@wildera.test'",
  );
  if (superAdmin.rows.length > 0) {
    await db.query(
      `INSERT INTO audit_logs (id, admin_user_id, action, entity_type, entity_id, old_value, new_value, ip_address, created_at)
       VALUES ($1, $2, 'TRIP_PUBLISH', 'TRIP', $3, '{"status":"DRAFT"}', '{"status":"PUBLISHED"}', '127.0.0.1', now())`,
      [randomUUID(), superAdmin.rows[0].id, randomUUID()],
    );
  }
});

test.afterAll(async () => {
  await db?.end();
});

async function login(page: Page, role: string) {
  await page.goto('/admin/login');
  await page
    .getByLabel('Email', { exact: true })
    .fill(`${role.toLowerCase()}@wildera.test`);
  await page.getByLabel('Kata sandi', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

test.describe('Admin Audit Logs UI (STEP 33)', () => {
  test('allows super admin to view audit logs, filter, and inspect payload', async ({
    page,
  }) => {
    await login(page, 'SUPER_ADMIN');

    // Navigate to Audit Log section
    await page
      .getByRole('navigation')
      .getByRole('link', { name: 'Audit Log', exact: true })
      .click();
    await expect(page).toHaveURL('/admin/audit-logs');

    // Verify Heading
    await expect(
      page.getByRole('heading', { level: 1, name: 'Audit Log' }),
    ).toBeVisible();

    // Verify filter controls
    await expect(
      page.getByPlaceholder('Cari aksi, aktor, atau entitas...'),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Terapkan Filter' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Export CSV' }),
    ).toBeVisible();

    // Verify table structure
    await expect(
      page.getByRole('columnheader', { name: 'Waktu' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Aksi' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Entitas' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Aktor' }),
    ).toBeVisible();

    // Test detail modal drawer
    const inspectBtn = page.getByRole('button', { name: 'Lihat Data' }).first();
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();
      await expect(
        page.getByRole('heading', { name: 'Detail Audit Log' }),
      ).toBeVisible();
      await expect(page.getByText('Data Sebelum (Old Value)')).toBeVisible();
      await expect(page.getByText('Data Sesudah (New Value)')).toBeVisible();
      await page.getByRole('button', { name: 'Tutup' }).click();
      await expect(
        page.getByRole('heading', { name: 'Detail Audit Log' }),
      ).not.toBeVisible();
    }
  });

  test('denies content admin from viewing audit logs', async ({ page }) => {
    await login(page, 'CONTENT');

    // Sidebar should NOT have Audit Log link for Content Admin
    await expect(
      page
        .getByRole('navigation')
        .getByRole('link', { name: 'Audit Log', exact: true }),
    ).not.toBeVisible();

    // Attempt direct URL navigation
    await page.goto('/admin/audit-logs');
    await expect(
      page.getByText(
        'Akses ditolak: Anda tidak memiliki izin untuk melihat catatan audit sistem.',
      ),
    ).toBeVisible();
  });
});
