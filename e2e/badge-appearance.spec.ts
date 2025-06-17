import { test, expect } from '@playwright/test';
import { generateTokenAndSignIn } from './helpers/generateAndSignIn';

// Base URL for asset handling (local dev)
const BASE_URL = 'http://localhost:5173/';
function assetUrl(path: string) {
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) path = path.slice(1);
  return `${BASE_URL}${path}`;
}

// List of badge image filenames to check (from badges.json)
const badgeImages = [
  'first_quiz.png',
  'accuracy_100.png',
  'badge_test.png',
  // Add more if needed
];

test.describe('Local badge images (mock login)', () => {
  test('All key badges appear on Achievements page', async ({ page }) => {
    await generateTokenAndSignIn(page);
    await page.goto('http://localhost:5173/achievements');
    const html = await page.content();
    console.log('ACHIEVEMENTS PAGE HTML START');
    console.log(html);
    console.log('ACHIEVEMENTS PAGE HTML END');
    for (const img of badgeImages) {
      await expect(page.locator(`img[src*="${img}"]`)).toBeVisible();
    }
  });
});
