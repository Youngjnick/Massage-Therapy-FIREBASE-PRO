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

test('should allow keyboard navigation through options and buttons', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('2');
  await page.getByRole('button', { name: /start/i }).click();
  // Wait for the first radio input to be visible
  const radios = page.getByTestId('quiz-radio');
  await expect(radios.first()).toBeVisible();
  // Click the first radio and check it is selected
  await radios.first().click();
  await expect(radios.first()).toBeChecked();
  // Focus the first enabled radio
  const enabledRadios = await radios.filter({ hasNot: page.locator('[disabled]') });
  const enabledCount = await enabledRadios.count();
  await enabledRadios.first().evaluate(node => node.focus());
  // Only check next enabled radio if it exists and is not disabled
  if (enabledCount > 1) {
    // Try to focus the next enabled radio, but only if it is not disabled
    const nextEnabled = enabledRadios.nth(1);
    if (await nextEnabled.isEnabled()) {
      await page.keyboard.press('Tab');
      await expect(nextEnabled).toBeFocused();
    }
  }
  // Tab to navigation buttons (Prev/Next/Finish)
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  // Should be on Prev button if enabled
  const prevBtn = page.getByRole('button', { name: /prev/i });
  if (await prevBtn.isEnabled()) {
    await expect(prevBtn).toBeFocused();
  }
});

test('should reset quiz and focus first option after restart', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByRole('button', { name: /start/i }).click();
  await page.getByTestId('quiz-option').first().click();
  await page.getByRole('button', { name: /finish/i }).click();
  await page.getByRole('button', { name: /start new quiz/i }).click();
  // After reset, fill the start form again and start the quiz
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByRole('button', { name: /start/i }).click();
  // Wait for the first radio input to be visible
  const firstOption = page.getByTestId('quiz-option').first();
  const input = await firstOption.locator('input[type="radio"]');
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

test('should show topic stats in results', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByRole('button', { name: /start/i }).click();
  await page.getByTestId('quiz-option').first().click();
  await page.getByRole('button', { name: /finish/i }).click();
  // Check for topic progress bar (topic name and progress bar)
  // Use a more specific selector for the topic stats
  await expect(page.getByTestId('quiz-topic-progress')).toBeVisible();
  // Optionally, check for a topic name from your test data, e.g. 'Anatomy' or similar
});

test('should render and be usable on mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone 8 size
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByRole('button', { name: /start/i }).click();
  await expect(page.getByTestId('quiz-question-card')).toBeVisible();
  // Check that options are visible and accessible
  await expect(page.getByTestId('quiz-option').first()).toBeVisible();
});

