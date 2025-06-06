// @ts-nocheck
import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/e2eDebugHelpers';

test.describe('Firestore and Avatar Flow', () => {
  test('firestore and avatar flow', async ({ page }) => {
    await mockAuth(page); // Set mock authentication
    await page.goto('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.evaluate(() => (window as any).waitForE2EReactReady && (window as any).waitForE2EReactReady());
    // Wait for avatar to appear (update selector as needed)
    await expect(page.locator('#mainProfileAvatar')).toBeVisible();
    // Optionally check src attribute for Google or default avatar
    const src = await page.locator('#mainProfileAvatar').getAttribute('src');
    expect(src).toContain('avatar');
  });

  test('quiz loads questions from Firestore after sign-in', async ({ page }) => {
    await mockAuth(page); // Set mock authentication
    await page.goto('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.evaluate(() => (window as any).waitForE2EReactReady && (window as any).waitForE2EReactReady());
    // Wait for questions to load (update selector as needed)
    await page.waitForSelector('.quiz-card');
    // Check that at least one question is present
    const questionText = await page.locator('.question-text').textContent();
    if (questionText) {
      expect(questionText.length).toBeGreaterThan(0);
    } else {
      expect(questionText).not.toBeNull(); // Will fail and show a clear error if missing
    }
  });
});
