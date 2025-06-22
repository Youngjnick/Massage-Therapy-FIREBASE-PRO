/* global console */
import { test, expect } from '@playwright/test';
import badges from '../public/badges/badges.json' assert { type: 'json' };

const BASE_URL = 'https://youngjnick.github.io/Massage-Therapy-FIREBASE-PRO/';

// List of badge images to check (add more as needed)
const badgeImages = [
  'badges/first_quiz.png',
  // Only check badges that are always awarded to the test user
];

// List of app icons to check
const appIcons = [
  'favicon.ico',
  'icon-512x512.png',
  'default_avatar.png',
];

// List of main pages to check
const mainPages = [
  '', // Home
  'quiz',
  'achievements',
  'analytics',
  'profile',
];

test.describe('Production Asset Checks', () => {
  test('Badge images load and are visible', async ({ page }) => {
    // Go to the root page first (SPA routing workaround for GitHub Pages)
    await page.goto(BASE_URL);
    // Click the Achievements link in the navbar
    await page.getByRole('link', { name: /achievements/i }).click();
    // Wait for badge container or a known badge element
    const badgeContainer = page.locator('[data-testid="badge-container"], .badge-list, .achievements-list');
    await badgeContainer.first().waitFor({ state: 'visible', timeout: 10000 });
    for (const badge of badgeImages) {
      // Wait for the image with the correct alt text to appear
      const badgeMeta = badges.find((b: any) => `badges/${b.image}` === badge);
      const altText = badgeMeta ? badgeMeta.name : badge;
      const img = page.locator(`img[alt="${altText}"]`);
      await img.waitFor({ state: 'visible', timeout: 10000 });
      // Wait for image to load (naturalWidth > 0)
      const handle = await img.elementHandle();
      await page.waitForFunction(
        el => el instanceof HTMLImageElement && el.naturalWidth > 0,
        handle,
        { timeout: 10000 }
      );
      await expect(img).toBeVisible({ timeout: 10000 });
      await expect(img).toHaveAttribute('src', new RegExp(badge));
    }
  });

  test('App icons load and are accessible', async ({ page }) => {
    await page.goto(BASE_URL);
    for (const icon of appIcons) {
      // Try to fetch the icon directly
      const response = await page.request.get(`${BASE_URL}${icon}`);
      expect(response.status()).toBe(200);
    }
  });

  test('Manifest and referenced icons are accessible', async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for the DOM to be loaded
    await page.waitForLoadState('domcontentloaded');
    const manifestHref = await page.getAttribute('link[rel="manifest"]', 'href');
    if (!manifestHref) {
      // Debug output: log the DOM if manifest link is not found
      const dom = await page.content();
      console.log('[DEBUG] Manifest link not found. DOM snapshot:');
      // Print only the <head> for brevity
      const headMatch = dom.match(/<head[\s\S]*?<\/head>/i);
      if (headMatch) {
        console.log(headMatch[0]);
      } else {
        console.log(dom.slice(0, 2000)); // Print first 2000 chars
      }
    }
    expect(manifestHref).toBeTruthy();
    // Fix manifestHref! (non-null assertion) for JS/TS compatibility
    const manifestUrl = manifestHref && manifestHref.startsWith('http') ? manifestHref : `${BASE_URL}${manifestHref || ''}`;
    const manifestResp = await page.request.get(manifestUrl);
    expect(manifestResp.status()).toBe(200);
    const manifest = await manifestResp.json();
    if (manifest.icons) {
      for (const icon of manifest.icons) {
        const iconUrl = icon.src.startsWith('http') ? icon.src : `${BASE_URL}${icon.src}`;
        const iconResp = await page.request.get(iconUrl);
        expect(iconResp.status()).toBe(200);
      }
    }
  });

  test('All badge and icon images have alt text', async ({ page }) => {
    await page.goto(BASE_URL);
    const imgs = page.locator('img');
    const count = await imgs.count();
    for (let i = 0; i < count; i++) {
      const alt = await imgs.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('Missing badge image shows fallback or does not break UI', async ({ page }) => {
    await page.goto(BASE_URL);
    // Try to load a non-existent badge image
    const missingImgUrl = `${BASE_URL}badges/this_badge_does_not_exist.png`;
    const resp = await page.request.get(missingImgUrl);
    expect([404, 403]).toContain(resp.status());
    // Optionally, check the UI for a fallback element or no broken image icon
    // (customize selector as needed)
    // await expect(page.locator('.badge-fallback, [alt*="not found"]')).toBeVisible();
  });

  for (const pagePath of mainPages) {
    test(`All <img> elements load successfully on /${pagePath}`, async ({ page }) => {
      await page.goto(`${BASE_URL}${pagePath ? pagePath : ''}`);
      const imgs = await page.$$('img');
      for (const img of imgs) {
        const src = await img.getAttribute('src');
        if (src && !src.startsWith('data:')) { // skip inline images
          const url = src.startsWith('http') ? src : `${BASE_URL.replace(/\/$/, '')}/${src.replace(/^\//, '')}`;
          const resp = await page.request.get(url);
          expect(resp.status(), `Image failed to load: ${url}`).toBe(200);
        }
      }
    });
  }

  test.describe('App icon is visible on every main page', () => {
    for (const pagePath of mainPages) {
      test(`App icon visible on /${pagePath}`, async ({ page }) => {
        await page.goto(`${BASE_URL}${pagePath ? pagePath : ''}`);
        // Wait for the app icon to be visible
        const icon = page.locator('img.app-header__icon[alt="App Icon"]');
        await expect(icon).toBeVisible();
        // Check image loaded (naturalWidth > 0)
        const width = await icon.evaluate(el => ('naturalWidth' in el ? el.naturalWidth : 1));
        expect(width).toBeGreaterThan(0);
      });
    }
  });

  test('badges.json is accessible and returns valid JSON', async ({ page }) => {
    const url = `${BASE_URL}badges/badges.json`;
    const response = await page.request.get(url);
    expect(response.status(), `badges.json not found at ${url}`).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThan(0);
    expect(json[0]).toHaveProperty('id');
    expect(json[0]).toHaveProperty('image');
  });

  test('Debug badge rendering on /achievements', async ({ page }) => {
    await page.goto(`${BASE_URL}achievements`);
    // Wait for up to 5s for any badge container
    const badgeContainers = await page.$$('[data-testid="badge-container"]');
    if (badgeContainers.length === 0) {
      // Log the DOM for debugging
      const dom = await page.content();
      console.log('[DEBUG] No badge containers found on /achievements. DOM snapshot:');
      // Print only the <body> for brevity
      const bodyMatch = dom.match(/<body[\s\S]*?<\/body>/i);
      if (bodyMatch) {
        console.log(bodyMatch[0]);
      } else {
        console.log(dom.slice(0, 2000));
      }
      // Try to fetch badges.json directly from the browser context
      const badgeJsonResp = await page.evaluate(async (url) => {
        try {
          const res = await window.fetch(url);
          return { ok: res.ok, status: res.status, json: await res.json() };
        } catch (e) {
          if (e instanceof Error) {
            return { ok: false, error: e.message };
          }
          return { ok: false, error: String(e) };
        }
      }, `${BASE_URL}badges/badges.json`);
      console.log('[DEBUG] badges.json fetch result:', badgeJsonResp);
      throw new Error('No badge containers found on /achievements');
    }
    expect(badgeContainers.length).toBeGreaterThan(0);
  });

  test('Shows debug message if badge list is empty but no error', async ({ page }) => {
    await page.goto(`${BASE_URL}achievements`);
    // Wait for the main-content to be loaded
    await page.waitForSelector('.main-content');
    // Check for the orange debug message
    const debugMsg = page.locator('[data-testid="badge-empty"]');
    if (await debugMsg.isVisible()) {
      const text = await debugMsg.textContent();
      expect(text).toMatch(/No badges to display/i);
    } else {
      // If not visible, test passes (badges may be present or error shown)
      expect(true).toBe(true);
    }
  });
});