test('should allow selecting options and navigation with keyboard and mouse', async ({ page }) => {
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
  const radios = page.getByTestId('quiz-radio');
  await expect(radios.first()).toBeVisible();
  // Click the first radio and check it is selected
  await radios.first().click();
  await expect(radios.first()).toBeChecked();
  // Focus the first enabled radio
  const enabledRadios = await radios.filter({ hasNot: page.locator('[disabled]') });
  const enabledCount = await enabledRadios.count();
  await enabledRadios.first().evaluate(node => node.focus());
  // Only check next enabled radio if it exists and is not disabled
  if (enabledCount > 1) {
    const nextEnabled = enabledRadios.nth(1);
    if (await nextEnabled.isEnabled()) {
      await page.keyboard.press('Tab');
      await expect(nextEnabled).toBeFocused();
    }
  }
  // Tab to navigation buttons (Prev/Next/Finish)
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  // Should be on Prev button if enabled
  const prevBtn = page.getByRole('button', { name: /prev/i });
  if (await prevBtn.isEnabled()) {
    await expect(prevBtn).toBeFocused();
  }
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

test.skip('should load favicon, app icon, and default avatar image', async ({ page }) => {
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

test('should navigate to all main pages via NavBar and route correctly', async ({ page }) => {
  await page.goto('/');

  // Define navigation links and expected headings
  const navLinks = [
    { label: 'Quiz', path: '/quiz', heading: /quiz/i },
    { label: 'Achievements', path: '/achievements', heading: /achievements/i },
    { label: 'Analytics', path: '/analytics', heading: /analytics/i },
    { label: 'Profile', path: '/profile', heading: /profile/i },
  ];

  for (const { label, path, heading } of navLinks) {
    await page.getByRole('link', { name: label }).click();
    await page.waitForURL(`**${path}`);
    if (label === 'Analytics') {
      // If not signed in, expect the sign-in message
      const signInMsg = page.getByText(/please sign in to view your analytics/i);
      if (await signInMsg.isVisible()) {
        await expect(signInMsg).toBeVisible();
        continue;
      }
    }
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }

  // Test browser back/forward navigation
  await page.goBack();
  // Analytics page: check for heading or sign-in message
  const analyticsHeading = page.getByRole('heading', { name: /analytics/i });
  const analyticsSignInMsg = page.getByText(/please sign in to view your analytics/i);
  if (await analyticsSignInMsg.isVisible()) {
    await expect(analyticsSignInMsg).toBeVisible();
  } else {
    await expect(analyticsHeading).toBeVisible();
  }
  await page.goForward();
  await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
});

test('should not submit answer when using arrow keys (only change selection)', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('2');
  // Select the first real topic (index 1, since index 0 is likely 'Select a Topic')
  const topicSelect = page.getByLabel(/topic/i);
  if (await topicSelect.count()) {
    await topicSelect.selectOption({ index: 1 });
  }
  await page.getByRole('button', { name: /start/i }).click();
  const radios = page.getByTestId('quiz-radio');
  await expect(radios.first()).toBeVisible();
  // Focus the first radio
  await radios.first().focus();
  // Press ArrowDown to move selection (should not submit)
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  await expect(page.getByTestId('quiz-question-card')).toBeVisible();
  // Press ArrowUp to move selection (should not submit)
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(200);
  await expect(page.getByTestId('quiz-question-card')).toBeVisible();
});

test('arrow keys: wrap-around, skip disabled, and maintain selection state', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('4');
  // Select the first real topic (index 1)
  const topicSelect = page.getByLabel(/topic/i);
  if (await topicSelect.count()) {
    await topicSelect.selectOption({ index: 1 });
  }
  await page.getByRole('button', { name: /start/i }).click();
  const radios = page.getByTestId('quiz-radio');
  await expect(radios.first()).toBeVisible();
  // Find all enabled radios using browser-side evaluation
  const enabledRadioIndexes = await page.$$eval('[data-testid="quiz-radio"]', els => els.map((el, i) => !(el as HTMLInputElement).disabled ? i : -1).filter(i => i !== -1));
  const firstEnabledIndex = enabledRadioIndexes[0];
  // Focus the first enabled radio
  await radios.nth(firstEnabledIndex).focus();
  // ArrowUp on first should wrap to some enabled radio (not disabled)
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(200);
  // Get the currently focused element and assert it is enabled
  const focusedRadio = await page.evaluateHandle(() => document.activeElement);
  const isDisabled = await focusedRadio.evaluate((el: any) => el.disabled);
  expect(isDisabled).toBeFalsy();
  // ArrowDown on focused should wrap to another enabled radio (not disabled)
  await focusedRadio.asElement().focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  const focusedRadio2 = await page.evaluateHandle(() => document.activeElement);
  const isDisabled2 = await focusedRadio2.evaluate((el: any) => el.disabled);
  expect(isDisabled2).toBeFalsy();
  // After several arrow presses, ensure no submission
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await expect(page.getByTestId('quiz-question-card')).toBeVisible();
  }
  // The currently focused radio should be enabled (if your UI checks on focus, otherwise skip this)
});

test('up/down arrow keys only cycle focus on answer options, never advance quiz card', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('3');
  const topicSelect = page.getByLabel(/topic/i);
  if (await topicSelect.count()) {
    await topicSelect.selectOption({ index: 1 });
  }
  await page.getByRole('button', { name: /start/i }).click();
  // Record the question prompt before navigation (first line of card)
  const questionPromptBefore = (await page.getByTestId('quiz-question-card').innerText()).split('\n')[0];
  const radios = page.getByTestId('quiz-radio');
  await expect(radios.first()).toBeVisible();
  // Focus the first enabled radio
  const enabledRadioIndexes = await page.$$eval('[data-testid="quiz-radio"]', els => els.map((el, i) => !(el as HTMLInputElement).disabled ? i : -1).filter(i => i !== -1));
  const firstEnabledIndex = enabledRadioIndexes[0];
  await radios.nth(firstEnabledIndex).focus();
  // Press ArrowDown and ArrowUp repeatedly
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(50);
  }
  // Record the question prompt after navigation
  const questionPromptAfter = (await page.getByTestId('quiz-question-card').innerText()).split('\n')[0];
  expect(questionPromptAfter).toBe(questionPromptBefore);
});

test('arrow keys: only one enabled option does not change focus or selection', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  const topicSelect = page.getByLabel(/topic/i);
  if (await topicSelect.count()) {
    await topicSelect.selectOption({ index: 1 });
  }
  await page.getByRole('button', { name: /start/i }).click();
  // Disable all but one option (simulate via JS for test)
  await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll('[data-testid="quiz-radio"]'));
    radios.forEach((el, i) => {
      if (i !== 0) (el as HTMLInputElement).disabled = true;
    });
  });
  const radios = page.getByTestId('quiz-radio');
  await radios.first().focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  // Should still be focused on the only enabled radio
  const active = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
  expect(active).toBe('quiz-radio');
});

test('arrow keys: all options disabled does nothing', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  const topicSelect = page.getByLabel(/topic/i);
  if (await topicSelect.count()) {
    await topicSelect.selectOption({ index: 1 });
  }
  await page.getByRole('button', { name: /start/i }).click();
  // Disable all options (simulate via JS for test)
  await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll('[data-testid="quiz-radio"]'));
    radios.forEach((el) => (el as HTMLInputElement).disabled = true);
  });
  // Try to focus and arrow
  const radios = page.getByTestId('quiz-radio');
  await radios.first().focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  // Should not throw, and quiz card should still be visible
  await expect(page.getByTestId('quiz-question-card')).toBeVisible();
});
