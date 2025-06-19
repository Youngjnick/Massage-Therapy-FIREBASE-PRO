import { test, expect } from '@playwright/test';

const DEV_BASE_URL = 'http://localhost:5174';

test('badges.json has correct criteria and image fields', async ({ request }) => {
  const resp = await request.get(DEV_BASE_URL + '/badges/badges.json');
  expect(resp.status()).toBe(200);
  const json = await resp.json();
  expect(Array.isArray(json)).toBe(true);
  for (const badge of json) {
    expect(typeof badge.criteria).toBe('string');
    expect(typeof badge.image).toBe('string');
    expect(badge.image).toBe(badge.criteria + '.png');
  }
});

// test('fallback image is used if badge image is missing', async ({ page }) => {
//   await page.goto(DEV_BASE_URL + '/achievements');
//   // Look for the test badge with missing image (criteria: does_not_exist)
//   const fallbackImg = await page.locator('img[src*="fallback.png"]').first();
//   await expect(fallbackImg).toBeVisible({ timeout: 5000 });
// });

test('badge_test image is visible and loads', async ({ page }) => {
  await page.goto(DEV_BASE_URL + '/achievements');
  const testBadgeImg = await page.locator('img[src*="badge_test.png"]');
  await expect(testBadgeImg).toBeVisible({ timeout: 5000 });
  const width = await testBadgeImg.evaluate(el => (el && 'naturalWidth' in el ? el.naturalWidth : 0));
  expect(width).toBeGreaterThan(0);
});
