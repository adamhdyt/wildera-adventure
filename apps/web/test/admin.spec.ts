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

test('login, navigation, mobile keyboard, logout and revoked cookie', async ({
  page,
  context,
}) => {
  await page.goto('/admin/bookings');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(
    page.getByRole('heading', { name: 'Masuk ke admin' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/login-desktop.png',
    fullPage: true,
    caret: 'initial',
  });
  await page
    .getByLabel('Email', { exact: true })
    .fill('super_admin@wildera.test');
  await page.getByLabel('Kata sandi', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Tampilkan', exact: true }).click();
  await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveAttribute(
    'type',
    'text',
  );
  await page.getByRole('button', { name: 'Sembunyikan' }).click();
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.locator('#login-error')).toContainText(
    'Email atau kata sandi salah',
  );
  await login(page, 'SUPER_ADMIN');
  const cookie = (await context.cookies()).find(
    (cookie) => cookie.name === 'wildera_admin_session',
  )!;
  expect(cookie.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    'wildera_admin_session',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/,
  );
  for (const label of [
    'Trip',
    'Jadwal',
    'Booking',
    'Private trip',
    'Destinasi',
    'Gunung',
    'Jalur pendakian',
    'Konten',
    'Pengaturan',
    'Audit Log',
    'Dashboard',
  ]) {
    await page
      .getByRole('navigation')
      .getByRole('link', { name: label, exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: label, exact: true }),
    ).toBeVisible();
    if (label === 'Destinasi') {
      await expect(
        page.getByRole('button', { name: '+ Tambah Destinasi' }),
      ).toBeVisible();
    } else if (label === 'Gunung') {
      await expect(
        page.getByRole('button', { name: '+ Tambah Gunung' }),
      ).toBeVisible();
    } else if (label === 'Jalur pendakian') {
      await expect(
        page.getByRole('button', { name: '+ Tambah Jalur' }),
      ).toBeVisible();
    } else if (label === 'Trip') {
      await expect(
        page.getByRole('button', { name: '+ Tambah Trip' }),
      ).toBeVisible();
    } else if (label === 'Jadwal') {
      await expect(
        page.getByRole('button', { name: '+ Tambah Jadwal' }),
      ).toBeVisible();
    } else if (label === 'Booking') {
      await expect(
        page.getByRole('button', { name: '+ Buat Booking Baru' }),
      ).toBeVisible();
    } else if (label === 'Private trip') {
      await expect(
        page.getByPlaceholder(
          'Cari nama, WhatsApp, nomor tiket, atau destinasi...',
        ),
      ).toBeVisible();
    } else if (label === 'Konten') {
      await expect(
        page.getByRole('button', { name: '+ Tambah FAQ' }),
      ).toBeVisible();
    } else if (label === 'Pengaturan') {
      await expect(
        page.getByRole('button', { name: 'Simpan Pengaturan' }),
      ).toBeVisible();
    } else if (label === 'Audit Log') {
      await expect(
        page.getByRole('button', { name: 'Export CSV' }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByText('Belum tersedia', { exact: true }),
      ).toBeVisible();
    }
  }
  await page.screenshot({
    path: 'test-results/admin-desktop.png',
    fullPage: true,
  });
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(page.getByRole('navigation')).toBeHidden();
  await page.screenshot({
    path: 'test-results/admin-mobile.png',
    fullPage: true,
  });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await context.addCookies([cookie]);
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test('CONTENT navigation and direct access enforce latest database roles', async ({
  page,
}) => {
  await login(page, 'CONTENT');
  await expect(
    page
      .getByRole('navigation')
      .getByRole('link', { name: 'Booking', exact: true }),
  ).toHaveCount(0);
  await page.goto('/admin/bookings');
  await expect(
    page.getByRole('heading', {
      name: 'Halaman ini tidak tersedia untuk role Anda.',
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Kembali ke dashboard' }).click();
  await page.goto('/admin/private-trips');
  await expect(page.getByText('Akses dibatasi')).toBeVisible();
  await db.query(
    "UPDATE admin_user_roles SET role_id = (SELECT id FROM roles WHERE slug = 'OPERATIONS') WHERE admin_user_id = (SELECT id FROM admin_users WHERE email = 'content@wildera.test')",
  );
  await page.goto('/admin/bookings');
  await expect(
    page.getByRole('heading', { name: 'Booking', exact: true }),
  ).toBeVisible();
  await db.query(
    "UPDATE admin_users SET status = 'DISABLED' WHERE email = 'content@wildera.test'",
  );
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test('OPERATIONS access, unknown routes and cross-origin authentication rejection', async ({
  page,
  request,
}) => {
  await login(page, 'OPERATIONS');
  await page.goto('/admin/bookings');
  await expect(
    page.getByRole('heading', { name: 'Booking', exact: true }),
  ).toBeVisible();
  await page.goto('/admin/unknown');
  await expect(
    page.getByRole('heading', { name: 'Halaman admin tidak ditemukan.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Kembali ke dashboard' }).click();
  for (const action of ['login', 'logout']) {
    const response = await request.post(`/api/admin/auth/${action}`, {
      headers: { Origin: 'https://other.test' },
      data: {},
    });
    expect(response.status()).toBe(403);
  }
});

test('login loading and connection failure states remain usable on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/admin/login');
  await expect(
    page.getByRole('heading', { name: 'Masuk ke admin' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/login-mobile.png',
    fullPage: true,
    caret: 'initial',
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByLabel('Email', { exact: true })
    .fill('operations@wildera.test');
  await page.getByLabel('Kata sandi', { exact: true }).fill(password);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/admin/auth/login', async (route) => {
    await gate;
    await route.abort();
  });
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Memeriksa akun…' }),
  ).toBeDisabled();
  release();
  await expect(page.locator('#login-error')).toContainText('Koneksi terputus');
  await expect(
    page.getByRole('button', { name: 'Masuk', exact: true }),
  ).toBeEnabled();
});

test('session service failure has a working retry and logout failure can recover', async ({
  page,
}) => {
  await login(page, 'SUPER_ADMIN');
  await db.query('ALTER TABLE admin_users RENAME TO unavailable_admin_users');
  try {
    await page.goto('/admin/dashboard');
    await expect(
      page.getByRole('heading', {
        name: 'Koneksi ke layanan admin bermasalah.',
      }),
    ).toBeVisible();
  } finally {
    await db.query('ALTER TABLE unavailable_admin_users RENAME TO admin_users');
  }
  await page.getByRole('button', { name: 'Coba lagi' }).click();
  await expect(
    page.getByRole('heading', { name: 'Dashboard', exact: true }),
  ).toBeVisible();
  await page.route('**/api/admin/auth/logout', (route) => route.abort());
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page.locator('.logout-error')).toContainText(
    'Belum berhasil keluar',
  );
  await page.unroute('**/api/admin/auth/logout');
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test('destination management UI supports create, validation, edit and inactivate', async ({
  page,
}) => {
  await login(page, 'SUPER_ADMIN');
  await page.goto('/admin/destinations');
  await expect(
    page.getByRole('heading', { name: 'Destinasi', exact: true }),
  ).toBeVisible();

  // 1. Open create modal
  await page.getByRole('button', { name: '+ Tambah Destinasi' }).click();
  await expect(
    page.getByRole('heading', { name: 'Tambah Destinasi Baru' }),
  ).toBeVisible();

  // 2. Fill form and submit
  await page.getByLabel('Nama Destinasi *').fill('Bromo Tengger Semeru');
  await page.getByLabel('Provinsi').fill('Jawa Timur');
  await page.getByRole('button', { name: 'Simpan Destinasi' }).click();

  // 3. Destinasi appears in table
  await expect(
    page.getByRole('cell', { name: 'Bromo Tengger Semeru' }),
  ).toBeVisible();
  await expect(page.getByText('bromo-tengger-semeru')).toBeVisible();
  await expect(page.locator('.badge-active')).toBeVisible();

  // 4. Edit destination
  await page.getByRole('button', { name: 'Edit' }).first().click();
  await expect(
    page.getByRole('heading', { name: 'Perbarui Destinasi' }),
  ).toBeVisible();
  await page.getByLabel('Status').selectOption('INACTIVE');
  await page.getByRole('button', { name: 'Simpan Destinasi' }).click();

  // 5. Destinasi shows INACTIVE badge
  await expect(page.locator('.badge-inactive')).toBeVisible();
});

test('mountain management UI supports create, relation to destination, edit and archive', async ({
  page,
}) => {
  await login(page, 'SUPER_ADMIN');

  // 1. Create a destination first so we have a destination to attach to
  await page.goto('/admin/destinations');
  await page.getByRole('button', { name: '+ Tambah Destinasi' }).click();
  await page.getByLabel('Nama Destinasi *').fill('Lombok Island');
  await page.getByRole('button', { name: 'Simpan Destinasi' }).click();
  await expect(page.getByRole('cell', { name: 'Lombok Island' })).toBeVisible();

  // 2. Go to /admin/mountains
  await page.goto('/admin/mountains');
  await expect(
    page.getByRole('heading', { name: 'Gunung', exact: true }),
  ).toBeVisible();

  // 3. Open create modal
  await page.getByRole('button', { name: '+ Tambah Gunung' }).click();
  await expect(
    page.getByRole('heading', { name: 'Tambah Gunung Baru' }),
  ).toBeVisible();

  // 4. Fill form
  await page
    .getByLabel('Destinasi Terkait *')
    .selectOption({ label: 'Lombok Island (Indonesia)' });
  await page.getByLabel('Nama Gunung *').fill('Gunung Rinjani');
  await page.getByLabel('Ketinggian (MDPL)').fill('3726');
  await page.getByLabel('Tingkat Kesulitan').selectOption('HARD');
  await page.getByRole('button', { name: 'Simpan Data Gunung' }).click();

  // 5. Appears in table
  await expect(
    page.getByRole('cell', { name: 'Gunung Rinjani' }),
  ).toBeVisible();
  await expect(page.getByText('3726 MDPL')).toBeVisible();
  await expect(page.locator('.badge-hard')).toBeVisible();
  await expect(page.locator('.badge-draft')).toBeVisible();

  // 6. Edit mountain
  await page.getByRole('button', { name: 'Edit' }).first().click();
  await expect(
    page.getByRole('heading', { name: 'Perbarui Data Gunung' }),
  ).toBeVisible();
  await page.getByLabel('Status Konten').selectOption('PUBLISHED');
  await page.getByRole('button', { name: 'Simpan Data Gunung' }).click();
  await expect(page.locator('.badge-published')).toBeVisible();

  // 7. Archive mountain
  await page.getByRole('button', { name: 'Arsipkan' }).first().click();
  await expect(
    page.getByRole('heading', { name: 'Arsipkan Gunung' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ya, Arsipkan' }).click();
  await expect(page.getByRole('cell', { name: 'Gunung Rinjani' })).toHaveCount(
    0,
  );
});

test('route management UI supports create, one mountain multiple routes, edit and archive', async ({
  page,
}) => {
  await login(page, 'SUPER_ADMIN');

  // 1. Create destination and mountain first
  await page.goto('/admin/destinations');
  await page.getByRole('button', { name: '+ Tambah Destinasi' }).click();
  await page.getByLabel('Nama Destinasi *').fill('Lombok Routes Hub');
  await page.getByRole('button', { name: 'Simpan Destinasi' }).click();
  await expect(
    page.getByRole('cell', { name: 'Lombok Routes Hub' }),
  ).toBeVisible();

  await page.goto('/admin/mountains');
  await page.getByRole('button', { name: '+ Tambah Gunung' }).click();
  await page
    .getByLabel('Destinasi Terkait *')
    .selectOption({ label: 'Lombok Routes Hub (Indonesia)' });
  await page.getByLabel('Nama Gunung *').fill('Rinjani Jalur Hub');
  await page.getByRole('button', { name: 'Simpan Data Gunung' }).click();
  await expect(
    page.getByRole('cell', { name: 'Rinjani Jalur Hub' }),
  ).toBeVisible();

  // 2. Go to /admin/routes
  await page.goto('/admin/routes');
  await expect(
    page.getByRole('heading', {
      name: 'Jalur pendakian',
      exact: true,
    }),
  ).toBeVisible();

  // 3. Create route 1: Jalur Sembalun
  await page.getByRole('button', { name: '+ Tambah Jalur' }).click();
  await expect(
    page.getByRole('heading', { name: 'Tambah Jalur Baru' }),
  ).toBeVisible();
  await page
    .getByLabel('Gunung Terkait *')
    .selectOption({ label: 'Rinjani Jalur Hub' });
  await page.getByLabel('Nama Jalur *').fill('Jalur Sembalun Express');
  await page.getByLabel('Jarak (KM)').fill('8.5');
  await page.getByLabel('Elevasi (M)').fill('1900');
  await page.getByLabel('Durasi (Jam)').fill('7.5');
  await page.getByLabel('Tingkat Kesulitan').selectOption('HARD');
  await page.getByLabel('Titik Awal (Starting Point)').fill('Pos Sembalun');
  await page.getByRole('button', { name: 'Simpan Data Jalur' }).click();

  await expect(
    page.getByRole('cell', { name: 'Jalur Sembalun Express' }),
  ).toBeVisible();
  await expect(page.getByText('8.5 KM')).toBeVisible();

  // 4. Create route 2: Jalur Senaru (One Mountain Multiple Routes!)
  await page.getByRole('button', { name: '+ Tambah Jalur' }).click();
  await page
    .getByLabel('Gunung Terkait *')
    .selectOption({ label: 'Rinjani Jalur Hub' });
  await page.getByLabel('Nama Jalur *').fill('Jalur Senaru Trek');
  await page.getByLabel('Tingkat Kesulitan').selectOption('MODERATE');
  await page.getByRole('button', { name: 'Simpan Data Jalur' }).click();

  await expect(
    page.getByRole('cell', { name: 'Jalur Senaru Trek' }),
  ).toBeVisible();

  // 5. Edit Route 1: change status to PUBLISHED
  await page
    .getByPlaceholder('Cari nama jalur, titik awal, atau gunung...')
    .fill('Sembalun');
  await page.getByRole('button', { name: 'Edit' }).first().click();
  await expect(
    page.getByRole('heading', { name: 'Perbarui Data Jalur' }),
  ).toBeVisible();
  await page.getByLabel('Status Konten').selectOption('PUBLISHED');
  await page.getByRole('button', { name: 'Simpan Data Jalur' }).click();
  await expect(page.locator('.badge-published')).toBeVisible();

  // 6. Archive Route
  await page.getByRole('button', { name: 'Arsipkan' }).first().click();
  await expect(
    page.getByRole('heading', { name: 'Arsipkan Jalur' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ya, Arsipkan' }).click();
  await expect(
    page.getByRole('cell', { name: 'Jalur Sembalun Express' }),
  ).toHaveCount(0);
});

test('trip management UI supports create, link to mountain and route, edit, and archive', async ({
  page,
}) => {
  await login(page, 'SUPER_ADMIN');

  // 1. Ensure mountain and route exist
  await page.goto('/admin/destinations');
  await page.getByRole('button', { name: '+ Tambah Destinasi' }).click();
  await page.getByLabel('Nama Destinasi *').fill('Lombok Trip Zone');
  await page.getByRole('button', { name: 'Simpan Destinasi' }).click();
  await expect(
    page.getByRole('cell', { name: 'Lombok Trip Zone' }),
  ).toBeVisible();

  await page.goto('/admin/mountains');
  await page.getByRole('button', { name: '+ Tambah Gunung' }).click();
  await page
    .getByLabel('Destinasi Terkait *')
    .selectOption({ label: 'Lombok Trip Zone (Indonesia)' });
  await page.getByLabel('Nama Gunung *').fill('Rinjani Trip Summit');
  await page.getByRole('button', { name: 'Simpan Data Gunung' }).click();
  await expect(
    page.getByRole('cell', { name: 'Rinjani Trip Summit' }),
  ).toBeVisible();

  // 2. Navigate to Trips section
  await page.goto('/admin/trips');
  await expect(page.getByRole('heading', { name: 'Trip' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: '+ Tambah Trip' }),
  ).toBeVisible();

  // 3. Create trip
  await page.getByRole('button', { name: '+ Tambah Trip' }).click();
  await expect(
    page.getByRole('heading', { name: 'Tambah Trip Baru' }),
  ).toBeVisible();

  // Select created mountain
  await page
    .getByLabel('Gunung Terkait *')
    .selectOption({ label: 'Rinjani Trip Summit' });

  await page.getByLabel('Nama Trip *').fill('Open Trip Rinjani Summit 3D2N');
  await page.getByLabel('Tipe Trip').selectOption('OPEN_TRIP');
  await page.getByLabel('Durasi Hari *').fill('3');
  await page.getByLabel('Durasi Malam').fill('2');
  await page.getByLabel('Tingkat Kesulitan').selectOption('HARD');
  await page
    .getByLabel('Deskripsi Singkat (Ringkasan)')
    .fill('Paket pendakian bersama menuju puncak Rinjani');
  await page.getByRole('button', { name: 'Simpan Data Trip' }).click();

  await expect(
    page.getByRole('cell', { name: 'Open Trip Rinjani Summit 3D2N' }),
  ).toBeVisible();
  await expect(page.getByText('3D / 2N')).toBeVisible();

  // 4. Edit trip: change status to PUBLISHED
  await page.getByRole('button', { name: 'Edit' }).first().click();
  await expect(
    page.getByRole('heading', { name: 'Perbarui Data Trip' }),
  ).toBeVisible();
  await page.getByLabel('Status Konten').selectOption('PUBLISHED');
  await page.getByRole('button', { name: 'Simpan Data Trip' }).click();
  await expect(page.locator('.badge-published')).toBeVisible();

  // 4b. Manage trip nested content (Itinerary, Facilities, Gears, FAQs)
  await page.getByRole('button', { name: 'Konten' }).first().click();
  await expect(
    page.getByRole('heading', { name: /Kelola Konten:/ }),
  ).toBeVisible();

  // Itinerary: Add Day 1
  await page.getByRole('button', { name: '+ Tambah Hari' }).click();
  await page
    .getByPlaceholder('Judul kegiatan (contoh: Basecamp menuju Pos 3)')
    .fill('Sembalun ke Pelawangan');
  await page
    .getByPlaceholder(
      'Deskripsi rute, jam estimasi, briefing, pos istirahat...',
    )
    .fill('Briefing pagi dan registrasi simaksi');

  // Facilities: Add Include
  await page.getByRole('button', { name: /🎒 Fasilitas/ }).click();
  await page.getByRole('button', { name: '+ Tambah Include' }).click();
  await page
    .getByPlaceholder('Nama fasilitas (contoh: Tiket Simaksi & Asuransi)')
    .fill('Tenda & Matras');

  // Gears: Add Mandatory
  await page.getByRole('button', { name: /🥾 Perlengkapan/ }).click();
  await page.getByRole('button', { name: '+ Wajib Bawa' }).click();
  await page
    .getByPlaceholder('Nama alat (contoh: Sepatu Trekking Mid/High Cut)')
    .fill('Sepatu Trekking Grip');

  // FAQs: Add FAQ
  await page.getByRole('button', { name: /❓ FAQ/ }).click();
  await page.getByRole('button', { name: '+ Tambah FAQ' }).click();
  await page
    .getByPlaceholder('Pertanyaan (contoh: Apakah ada porter tenda?)')
    .fill('Apakah ada porter kelompok?');
  await page
    .getByPlaceholder('Jawaban rinci...')
    .fill('Ya, porter kelompok disediakan untuk tenda dan logistik.');

  // Media: Switch to Media tab and verify cover requirement
  await page.getByRole('button', { name: /🖼️ Media/ }).click();
  await expect(page.getByText('Foto Sampul / Cover Image')).toBeVisible();

  // Save Content & Media
  await page
    .getByRole('button', { name: 'Simpan Semua Konten & Media' })
    .click();
  await expect(
    page.getByText('berhasil diperbarui', { exact: false }),
  ).toBeVisible();

  // 5. Test Unpublish and Publish lifecycle
  // Currently PUBLISHED, button is "Draft"
  await page.getByRole('button', { name: 'Draft' }).first().click();
  await expect(
    page.getByText('dikembalikan ke Draft', { exact: false }),
  ).toBeVisible();

  // Click "Publikasi": incomplete without cover -> validation modal opens
  await page.getByRole('button', { name: 'Publikasi' }).first().click();
  await expect(
    page.getByRole('heading', { name: 'Trip Belum Siap Dipublikasikan' }),
  ).toBeVisible();
  await expect(page.getByText('Cover image wajib diisi.')).toBeVisible();
  await page.getByRole('button', { name: 'Tutup' }).click();

  // 6. Test Duplicate trip
  await page.getByRole('button', { name: 'Duplikasi' }).first().click();
  await expect(
    page.getByText('berhasil diduplikasi', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('cell', { name: 'Open Trip Rinjani Summit 3D2N (Salinan)' }),
  ).toBeVisible();

  // 7. Archive duplicated and original trips
  const archiveButtons = page.getByRole('button', { name: 'Arsipkan' });
  await archiveButtons.first().click();
  await expect(
    page.getByRole('heading', { name: 'Arsipkan Trip' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ya, Arsipkan' }).click();

  await archiveButtons.first().click();
  await expect(
    page.getByRole('heading', { name: 'Arsipkan Trip' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ya, Arsipkan' }).click();

  await expect(
    page.getByRole('cell', { name: 'Open Trip Rinjani Summit 3D2N' }),
  ).toHaveCount(0);
});

test('schedule management UI: create, open, close, cancel, and delete schedule', async ({
  page,
}) => {
  // Ensure a trip exists for schedule creation
  const destId = randomUUID();
  await db.query(
    `INSERT INTO destinations(id, name, slug, region, status)
     VALUES ($1, 'Sched Zone', 'sched-zone', 'Jawa Timur', 'ACTIVE')`,
    [destId],
  );
  const mountId = randomUUID();
  await db.query(
    `INSERT INTO mountains(id, destination_id, name, slug, altitude_m, status)
     VALUES ($1, $2, 'Gunung Sched', 'gunung-sched', 2500, 'PUBLISHED')`,
    [mountId, destId],
  );
  const tripId = randomUUID();
  await db.query(
    `INSERT INTO trips(id, mountain_id, name, slug, trip_type, duration_days, duration_nights, difficulty, status, created_by)
     SELECT $1, $2, 'Open Trip Sched Expedition', 'open-trip-sched-expedition', 'OPEN_TRIP', 3, 2, 'MODERATE', 'PUBLISHED', id FROM admin_users LIMIT 1`,
    [tripId, mountId],
  );

  await login(page, 'SUPER_ADMIN');

  await page.goto('/admin/schedules');
  await expect(
    page.getByRole('heading', { name: 'Jadwal', exact: true }),
  ).toBeVisible();

  // 1. Create new schedule
  await page.getByRole('button', { name: '+ Tambah Jadwal' }).click();
  await expect(
    page.getByRole('heading', { name: 'Tambah Jadwal Baru' }),
  ).toBeVisible();

  await page.locator('#scheduleStartDate').fill('2026-10-10');
  await page.locator('#scheduleEndDate').fill('2026-10-12');
  await page.locator('#scheduleCapacity').fill('16');
  await page.locator('#scheduleMinPax').fill('6');
  await page.locator('#scheduleDeadline').fill('2026-10-08');
  await page.locator('#scheduleNotes').fill('Ekspedisi Jalur Barat');

  await page.getByRole('button', { name: 'Buat Jadwal' }).click();

  // Verify created schedule in table
  await expect(page.getByText('2026-10-10 → 2026-10-12')).toBeVisible();
  await expect(page.getByText('0 / 16')).toBeVisible();
  await expect(page.getByText('Tersedia')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Draft' })).toBeVisible();

  // 1b. Manage Meeting Points
  await page.getByRole('button', { name: '📍 Titik Temu' }).click();
  await expect(
    page.getByRole('heading', { name: '📍 Titik Temu (Meeting Points)' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '+ Tambah Titik Temu' }).click();
  await page.locator('#mp-name').fill('Stasiun Gambir Jakarta');
  await page.locator('#mp-city').fill('Jakarta Pusat');
  await page.getByRole('button', { name: 'Simpan Titik Temu' }).click();
  await expect(page.getByText('Stasiun Gambir Jakarta')).toBeVisible();
  await page.locator('.modal-close').first().click();

  // 1c. Manage Schedule Packages (Pricing Options)
  await page.getByRole('button', { name: '📦 Paket' }).first().click();
  await expect(
    page.getByRole('heading', { name: '📦 Opsi Paket Harga Jadwal' }),
  ).toBeVisible();
  await expect(page.getByText('Aturan Kuota & Paket')).toBeVisible();
  await page.getByRole('button', { name: '+ Tambah Paket' }).click();
  await page.locator('#pkg-name').fill('Start Stasiun Gambir PP');
  await page.locator('#pkg-price').fill('1250000');
  await page
    .locator('#pkg-mp')
    .selectOption({ label: 'Stasiun Gambir Jakarta (Jakarta Pusat)' });
  await page
    .locator('#pkg-desc')
    .fill('Termasuk kereta eksekutif PP dan logistik.');
  await page.getByRole('button', { name: 'Simpan Paket' }).click();
  await expect(page.getByText('Start Stasiun Gambir PP')).toBeVisible();
  await expect(page.getByText('Rp 1.250.000')).toBeVisible();
  await page.locator('.modal-close').first().click();

  // 2. Open schedule
  await page.getByRole('button', { name: 'Buka' }).first().click();
  await expect(page.getByRole('cell', { name: 'Open' })).toBeVisible();

  // 3. Close schedule
  await page.getByRole('button', { name: 'Tutup' }).first().click();
  await expect(page.getByRole('cell', { name: 'Closed' })).toBeVisible();

  // 4. Cancel schedule with reason modal
  await page.getByRole('button', { name: 'Batal' }).first().click();
  await expect(
    page.getByRole('heading', { name: 'Batalkan Jadwal Perjalanan' }),
  ).toBeVisible();
  await page.locator('#cancelReasonInput').fill('Penutupan jalur konservasi');
  await page.getByRole('button', { name: 'Ya, Batalkan Jadwal' }).click();
  await expect(page.getByRole('cell', { name: 'Cancelled' })).toBeVisible();

  // 5. Delete schedule
  await page.getByRole('button', { name: 'Hapus' }).first().click();
  await expect(
    page.getByRole('heading', { name: 'Hapus Jadwal Perjalanan' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Hapus Jadwal' }).click();

  await expect(page.getByText('2026-10-10 → 2026-10-12')).toHaveCount(0);
});

test('booking management UI: create booking, view detail, confirm, and cancel', async ({
  page,
}) => {
  // Ensure a trip, schedule, and package exist
  const destId = randomUUID();
  await db.query(
    `INSERT INTO destinations(id, name, slug, region, status)
     VALUES ($1, 'Booking Zone', 'booking-zone', 'Jawa Tengah', 'ACTIVE')`,
    [destId],
  );
  const mountId = randomUUID();
  await db.query(
    `INSERT INTO mountains(id, destination_id, name, slug, altitude_m, status)
     VALUES ($1, $2, 'Gunung Booking', 'gunung-booking', 3100, 'PUBLISHED')`,
    [mountId, destId],
  );
  const tripId = randomUUID();
  await db.query(
    `INSERT INTO trips(id, mountain_id, name, slug, trip_type, duration_days, duration_nights, difficulty, status, created_by)
     SELECT $1, $2, 'Open Trip Booking Mount', 'open-trip-booking-mount', 'OPEN_TRIP', 2, 1, 'EASY', 'PUBLISHED', id FROM admin_users LIMIT 1`,
    [tripId, mountId],
  );
  const schedId = randomUUID();
  await db.query(
    `INSERT INTO trip_schedules(id, trip_id, start_date, end_date, capacity, status, created_by)
     SELECT $1, $2, '2026-11-01', '2026-11-02', 15, 'OPEN', id FROM admin_users LIMIT 1`,
    [schedId, tripId],
  );
  const pkgId = randomUUID();
  await db.query(
    `INSERT INTO schedule_packages(id, schedule_id, name, price, status)
     VALUES ($1, $2, 'Paket Regular All-in', 950000, 'ACTIVE')`,
    [pkgId, schedId],
  );

  await login(page, 'SUPER_ADMIN');
  await page.goto('/admin/bookings');
  await expect(
    page.getByRole('heading', { name: 'Booking', exact: true }),
  ).toBeVisible();

  // 1. Create a Booking via modal
  await page.getByRole('button', { name: '+ Buat Booking Baru' }).click();
  await expect(
    page.getByRole('heading', { name: 'Buat Booking Manual (Admin Input)' }),
  ).toBeVisible();

  // Select Trip, Schedule, Package
  const tripSelect = page.locator('#createTrip');
  await tripSelect.selectOption({ label: 'Open Trip Booking Mount' });

  const schedSelect = page.locator('#createSchedule');
  await schedSelect.selectOption({ index: 1 });

  const pkgSelect = page.locator('#createPackage');
  await pkgSelect.selectOption({ index: 1 });

  // Fill Customer contact
  await page.locator('#contactName').fill('Budi Santoso');
  await page.locator('#contactPhone').fill('081298765432');
  await page.locator('#contactEmail').fill('budi.santoso@example.com');

  // Fill Participant 1
  await page
    .locator('input[placeholder="Nama peserta"]')
    .first()
    .fill('Budi Santoso');
  await page
    .locator('input[placeholder="Nomor KTP/Paspor"]')
    .first()
    .fill('3171234567890001');

  // Submit
  await page.getByRole('button', { name: 'Simpan Booking' }).click();
  await expect(page.getByText(/Booking baru berhasil dibuat/)).toBeVisible();

  // Verify in table
  await expect(page.getByText('Budi Santoso')).toBeVisible();

  // 2. View Detail Drawer
  await page.getByRole('button', { name: 'Detail' }).first().click();
  await expect(
    page.getByRole('heading', { name: /Detail Booking:/ }),
  ).toBeVisible();

  // 3. Confirm Booking from Drawer or table
  page.on('dialog', (dialog) => dialog.accept());
  const confirmBtn = page.getByRole('button', {
    name: 'Konfirmasi Booking Sekarang',
  });
  if (await confirmBtn.isVisible()) {
    await confirmBtn.click();
    await expect(page.getByText(/berhasil dikonfirmasi/)).toBeVisible();
  }

  // Close drawer
  await page.getByRole('button', { name: 'Tutup' }).click();

  // 4. Cancel booking with reason
  await page.getByRole('button', { name: 'Batal' }).first().click();
  await expect(
    page.getByRole('heading', { name: /Batalkan Booking:/ }),
  ).toBeVisible();
  await page.locator('#cancelReason').fill('Permintaan pembatalan customer');
  await page.getByRole('button', { name: 'Konfirmasi Batalkan' }).click();
  await expect(page.getByText(/berhasil dibatalkan/)).toBeVisible();
});
