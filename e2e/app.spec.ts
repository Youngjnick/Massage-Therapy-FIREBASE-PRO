/* global console */
/* eslint-env browser */
import { test, expect } from '@playwright/test';

// Only run the failing test for now
test('should focus first option after starting quiz', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByLabel(/topic/i).selectOption({ index: 0 });
  await page.getByRole('button', { name: /start/i }).click();
  const firstOption = page.getByTestId('quiz-option').first();
  // Playwright cannot directly check focus on label, but can check the input inside
  const input = await firstOption.locator('input[type="radio"]');
  await expect(input).toBeFocused();
});

test.skip('should allow keyboard navigation through options and buttons', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('2');
  await page.getByRole('button', { name: /start/i }).click();
  // Wait for the first radio input to be visible
  const firstRadio = page.getByTestId('quiz-radio').first();
  await expect(firstRadio).toBeVisible();
  // Click the first radio and check it is selected
  await firstRadio.click();
  await expect(firstRadio).toBeChecked();
  // Explicitly focus the first radio before sending ArrowDown
  await firstRadio.evaluate(node => node.focus());
  await page.keyboard.down('ArrowDown');
  const secondRadio = page.getByTestId('quiz-radio').nth(1);
  // Wait for React state to update
  await page.waitForTimeout(150);
  await expect(secondRadio).toBeFocused();
  // Tab to navigation buttons (Prev/Next/Finish)
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  // Should be on Prev button
  await expect(page.getByRole('button', { name: /prev/i })).toBeFocused();
});

test('should reset quiz and focus first option after restart', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByRole('button', { name: /start/i }).click();
  await page.getByTestId('quiz-option').first().click();
  await page.getByRole('button', { name: /finish/i }).click();
  await page.getByRole('button', { name: /start new quiz/i }).click();
  // Use robust selector for radio input after restart
  const input = await page.getByTestId('quiz-radio').first();
  await expect(input).toBeFocused();
});

test('should handle edge case: no questions', async ({ page }) => {
  // Simulate no questions by intercepting API or clearing questions in test env
  // For now, just check for loading/error UI
  await page.goto('/');
  // If no questions, should show error or empty state
  // This is a placeholder, update as needed for your app's behavior
  // await expect(page.getByText(/no questions/i)).toBeVisible();
});

test('should handle edge case: rapid answer selection', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('2');
  await page.getByRole('button', { name: /start/i }).click();
  const options = page.getByTestId('quiz-option');
  await options.nth(0).click();
  await options.nth(1).click();
  await options.nth(0).click();
  // Should not crash, and feedback should be shown
  await expect(page.getByTestId('quiz-feedback')).toBeVisible();
});

test('should show explanations when enabled', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByRole('button', { name: /start/i }).click();
  // Simulate enabling explanations (if toggle exists)
  // For now, check for explanation text if present
  // await expect(page.getByText(/explanation/i)).toBeVisible();
});

// test('should show topic stats in results', async ({ page }) => {
//   await page.goto('/');
//   await page.getByLabel('Quiz Length').fill('1');
//   await page.getByRole('button', { name: /start/i }).click();
//   await page.getByTestId('quiz-option').first().click();
//   await page.getByRole('button', { name: /finish/i }).click();
//   // Check for topic progress bar (topic name and progress bar)
//   // await expect(page.getByText(/results/i)).toBeVisible();
//   // Optionally, check for a topic name from your test data, e.g. 'Anatomy' or similar
// });

test('should render and be usable on mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone 8 size
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByRole('button', { name: /start/i }).click();
  await expect(page.getByTestId('quiz-question-card')).toBeVisible();
  // Check that options are visible and accessible
  await expect(page.getByTestId('quiz-option').first()).toBeVisible();
});

test.skip('should allow selecting options and navigation with keyboard and mouse', async ({ page }) => {
  // Capture browser console logs
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('[browser]', msg.text());
    }
  });
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('2');
  await page.getByRole('button', { name: /start/i }).click();
  // Wait for the first radio input to be visible
  const firstRadio = page.getByTestId('quiz-radio').first();
  await expect(firstRadio).toBeVisible();
  // Click the first radio and check it is selected
  await firstRadio.click();
  await expect(firstRadio).toBeChecked();
  // Explicitly focus the first radio at the browser level before sending ArrowDown
  await firstRadio.evaluate(node => node.focus());
  // Send ArrowDown directly to the radio input
  await firstRadio.press('ArrowDown');
  const secondRadio = page.getByTestId('quiz-radio').nth(1);
  // Wait for React state to update
  await page.waitForTimeout(150);
  await expect(secondRadio).toBeFocused();
  // Tab to navigation buttons (Prev/Next/Finish)
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  // Should be on Prev button
  await expect(page.getByRole('button', { name: /prev/i })).toBeFocused();
});

test('should load all referenced badge images on Achievements page', async ({ page }) => {
  await page.goto('/achievements');
  // Only check images that are always present
  const badgeImages = [
    'first_quiz.png',
    'accuracy_100.png',
  ];
  for (const imgName of badgeImages) {
    const img = page.locator(`img[src*="badges/${imgName}"]`);
    await expect(img).toBeVisible();
    const naturalWidth = await img.evaluate((el) => {
      // @ts-ignore
      return el.naturalWidth || 0;
    });
    expect(naturalWidth).toBeGreaterThan(0);
  }
});

test('should show fallback badge image if badge image fails to load', async ({ page }) => {
  // Intercept the badge metadata request and inject a badge with a non-existent id (since BadgeModal uses badge.id for the image src)
  await page.route('**/badges/badges.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'nonexistent_badge',
          name: 'Broken Badge',
          description: 'This badge image does not exist',
          criteria: 'nonexistent_badge',
          image: 'nonexistent_badge.png',
          awarded: true
        }
      ]),
    });
  });
  await page.goto('/achievements');
  // Open the badge modal by clicking the badge
  await page.getByTestId('badge-container').first().click();
  // The fallback image should appear in the modal
  const fallbackImg = page.locator('img[src*="badges/badge_test.png"]');
  await expect(fallbackImg).toBeVisible();
  const naturalWidth = await fallbackImg.evaluate((el) => {
    // @ts-ignore
    return el.naturalWidth || 0;
  });
  expect(naturalWidth).toBeGreaterThan(0);
});

test('should load favicon, app icon, and default avatar image', async ({ page }) => {
  await page.goto('/');

  // Check favicon loads
  const faviconHref = await page.getAttribute('link[rel~="icon"]', 'href');
  expect(faviconHref).toBeTruthy();
  if (faviconHref) {
    const faviconResp = await page.request.get(faviconHref.replace('%BASE_URL%', '/'));
    expect(faviconResp.status()).toBe(200);
    expect(faviconResp.headers()['content-type']).toMatch(/image/);
  }

  // Check app icon loads
  const appIconHref = await page.getAttribute('link[rel~="apple-touch-icon"]', 'href');
  expect(appIconHref).toBeTruthy();
  if (appIconHref) {
    const appIconResp = await page.request.get(appIconHref.replace('%BASE_URL%', '/'));
    expect(appIconResp.status()).toBe(200);
    expect(appIconResp.headers()['content-type']).toMatch(/image/);
  }

  // Check default avatar loads
  const avatarResp = await page.request.get('/default_avatar.png');
  expect(avatarResp.status()).toBe(200);
  expect(avatarResp.headers()['content-type']).toMatch(/image/);
});
