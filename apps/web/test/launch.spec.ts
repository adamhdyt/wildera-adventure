import { expect, test, type Page } from '@playwright/test';
import { Client } from 'pg';
import { randomUUID } from 'node:crypto';

const api = 'http://127.0.0.1:3101/api/v1';
const origin = 'https://wildera.id';
const token = randomUUID();
const policies = ['terms', 'privacy', 'cancellation', 'safety', 'about'];
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
  for (const key of policies) {
    await db.query(
      `INSERT INTO content_pages(page_key, slug, title, content, status)
      VALUES ($1, $2, $3, $4, 'PUBLISHED')`,
      [
        key,
        `launch-${key}`,
        `Kebijakan ${key}`,
        `Konten terbit ${key} ${token}`,
      ],
    );
  }
  await db.query(
    `INSERT INTO faqs(question, answer, category, status) VALUES ($1, $2, 'Booking', 'PUBLISHED'), ($3, $3, 'Booking', 'DRAFT')`,
    [`Pertanyaan ${token}?`, `Jawaban ${token}`, `Rahasia ${token}`],
  );
  const admin = await db.query(
    `INSERT INTO admin_users(name,email,password_hash) VALUES ('Launch fixture','launch@wildera.test','disabled-test-fixture') RETURNING id`,
  );
  const dest = await db.query(
    `INSERT INTO destinations(name,slug) VALUES ('Launch destination','launch-destination') RETURNING id`,
  );
  const mountain = await db.query(
    `INSERT INTO mountains(destination_id,name,slug,status,seo_description) VALUES ($1,'Launch mountain','launch-mountain','PUBLISHED','Deskripsi gunung terbit dari database pengujian') RETURNING id`,
    [dest.rows[0].id],
  );
  for (const [slug, type, status] of [
    ['launch-open', 'OPEN_TRIP', 'PUBLISHED'],
    ['launch-private', 'PRIVATE_TRIP', 'PUBLISHED'],
    ['launch-draft', 'OPEN_TRIP', 'DRAFT'],
  ]) {
    const trip = await db.query(
      `INSERT INTO trips(mountain_id,name,slug,trip_type,duration_days,difficulty,status,created_by,seo_description)
      VALUES ($1,$2,$2,$3,2,'EASY',$4,$5,'Deskripsi perjalanan terbit dari database pengujian') RETURNING id`,
      [mountain.rows[0].id, slug, type, status, admin.rows[0].id],
    );
    const schedule = await db.query(
      `INSERT INTO trip_schedules(trip_id,start_date,end_date,capacity,status,created_by)
      VALUES ($1,CURRENT_DATE + 30,CURRENT_DATE + 31,10,'OPEN',$2) RETURNING id`,
      [trip.rows[0].id, admin.rows[0].id],
    );
    await db.query(
      `INSERT INTO schedule_packages(schedule_id,name,price,status) VALUES ($1,'Launch package',500000,'ACTIVE')`,
      [schedule.rows[0].id],
    );
  }
});

test.afterAll(async () => {
  if (!db) return;
  try {
    await db.query(
      `DELETE FROM schedule_packages WHERE schedule_id IN (SELECT id FROM trip_schedules WHERE trip_id IN (SELECT id FROM trips WHERE slug LIKE 'launch-%'))`,
    );
    await db.query(
      `DELETE FROM trip_schedules WHERE trip_id IN (SELECT id FROM trips WHERE slug LIKE 'launch-%')`,
    );
    await db.query(`DELETE FROM trips WHERE slug LIKE 'launch-%'`);
    await db.query(`DELETE FROM mountains WHERE slug = 'launch-mountain'`);
    await db.query(
      `DELETE FROM destinations WHERE slug = 'launch-destination'`,
    );
    await db.query(
      `DELETE FROM admin_users WHERE email = 'launch@wildera.test'`,
    );
    await db.query(`DELETE FROM content_pages WHERE slug LIKE 'launch-%'`);
    await db.query(`DELETE FROM faqs WHERE question IN ($1, $2)`, [
      `Pertanyaan ${token}?`,
      `Rahasia ${token}`,
    ]);
  } finally {
    await db.end();
  }
});

async function noOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    )
    .toBeLessThanOrEqual(1);
}

