/* global process, console, window, document */
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const BASE_URL = process.env.PUBLIC_MOTION_URL || 'http://127.0.0.1:3000';

console.log(`Starting Luxuria motion verification against ${BASE_URL}...`);

const browser = await chromium.launch();

try {
  // 1. Desktop Hover & Press Test (Fine Pointer, No Reduced Motion)
  {
    console.log('\n--- 1. Desktop Hover & Press Geometry Test ---');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      hasTouch: false,
    });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);

    // Hero CTA (Primary)
    const hero = page.locator('section[aria-label="Hero section"]');
    const primaryCta = hero.getByRole('link', {
      name: 'Jelajahi Trip',
      exact: true,
    });
    await primaryCta.scrollIntoViewIfNeeded();

    // Prevent navigation during press test
    await primaryCta.evaluate((el) => {
      el.addEventListener('click', (e) => e.preventDefault());
    });

    const boxBeforeHover = await primaryCta.boundingBox();
    assert(boxBeforeHover, 'Primary CTA must have bounding box');

    const label = primaryCta.locator('span').first();
    const chip = primaryCta.locator('div').first();
    const svg = chip.locator('svg').first();

    // Hover Primary CTA
    await primaryCta.hover();

    // Verify label translated exactly 8px (Luxuria translate-x-2)
    await expect(label).toHaveCSS('translate', '8px');
    console.log('PASS: Primary CTA label translated 8px on hover');

    // Verify icon chip scaled to 0.2 and rotated 90deg
    await expect(chip).toHaveCSS('scale', '0.2');
    await expect(chip).toHaveCSS('rotate', '90deg');
    console.log('PASS: Primary CTA icon chip scaled to 0.2 and rotated 90deg');

    // Verify arrow SVG opacity is 0
    await expect(svg).toHaveCSS('opacity', '0');
    console.log('PASS: Primary CTA icon svg faded to opacity 0');

    // Verify button hit area / outer container geometry has NOT shifted
    const boxAfterHover = await primaryCta.boundingBox();
    assert(boxAfterHover, 'CTA must have bounding box after hover');
    assert.strictEqual(
      Math.round(boxAfterHover.x),
      Math.round(boxBeforeHover.x),
      'CTA x position must not change on hover',
    );
    assert.strictEqual(
      Math.round(boxAfterHover.y),
      Math.round(boxBeforeHover.y),
      'CTA y position must not change on hover',
    );
    assert.strictEqual(
      Math.round(boxAfterHover.width),
      Math.round(boxBeforeHover.width),
      'CTA width must not change on hover',
    );
    assert.strictEqual(
      Math.round(boxAfterHover.height),
      Math.round(boxBeforeHover.height),
      'CTA height must not change on hover',
    );
    console.log(
      'PASS: CTA outer container geometry remained completely stable (no translateY lift or jump)',
    );

    // Verify Active / Press State: NO synthetic bounce (scale stays 1, no shrink)
    await page.mouse.down();
    const boxOnPress = await primaryCta.boundingBox();
    const ctaScaleOnPress = await primaryCta.evaluate(
      (el) => window.getComputedStyle(el).scale,
    );
    assert.strictEqual(
      Math.round(boxOnPress.width),
      Math.round(boxBeforeHover.width),
      'CTA width must not shrink on press',
    );
    assert.strictEqual(
      Math.round(boxOnPress.height),
      Math.round(boxBeforeHover.height),
      'CTA height must not shrink on press',
    );
    assert(
      ctaScaleOnPress === 'none' || ctaScaleOnPress === '1',
      `CTA scale must not shrink on press (got ${ctaScaleOnPress})`,
    );
    await page.mouse.up();
    console.log(
      'PASS: CTA active/press state has no synthetic scale down bounce',
    );

    // Hero Secondary CTA
    const secondaryCta = hero.getByRole('link', {
      name: 'Private Trip',
      exact: true,
    });
    await secondaryCta.hover();
    await expect(secondaryCta.locator('span').first()).toHaveCSS(
      'translate',
      '8px',
    );
    await expect(secondaryCta.locator('div').first()).toHaveCSS('scale', '0.2');
    await expect(secondaryCta.locator('div').first()).toHaveCSS(
      'rotate',
      '90deg',
    );
    console.log(
      'PASS: Secondary CTA also matches Luxuria 8px shift and 0.2 scale',
    );

    // Destinations Section: Card image zoom 1.05, no card jump
    const destCard = page
      .locator('section[aria-label="Explore Destinations"] a.card')
      .first();
    await destCard.scrollIntoViewIfNeeded();
    const destCardBoxBefore = await destCard.boundingBox();
    const destCardImg = destCard.locator('img').first();
    await destCard.hover();
    await expect(destCardImg).toHaveCSS('scale', '1.05');
    const destCardBoxAfter = await destCard.boundingBox();
    assert.strictEqual(
      Math.round(destCardBoxAfter.y),
      Math.round(destCardBoxBefore.y),
      'Destination card container must not translate-y on hover',
    );
    console.log(
      'PASS: Destination card image scales to 1.05, card container stays grounded',
    );

    // Upcoming Trips Section: Card image zoom 1.05, card container grounded
    const tripCard = page
      .locator('section[aria-label="Upcoming Trips"] div.card.group')
      .first();
    await tripCard.scrollIntoViewIfNeeded();
    const tripCardBoxBefore = await tripCard.boundingBox();
    const tripCardImg = tripCard.locator('img').first();
    await tripCard.hover();
    await expect(tripCardImg).toHaveCSS('scale', '1.05');
    const tripCardBoxAfter = await tripCard.boundingBox();
    assert.strictEqual(
      Math.round(tripCardBoxAfter.y),
      Math.round(tripCardBoxBefore.y),
      'Trip card container must not translate-y on hover',
    );
    console.log(
      'PASS: Trip card image scales to 1.05, card container stays grounded',
    );

    // Upcoming Trips Footer CTA button
    const tripsAllCta = page
      .locator('section[aria-label="Upcoming Trips"]')
      .getByRole('link', { name: /Lihat Semua Jadwal Trip/i });
    await tripsAllCta.scrollIntoViewIfNeeded();
    await tripsAllCta.hover();
    await expect(tripsAllCta.locator('span').first()).toHaveCSS(
      'translate',
      '8px',
    );
    await expect(tripsAllCta.locator('div').first()).toHaveCSS('scale', '0.2');
    await expect(tripsAllCta.locator('div').first()).toHaveCSS(
      'rotate',
      '90deg',
    );
    console.log('PASS: Section footer button matches Luxuria button motion');

    await context.close();
  }

  // 2. Accessibility & Keyboard Focus Test
  {
    console.log('\n--- 2. Keyboard Focus & Tab Navigation ---');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Focus the desktop navbar CTA
    const navCta = page
      .locator('nav[data-section="navbar"]')
      .getByRole('link', { name: 'Hubungi WhatsApp' });
    await navCta.focus();
    const outline = await navCta.evaluate(
      (el) => window.getComputedStyle(el).outlineStyle,
    );
    assert(outline !== 'none', 'CTA must show visible outline when focused');
    console.log('PASS: Navbar button has accessible focus indicator');

    await context.close();
  }

  // 3. prefers-reduced-motion Test
  {
    console.log('\n--- 3. prefers-reduced-motion: reduce ---');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);

    const hero = page.locator('section[aria-label="Hero section"]');
    const cta = hero.getByRole('link', { name: 'Jelajahi Trip', exact: true });
    await cta.scrollIntoViewIfNeeded();

    const label = cta.locator('span').first();
    const chip = cta.locator('div').first();

    await cta.hover();

    const labelTranslate = await label.evaluate(
      (el) => window.getComputedStyle(el).translate,
    );
    const chipScale = await chip.evaluate(
      (el) => window.getComputedStyle(el).scale,
    );

    console.log(
      `Reduced motion label translate: ${labelTranslate}, chip scale: ${chipScale}`,
    );
    assert(
      labelTranslate === 'none' ||
        labelTranslate === '0px' ||
        labelTranslate === '0px 0px',
      'Label must not translate when reduced-motion is requested',
    );
    assert(
      chipScale === 'none' || chipScale === '1',
      'Chip must not scale when reduced-motion is requested',
    );
    console.log(
      'PASS: prefers-reduced-motion disables translations and scaling',
    );

    await context.close();
  }

  // 4. Mobile / Touch Emulation Test
  {
    console.log('\n--- 4. Mobile / Touch Emulation ---');
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const hero = page.locator('section[aria-label="Hero section"]');
    const cta = hero.getByRole('link', { name: 'Jelajahi Trip', exact: true });
    await cta.scrollIntoViewIfNeeded();

    const chip = cta.locator('div').first();

    // On touch screens, tap should not leave sticky desktop hover states
    await cta.tap();
    const chipScale = await chip.evaluate(
      (el) => window.getComputedStyle(el).scale,
    );
    assert(
      chipScale === 'none' || chipScale === '1',
      'Touch devices must not trigger or stick desktop hover transformations',
    );
    console.log(
      'PASS: Mobile touch devices do not trigger sticky hover transforms',
    );

    await context.close();
  }

  console.log('\n==========================================');
  console.log('ALL LUXURIA MOTION TESTS PASSED SUCCESSFULLY');
  console.log('==========================================');
} finally {
  await browser.close();
}
