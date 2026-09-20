import { expect, test } from '@playwright/test';

test.describe('Mountain Public Pages (STEP 20)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('renders mountain directory with hero, search, difficulty filter, and cards', async ({
    page,
  }) => {
    await page.goto('/gunung', { waitUntil: 'domcontentloaded' });

    // Heading & Breadcrumb/Nav
    await expect(
      page.getByRole('heading', {
        name: 'Direktori Gunung Indonesia',
        exact: true,
      }),
    ).toBeVisible();

    // Search input
    const searchInput = page.getByRole('searchbox', {
      name: 'Cari gunung',
    });
    await expect(searchInput).toBeVisible();

    // Mountain grid
    const grid = page.getByTestId('mountain-directory-grid');
    await expect(grid).toBeVisible();

    // Verify at least one mountain card is rendered
    const cards = page.getByTestId('mountain-card');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('search input filters mountains in directory', async ({ page }) => {
    await page.goto('/gunung', { waitUntil: 'domcontentloaded' });

    const grid = page.getByTestId('mountain-directory-grid');
    const searchInput = page.getByRole('searchbox', {
      name: 'Cari gunung',
    });

    // Grab first mountain title
    const firstTitle = await grid.locator('h3').first().innerText();
    const keyword = firstTitle.replace(/^Gunung\s+/i, '').trim();

    await searchInput.fill(keyword);
    await expect(grid.getByText(firstTitle)).toBeVisible();

    // Non-existent search shows empty state
    await searchInput.fill('Kilimanjaro NonExistent');
    const emptyState = page.getByTestId('mountain-empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState.getByText('Gunung tidak ditemukan')).toBeVisible();

    // Reset button restores grid
    const resetBtn = emptyState.getByRole('button', { name: 'Reset Filter' });
    await resetBtn.click();
    await expect(grid).toBeVisible();
    await expect(grid.getByText(firstTitle)).toBeVisible();
  });

  test('difficulty filter dropdown filters mountains', async ({ page }) => {
    await page.goto('/gunung', { waitUntil: 'domcontentloaded' });

    const difficultySelect = page.getByRole('combobox', {
      name: 'Filter tingkat kesulitan',
    });
    await expect(difficultySelect).toBeVisible();

    await difficultySelect.selectOption('EXTREME');
    const container = page.locator(
      '[data-testid="mountain-directory-grid"], [data-testid="mountain-empty-state"]',
    );
    await expect(container).toBeVisible();

    // Reset back to all
    await difficultySelect.selectOption('');
    const grid = page.getByTestId('mountain-directory-grid');
    await expect(grid).toBeVisible();
  });

  test('renders mountain detail page with overview, altitude, difficulty, routes, and trips', async ({
    page,
  }) => {
    await page.goto('/gunung/rinjani', { waitUntil: 'domcontentloaded' });

    // Hero title
    await expect(
      page.getByRole('heading', { name: 'Gunung Rinjani', exact: true }),
    ).toBeVisible();

    // Altitude in metrics bar
    const altitude = page.getByTestId('mountain-altitude');
    await expect(altitude).toBeVisible();
    await expect(altitude).toContainText('3.726');

    // Difficulty in metrics bar
    const difficulty = page.getByTestId('mountain-difficulty');
    await expect(difficulty).toBeVisible();

    // 1. Overview Section
    const overviewSection = page.getByTestId('mountain-overview-section');
    await expect(overviewSection).toBeVisible();
    await expect(
      overviewSection.getByText(/Gunung Rinjani adalah/i),
    ).toBeVisible();

    // 2. Difficulty Section
    const difficultySection = page.getByTestId('mountain-difficulty-section');
    await expect(difficultySection).toBeVisible();
    await expect(
      difficultySection.getByRole('heading', {
        name: /Tingkat Kesulitan/i,
      }),
    ).toBeVisible();

    // 3. Routes Section
    const routesSection = page.getByTestId('mountain-routes-section');
    await expect(routesSection).toBeVisible();
    const routeCards = page.getByTestId('mountain-route-card');
    await expect(routeCards.first()).toBeVisible();
    await expect(routesSection.getByText('Jalur Sembalun')).toBeVisible();

    // 4. Upcoming Trips Section
    const upcomingTripsSection = page.getByTestId(
      'mountain-upcoming-trips-section',
    );
    await expect(upcomingTripsSection).toBeVisible();
  });

  test('navigation from directory card to mountain detail page works', async ({
    page,
  }) => {
    await page.goto('/gunung', { waitUntil: 'domcontentloaded' });

    const firstCard = page.getByTestId('mountain-card').first();
    const mountainSlug = await firstCard.getAttribute('data-mountain-slug');
    expect(mountainSlug).toBeTruthy();

    const detailLink = firstCard.getByRole('link', { name: 'Lihat Detail' });
    await detailLink.click();

    await expect(page).toHaveURL(new RegExp(`/gunung/${mountainSlug}`));
  });
});
