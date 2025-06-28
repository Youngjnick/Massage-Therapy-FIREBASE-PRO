import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';


// List of badge image filenames to check (from badges.json)
const badgeImages = [
	'first_quiz.png',
	'badge_test.png',
	// Only check badges that are always awarded to the test user
];

test.describe('Local badge images (UI login)', () => {
	test('All key badges appear on Achievements page', async ({ page }) => {
		await uiSignIn(page);
		await page.goto('/achievements');
		// Wait for at least one badge to load
		await expect(page.locator('img[data-testid="badge-awarded"]').first()).toBeVisible({ timeout: 10000 });
		for (const img of badgeImages) {
			await expect(page.locator(`img[src*="${img}"]`)).toBeVisible();
		}
	});
});
