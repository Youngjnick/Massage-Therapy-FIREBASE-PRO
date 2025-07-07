import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';
import fs from 'fs/promises';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
async function getTestUser(index = 0) {
	const usersPath = path.resolve(__dirname, 'test-users.json');
	const usersRaw = await fs.readFile(usersPath, 'utf-8');
	const users = JSON.parse(usersRaw);
	return users[index];
}

// List of badge image filenames to check (from badges.json)
const badgeImages = [
	'first_quiz.png',
	'badge_test.png',
	// Only check badges that are always awarded to the test user
];

test.describe('Local badge images (UI login)', () => {
	test('All key badges appear on Achievements page', async ({ page }) => {
		const user = await getTestUser(0);
		await uiSignIn(page, { email: user.email, password: user.password });
		await page.goto('/achievements');
		// Wait for at least one badge to load
		await expect(page.locator('img[data-testid="badge-awarded"]').first()).toBeVisible({ timeout: 10000 });
		for (const img of badgeImages) {
			await expect(page.locator(`img[src*="${img}"]`)).toBeVisible();
		}
	});
});
