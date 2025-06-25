import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test1234@gmail.com';
const TEST_PASSWORD = 'test1234';
const EMAIL_SELECTOR = '[data-testid="test-signin-email"]';
const PASSWORD_SELECTOR = '[data-testid="test-signin-password"]';
const SUBMIT_SELECTOR = '[data-testid="test-signin-submit"]';
const SIGNOUT_SELECTOR = 'button[aria-label="Sign out"], button:has-text("Sign Out")';

async function uiSignIn(page: import('@playwright/test').Page) {
	await page.goto('/profile');
	await page.fill(EMAIL_SELECTOR, TEST_EMAIL);
	await page.fill(PASSWORD_SELECTOR, TEST_PASSWORD);
	await page.click(SUBMIT_SELECTOR);
	// Wait for sign-out button to appear as proof of successful login
	await page.waitForSelector(SIGNOUT_SELECTOR, { timeout: 10000 });
}

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
