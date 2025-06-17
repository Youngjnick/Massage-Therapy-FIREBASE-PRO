/* global console */
import { test, expect } from '@playwright/test';

const DEV_BASE_URL = 'http://localhost:5174';

// 1. Badge image direct access
const badgeImage = '/badges/first_quiz.png';

test.describe('Development Asset Troubleshooting', () => {
  test('Badge image is accessible directly', async ({ page }) => {
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
    // Try common test id/class for badge containers
    const badgeContainers = await page.locator('[data-testid="badge-container"], .badge-container').count();
    if (badgeContainers === 0) {
      const dom = await page.content();
      console.log('DOM snapshot:', dom);
    }
    expect(badgeContainers).toBeGreaterThan(0);
    // Check for at least one badge image
    const badgeImgs = await page.locator('img[src*="badges/"]').count();
    expect(badgeImgs).toBeGreaterThan(0);
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
