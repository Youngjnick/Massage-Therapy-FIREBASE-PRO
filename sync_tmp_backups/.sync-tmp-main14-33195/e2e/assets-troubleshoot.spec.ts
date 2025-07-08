/* global console */
import { test, expect } from '@playwright/test';
import './helpers/playwright-coverage';

const DEV_BASE_URL = 'http://localhost:5173';

// 1. Badge image direct access
const badgeImage = '/badges/first_quiz.png';

test.describe('Development Asset Troubleshooting', () => {
  test.skip('Badge image is accessible directly', async ({ page }) => {
    const resp = await page.goto(`${DEV_BASE_URL}${badgeImage}`);
    if (!resp) throw new Error('No response received');
    expect(resp.status()).toBe(200);
    // Check image loads in DOM
    await page.setContent(`<img src="${badgeImage}" alt="test">`);
    const img = page.locator('img');
    await expect(img).toBeVisible();
    // Fix for naturalWidth type error
    const width = await img.evaluate(el => (el && 'naturalWidth' in el ? el.naturalWidth : 0));
    expect(width).toBeGreaterThan(0);
  });

  // 2. App icon direct access
  test('App icon is accessible directly', async ({ page }) => {
    const resp = await page.goto(`${DEV_BASE_URL}/icon-512x512.png`);
    expect(resp && resp.status()).toBe(200);
  });

  // 3. Achievements page badge containers and images
  test('Achievements page renders badge containers and images', async ({ page }) => {
    await page.goto(`${DEV_BASE_URL}/achievements`);
    // Wait for either badge containers or the empty state
    const badgeContainerLocator = page.locator('[data-testid="badge-container"]');
    const badgeEmptyLocator = page.locator('[data-testid="badge-empty"]');
    // Wait up to 10s for either to appear
    const found = await Promise.race([
      badgeContainerLocator.first().waitFor({ state: 'visible', timeout: 10000 }).then(() => 'container').catch(() => null),
      badgeEmptyLocator.waitFor({ state: 'visible', timeout: 10000 }).then(() => 'empty').catch(() => null),
    ]);
    if (found === 'container') {
      const badgeContainers = await badgeContainerLocator.count();
      expect(badgeContainers).toBeGreaterThan(0);
      // Check for at least one badge image (awarded or unawarded)
      const badgeImgs = await page.locator('img[data-testid="badge-awarded"], img[data-testid="badge-unawarded"]').count();
      expect(badgeImgs).toBeGreaterThan(0);
    } else if (found === 'empty') {
      // Pass: empty state is valid (element exists in DOM)
      return;
    } else {
      // Neither appeared: log DOM and fail
      const dom = await page.content();
      console.log('DOM snapshot:', dom);
      throw new Error('Neither badge containers nor empty state appeared on Achievements page');
    }
  });

  // 4. badges.json fetch
  test('badges.json is accessible and returns valid JSON', async ({ page }) => {
    const resp = await page.goto(`${DEV_BASE_URL}/badges/badges.json`);
    expect(resp && resp.status()).toBe(200);
    // Before using resp.json(), add a null check
    if (!resp) throw new Error('No response received');
    const json = await resp.json();
    expect(Array.isArray(json) || typeof json === 'object').toBe(true);
  });
});
