import { test, expect, type Page } from '@playwright/test';
import { Client } from 'pg';
import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';

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

test.describe('Admin Settings', () => {
  test('Super Admin can view, validate, and update site settings', async ({
    page,
  }) => {
    await login(page, 'SUPER_ADMIN');
    await page.goto('/admin/settings');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Pengaturan' }),
    ).toBeVisible();

    // Check inputs exist
    const waInput = page.locator('#business_whatsapp');
    const emailInput = page.locator('#contact_email');
    const igInput = page.locator('#instagram_url');
    const pctInput = page.locator('#almost_full_percentage');

    await expect(waInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(igInput).toBeVisible();
    await expect(pctInput).toBeVisible();

    // Form client validation check: invalid WA
    await waInput.fill('123');
    await page.getByRole('button', { name: 'Simpan Pengaturan' }).click();
    await expect(
      page.getByText(
        'Nomor WhatsApp harus terdiri dari 9 hingga 16 digit angka.',
      ),
    ).toBeVisible();

    // Fill valid values
    await waInput.fill('6281299998888');
    await emailInput.fill('halo@wildera.id');
    await igInput.fill('https://instagram.com/wildera.official');
    await pctInput.fill('25');

    // Save
    await page.getByRole('button', { name: 'Simpan Pengaturan' }).click();
    await expect(
      page.getByText('Pengaturan website berhasil diperbarui.'),
    ).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await expect(waInput).toHaveValue('6281299998888');
    await expect(emailInput).toHaveValue('halo@wildera.id');
    await expect(igInput).toHaveValue('https://instagram.com/wildera.official');
    await expect(pctInput).toHaveValue('25');
  });

  test('Operations admin can view settings in read-only mode', async ({
    page,
  }) => {
    await login(page, 'OPERATIONS');
    await page.goto('/admin/settings');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Pengaturan' }),
    ).toBeVisible();
    await expect(page.getByText('Mode Baca (Read-Only)')).toBeVisible();

    const saveBtn = page.getByRole('button', { name: 'Simpan Pengaturan' });
    await expect(saveBtn).toBeDisabled();
  });
});
