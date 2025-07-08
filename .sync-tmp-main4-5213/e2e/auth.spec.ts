/* global console */
// Ensure process is available for progress bar
import process from 'process';
// @ts-nocheck
import { test, expect } from '@playwright/test';
import './helpers/playwright-coverage';

test.describe('Authentication UI Flows', () => {
  test('should show sign-in prompt on Analytics when unauthenticated', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.getByText(/please sign in to view your analytics/i)).toBeVisible();
  });

  test('should show sign-in button and open popup on Profile page', async ({ page, context }, testInfo) => {
    await page.goto('/profile');
    console.log('Navigated to /profile');
    const signInBtn = page.getByRole('button', { name: /sign in with google/i });
    try {
      await expect(signInBtn).toBeVisible({ timeout: 10000 });
      console.log('Sign-in button is visible');
    } catch (e) {
      const html = await page.content();
      console.error('Sign-in button not visible. Page HTML:', html);
      if (testInfo) await testInfo.attach('page-html', { body: html, contentType: 'text/html' });
      throw e;
    }

    // Listen for popup event
    let popupOpened = false;
    context.once('page', () => {
      popupOpened = true;
      console.log('Popup opened event detected');
    });
    await signInBtn.click();
    // Wait for popup or fail after timeout, with progress bar
    process.stdout.write('Waiting for popup: [');
    for (let i = 0; i < 20; i++) {
      if (popupOpened) break;
      process.stdout.write('#');
      await page.waitForTimeout(150);
    }
    process.stdout.write(']\n');
    if (!popupOpened) {
      const html = await page.content();
      console.error('Popup did not open after clicking sign-in. Page HTML:', html);
      if (testInfo) await testInfo.attach('page-html', { body: html, contentType: 'text/html' });
    }
    expect(popupOpened).toBe(true);
  });

  test('should show sign-in button after sign out click (UI only)', async ({ page }) => {
    await page.goto('/profile');
    const signInBtn = page.getByRole('button', { name: /sign in with google/i });
    await expect(signInBtn).toBeVisible();
    // Simulate clicking sign out (if present)
    const signOutBtn = page.getByRole('button', { name: /sign out/i });
    if (await signOutBtn.count()) {
      await signOutBtn.click();
      await expect(signInBtn).toBeVisible();
    }
  });
});
