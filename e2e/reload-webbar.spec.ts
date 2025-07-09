// playwright test: e2e/reload-webbar.spec.ts
// This test checks that the NavBar (webbar) is visible immediately after reload, to catch white page/flicker issues.

import { test, expect } from '@playwright/test';
import './helpers/playwright-coverage';

test.describe('App reload and webbar visibility', () => {
  test('NavBar is visible after reload', async ({ page }) => {
    // Go to the home page
    await page.goto('/');

    // Wait for the NavBar to be visible (role="navigation")
    await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible();

    // Reload the page
    await page.reload();

    // NavBar should still be visible immediately after reload
    await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible();

    // Optionally, take a screenshot for debugging
    await page.screenshot({ path: 'test-results/screenshots/webbar-after-reload.png', fullPage: true });
  });
});

test.describe('App reload and webbar visibility (production)', () => {
  test('NavBar is visible after reload on deployed site', async ({ page }) => {
    // Go to the production home page
    await page.goto('https://youngjnick.github.io/Massage-Therapy-FIREBASE-PRO/');

    // Wait for the NavBar to be visible (role="navigation")
    await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible();

    // Reload the page
    await page.reload();

    // NavBar should still be visible immediately after reload
    await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible();

    // Optionally, take a screenshot for debugging
    await page.screenshot({ path: 'test-results/screenshots/webbar-after-reload-prod.png', fullPage: true });
  });
});