for (const width of [360, 390]) {
  test(`mobile ${width}: menu, API catalog filtering, reset and no overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await noOverflow(page);
    const nav = page.locator('nav[data-section="navbar"]');
    const menu = nav.getByRole('button', { name: 'Menu navigasi' });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    const box = await menu.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await nav
      .getByRole('link', { name: 'Explore Trip', exact: true })
      .filter({ visible: true })
      .click();
    await expect(page).toHaveURL(/\/trip$/);
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    const grid = page.getByTestId('trip-catalog-grid');
    await expect(
      grid.getByRole('heading', { name: 'launch-open', exact: true }),
    ).toBeVisible();
    await expect(
      grid.getByRole('heading', { name: 'launch-private', exact: true }),
    ).toBeVisible();
    await noOverflow(page);
    await page.getByTestId('mobile-filter-button').click();
    const sheet = page.getByRole('dialog', { name: 'Filter bottom sheet' });
    await expect(sheet).toBeVisible();
    await noOverflow(page);
    await sheet.getByRole('button', { name: 'Open Trip', exact: true }).click();
    await sheet.getByRole('button', { name: 'Terapkan Filter' }).click();
    await expect(sheet).toBeHidden();
    await expect(
      grid.getByRole('heading', { name: 'launch-open', exact: true }),
    ).toBeVisible();
    await expect(
      grid.getByRole('heading', { name: 'launch-private', exact: true }),
    ).toHaveCount(0);
    await page.getByTestId('mobile-filter-button').click();
    await sheet.getByRole('button', { name: 'Reset Semua' }).click();
    await sheet.getByRole('button', { name: 'Terapkan Filter' }).click();
    await expect(
      grid.getByRole('heading', { name: 'launch-private', exact: true }),
    ).toBeVisible();
    await page.goto('/trip/launch-open');
    await expect(
      page.getByRole('heading', { name: 'launch-open', level: 1 }),
    ).toBeVisible();
    await noOverflow(page);
  });
}

for (const key of policies) {
  test(`legal ${key}: published API content renders; drafts never leak`, async ({
    page,
    request,
  }) => {
    const path = key === 'about' ? 'tentang' : key;
    const response = await request.get(`${api}/content-pages/${key}`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { content: `Konten terbit ${key} ${token}` },
    });
    await page.setViewportSize({ width: 360, height: 844 });
    await page.goto(`/${path}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      `Kebijakan ${key}`,
    );
    await expect(page.locator('article')).toContainText(
      `Konten terbit ${key} ${token}`,
    );
    await noOverflow(page);
    await db.query(
      `UPDATE content_pages SET status = 'DRAFT' WHERE page_key = $1`,
      [key],
    );
    try {
      expect((await request.get(`${api}/content-pages/${key}`)).status()).toBe(
        404,
      );
      await page.reload();
      await expect(page.locator('article')).not.toContainText(token);
    } finally {
      await db.query(
        `UPDATE content_pages SET status = 'PUBLISHED' WHERE page_key = $1`,
        [key],
      );
    }
  });
}

test('legal FAQ: published API accordion and search exclude draft content', async ({
  page,
  request,
}) => {
  const response = await request.get(`${api}/faqs`);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain(`Pertanyaan ${token}`);
  await page.setViewportSize({ width: 360, height: 844 });
  await page.goto('/faq');
  const question = page.getByRole('button', { name: `Pertanyaan ${token}?` });
  const answer = page.getByText(`Jawaban ${token}`, { exact: true });
  await expect(answer).toBeVisible();
  await question.click();
  await expect(answer).toBeHidden();
  await question.click();
  await expect(
    page.getByText(`Jawaban ${token}`, { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(`Rahasia ${token}`)).toHaveCount(0);
  await page.getByPlaceholder(/Cari pertanyaan/).fill('tidak-ada-hasil');
  await expect(
    page.getByRole('button', { name: `Pertanyaan ${token}?` }),
  ).toHaveCount(0);
  await noOverflow(page);
});

test('SEO: rendered canonical/OG, robots, sitemap published routes and draft exclusion', async ({
  page,
  request,
}) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);
  expect(await robots.text()).toContain('Disallow: /admin');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain('<urlset');
  for (const path of [
    '',
    '/trip',
    '/gunung',
    '/private-trip',
    '/faq',
    '/tentang',
    '/terms',
    '/privacy',
    '/cancellation',
    '/safety',
    '/trip/launch-open',
    '/gunung/launch-mountain',
  ]) {
    expect(xml).toContain(`<loc>${origin}${path}</loc>`);
    await page.goto(path || '/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${origin}${path}`,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `${origin}${path}`,
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /\S.{20}/,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'index, follow',
    );
  }
  expect(xml).not.toContain('launch-draft');
  expect(xml).not.toContain('/admin');
  expect((await request.get(`${api}/trips/launch-draft`)).status()).toBe(404);
  await page.goto('/trip/launch-draft');
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    'content',
    /noindex/,
  );
  await page.goto('/admin/login');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, nofollow, nocache',
  );
});
