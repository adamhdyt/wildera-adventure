import { expect, test } from '@playwright/test';

test.describe('SEO & Metadata Verification (STEP 34)', () => {
  test('robots.txt disallows admin and links to sitemap.xml', async ({
    request,
  }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);

    const body = await res.text();
    expect(body.toLowerCase()).toContain('user-agent: *');
    expect(body).toContain('Allow: /');
    expect(body).toContain('Disallow: /admin');
    expect(body).toContain('sitemap.xml');
  });

  test('sitemap.xml generates valid XML with public routes and excludes admin', async ({
    request,
  }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);

    const body = await res.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('<loc>https://wildera.id</loc>');
    expect(body).toContain('<loc>https://wildera.id/trip</loc>');
    expect(body).toContain('<loc>https://wildera.id/gunung</loc>');
    expect(body).toContain('<loc>https://wildera.id/private-trip</loc>');
    expect(body).toContain('<loc>https://wildera.id/faq</loc>');
    expect(body).toContain('<loc>https://wildera.id/tentang</loc>');
    expect(body).toContain('<loc>https://wildera.id/terms</loc>');
    expect(body).toContain('<loc>https://wildera.id/privacy</loc>');
    expect(body).toContain('<loc>https://wildera.id/cancellation</loc>');
    expect(body).toContain('<loc>https://wildera.id/safety</loc>');

    // Admin routes must NOT be in sitemap
    expect(body).not.toContain('/admin');
  });

  test('homepage has canonical, title, meta description, and opengraph tags', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Title
    const title = await page.title();
    expect(title).toContain('Wildera Adventure');

    // Meta Description
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(20);

    // Canonical
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute('href');
    expect(canonical).toBe('https://wildera.id');

    // OpenGraph
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute('content');
    expect(ogTitle).toContain('Wildera Adventure');

    const ogDescription = await page
      .locator('meta[property="og:description"]')
      .getAttribute('content');
    expect(ogDescription).toBeTruthy();

    const ogUrl = await page
      .locator('meta[property="og:url"]')
      .getAttribute('content');
    expect(ogUrl).toBe('https://wildera.id');

    // Robots meta tag
    const robots = await page
      .locator('meta[name="robots"]')
      .getAttribute('content');
    expect(robots).toContain('index');
    expect(robots).toContain('follow');

    // Image alt verification: all images must have non-empty alt
    const images = page.locator('img');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt!.trim().length).toBeGreaterThan(0);
    }
  });

  test('trip detail page has unique metadata, canonical, breadcrumb, json-ld schema, and alt tags', async ({
    page,
  }) => {
    await page.goto('/trip/open-trip-rinjani-summit-4d3n', {
      waitUntil: 'domcontentloaded',
    });

    // Title
    const title = await page.title();
    expect(title).toContain('Rinjani');

    // Meta Description
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(description).toBeTruthy();

    // Canonical
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute('href');
    expect(canonical).toBe(
      'https://wildera.id/trip/open-trip-rinjani-summit-4d3n',
    );

    // OpenGraph
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute('content');
    expect(ogTitle).toContain('Rinjani');

    const ogUrl = await page
      .locator('meta[property="og:url"]')
      .getAttribute('content');
    expect(ogUrl).toBe('https://wildera.id/trip/open-trip-rinjani-summit-4d3n');

    // Visual Breadcrumb navigation
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('Beranda')).toBeVisible();
    await expect(breadcrumb.getByText('Explore Trip')).toBeVisible();

    // JSON-LD Structured Data
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const jsonLdCount = await jsonLdScripts.count();
    expect(jsonLdCount).toBeGreaterThanOrEqual(2);

    let foundBreadcrumbSchema = false;
    let foundProductSchema = false;

    for (let i = 0; i < jsonLdCount; i++) {
      const text = await jsonLdScripts.nth(i).innerText();
      const parsed = JSON.parse(text);
      if (parsed['@type'] === 'BreadcrumbList') {
        foundBreadcrumbSchema = true;
        expect(parsed.itemListElement.length).toBe(3);
      }
      if (parsed['@type'] === 'Product') {
        foundProductSchema = true;
        expect(parsed.name).toBeTruthy();
        expect(parsed.offers).toBeDefined();
      }
    }

    expect(foundBreadcrumbSchema).toBe(true);
    expect(foundProductSchema).toBe(true);

    // Image alt verification: all images must have alt
    const images = page.locator('img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt!.trim().length).toBeGreaterThan(0);
    }
  });

  test('mountain detail page has unique metadata, canonical, breadcrumb, and json-ld schema', async ({
    page,
  }) => {
    await page.goto('/gunung/rinjani', { waitUntil: 'domcontentloaded' });

    // Title
    const title = await page.title();
    expect(title).toContain('Rinjani');

    // Canonical
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute('href');
    expect(canonical).toBe('https://wildera.id/gunung/rinjani');

    // OpenGraph
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute('content');
    expect(ogTitle).toContain('Rinjani');

    // Visual Breadcrumb navigation
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('Beranda')).toBeVisible();
    await expect(breadcrumb.getByText('Direktori Gunung')).toBeVisible();

    // JSON-LD Structured Data
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const jsonLdCount = await jsonLdScripts.count();
    expect(jsonLdCount).toBeGreaterThanOrEqual(2);

    let foundBreadcrumbSchema = false;
    let foundMountainSchema = false;

    for (let i = 0; i < jsonLdCount; i++) {
      const text = await jsonLdScripts.nth(i).innerText();
      const parsed = JSON.parse(text);
      if (parsed['@type'] === 'BreadcrumbList') {
        foundBreadcrumbSchema = true;
      }
      if (parsed['@type'] === 'TouristAttraction') {
        foundMountainSchema = true;
        expect(parsed.name).toContain('Rinjani');
      }
    }

    expect(foundBreadcrumbSchema).toBe(true);
    expect(foundMountainSchema).toBe(true);
  });

  test('admin page has noindex and nofollow robots metadata', async ({
    page,
  }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });

    const robots = await page
      .locator('meta[name="robots"]')
      .getAttribute('content');
    expect(robots).toContain('noindex');
    expect(robots).toContain('nofollow');
  });
});
