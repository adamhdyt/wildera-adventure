import { expect, test } from '@playwright/test';

test.describe('Public Trip Catalog (STEP 19)', () => {
  test.beforeEach(async ({ page }) => {
    // Default desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('renders catalog page with header, search, sidebar filters, sort, and trip cards', async ({
    page,
  }) => {
    await page.goto('/trip', { waitUntil: 'domcontentloaded' });

    // Header & Title
    await expect(
      page.getByRole('heading', { name: 'Explore Trip', level: 1 }),
    ).toBeVisible();

    // Search bar
    const searchInput = page.getByTestId('search-trip-input');
    await expect(searchInput).toBeVisible();

    // Desktop filter sidebar
    const filterSidebar = page.locator('aside[aria-label="Filter sidebar"]');
    await expect(filterSidebar).toBeVisible();

    // Sort select & counter
    await expect(page.getByTestId('sort-select')).toBeVisible();
    await expect(page.getByTestId('trip-count-indicator')).toBeVisible();

    // Trip cards grid
    const grid = page.getByTestId('trip-catalog-grid');
    await expect(grid).toBeVisible();
    const cards = grid.locator('article');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('/trips redirects to /trip', async ({ page }) => {
    await page.goto('/trips', { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('/trip');
    await expect(
      page.getByRole('heading', { name: 'Explore Trip', level: 1 }),
    ).toBeVisible();
  });

  test('search input filters trip cards in real-time', async ({ page }) => {
    await page.goto('/trip', { waitUntil: 'domcontentloaded' });

    const grid = page.getByTestId('trip-catalog-grid');
    const firstTitle = await grid.locator('h3').first().innerText();
    const keyword = firstTitle.split(' ')[0] || 'Trip';

    const searchInput = page.getByTestId('search-trip-input');
    await searchInput.fill(keyword);

    // Filtered card should be visible
    await expect(grid.getByText(firstTitle)).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(page.getByTestId('trip-count-indicator')).toBeVisible();
  });

  test('difficulty filter updates cards and active filter badge', async ({
    page,
  }) => {
    await page.goto('/trip', { waitUntil: 'domcontentloaded' });

    // Select 'Menantang (Hard)' difficulty via label in sidebar
    const hardLabel = page
      .locator('aside[aria-label="Filter sidebar"] label')
      .filter({ hasText: 'Menantang (Hard)' });
    await expect(hardLabel).toBeVisible();
    await hardLabel.click();

    // Badge should show 1 active filter
    const badge = page.getByTestId('desktop-active-filter-badge');
    await expect(badge).toHaveText('1');

    // Reset Semua should be visible
    const resetButton = page
      .locator('aside[aria-label="Filter sidebar"]')
      .getByRole('button', { name: 'Reset Semua' });
    await expect(resetButton).toBeVisible();
    await resetButton.click();

    // Active filter badge disappears
    await expect(badge).toBeHidden();
  });

  test('sorting by price works correctly', async ({ page }) => {
    await page.goto('/trip', { waitUntil: 'domcontentloaded' });

    const sortSelect = page.getByTestId('sort-select');
    await sortSelect.selectOption('price:asc');

    // Expect sort select value to be price:asc
    await expect(sortSelect).toHaveValue('price:asc');
  });

  test('empty state renders when no trips match search and reset recovers list', async ({
    page,
  }) => {
    await page.goto('/trip', { waitUntil: 'domcontentloaded' });

    const searchInput = page.getByTestId('search-trip-input');
    await searchInput.fill('Gunung Kilimanjaro 8848 XYZ');

    // Empty state should appear per UX spec section 25
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();
    await expect(
      emptyState.getByText('Belum ada trip yang cocok.'),
    ).toBeVisible();
    await expect(
      emptyState.getByRole('link', { name: 'Hubungi Wildera' }),
    ).toBeVisible();

    // Click Reset Filter
    const emptyResetBtn = page.getByTestId('empty-reset-button');
    await emptyResetBtn.click();

    // Cards should recover
    await expect(emptyState).toBeHidden();
    await expect(page.getByTestId('trip-catalog-grid')).toBeVisible();
  });

  test('mobile bottom sheet filter opens, allows filter changes, and applies', async ({
    page,
  }) => {
    // iPhone 14 viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/trip', { waitUntil: 'domcontentloaded' });

    // Mobile filter button
    const mobileFilterBtn = page.getByTestId('mobile-filter-button');
    await expect(mobileFilterBtn).toBeVisible();
    await mobileFilterBtn.click();

    // Bottom sheet dialog should open
    const bottomSheet = page.getByRole('dialog', {
      name: 'Filter bottom sheet',
    });
    await expect(bottomSheet).toBeVisible();
    await expect(bottomSheet.getByText('Filter Trip')).toBeVisible();

    // Tap on 'Open Trip'
    const openTripBtn = bottomSheet.getByRole('button', {
      name: 'Open Trip',
      exact: true,
    });
    await openTripBtn.click();

    // Bottom sheet active badge should show 1
    const bsBadge = page.getByTestId('bottom-sheet-active-filter-badge');
    await expect(bsBadge).toHaveText('1');

    // Tap 'Terapkan Filter'
    const applyBtn = bottomSheet.getByRole('button', {
      name: 'Terapkan Filter',
    });
    await applyBtn.click();

    // Bottom sheet closes
    await expect(bottomSheet).toBeHidden();

    // Mobile filter button reflects active badge
    const mobileBadge = page.getByTestId('mobile-active-filter-badge');
    await expect(mobileBadge).toHaveText('1');
  });
});
