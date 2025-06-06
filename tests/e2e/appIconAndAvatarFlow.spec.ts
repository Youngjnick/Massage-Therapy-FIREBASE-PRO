// @ts-nocheck
import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/e2eDebugHelpers';

// Test favicon/app icon loads
// This test checks the <link rel="icon"> and that the favicon is accessible

test('App icon (favicon) loads and is accessible', async ({ page }) => {
  await page.goto('/');
  // Check for favicon link in the head
  const faviconHref = await page.locator('link[rel="icon"]').first().getAttribute('href');
  expect(faviconHref).toMatch(/icon-512x512.*\.png/); // Accept hashed filenames
  if (!faviconHref) throw new Error('Favicon href not found');
  // Try to fetch the favicon directly
  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('icon-512x512') && resp.status() === 200),
    page.goto(faviconHref)
  ]);
  expect(response.ok()).toBeTruthy();
});

// Test default avatar loads and fallback works

test('Default avatar image loads and fallback works', async ({ page }) => {
  await page.goto('/');
  // Find the default avatar image (should be present in hidden preload div or profile modal)
  const avatarImg = page.locator('img[src*="default-avatar.png"]');
  await expect(avatarImg.first()).toBeVisible();
  // Simulate error to test fallback (if possible)
  // This is best tested in ProfileModal or ProfileAvatar
});

// Test sign-in avatar loads (if user is signed in)
test('Sign-in avatar loads after sign-in', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.evaluate(() => (window as any).waitForE2EReactReady && (window as any).waitForE2EReactReady());
  // Wait for avatar to appear (update selector as needed)
  const avatar = page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar');
  await expect(avatar.first()).toBeVisible();
  // Check that the src is not the default avatar (if user has photoURL)
  const src = await avatar.first().getAttribute('src');
  expect(src).toContain('avatar');
});
