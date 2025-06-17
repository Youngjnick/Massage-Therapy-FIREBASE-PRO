import { test, expect } from '@playwright/test';

// Use the correct GitHub Pages production URL for the Achievements page
const PROD_URL = 'https://youngjnick.github.io/Massage-Therapy-FIREBASE-PRO/achievements';

// List of badge image filenames to check (from badges.json)
const badgeImages = [
  'first_quiz.png',
  'accuracy_100.png',
  'badge_test.png',
  // Add more if needed, but skip does_not_exist.png (test_fallback)
];

test.describe('Production badge images', () => {
  test('All key badges appear on Achievements page', async ({ page }) => {
    await page.goto(PROD_URL);
    // Output the page HTML for debugging
    const html = await page.content();
    console.log('PAGE HTML START');
    console.log(html);
    console.log('PAGE HTML END');
    for (const img of badgeImages) {
      // Output the selector being checked
      console.log(`Checking for img[src*="/badges/${img}"]`);
      await expect(page.locator(`img[src*="/badges/${img}"]`)).toBeVisible();
    }
  });
});
