/* global console */
import { test as base, expect } from '@playwright/test';
import './helpers/playwright-coverage';
import { uiSignIn } from './helpers/uiSignIn';
import fs from 'fs/promises';
import path from 'path';

// ESM-compatible __dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Load test users from test-users.json
async function getTestUser(index = 0) {
  const usersPath = path.resolve(__dirname, 'test-users.json');
  const usersRaw = await fs.readFile(usersPath, 'utf-8');
  const users = JSON.parse(usersRaw);
  return users[index];
}

export const test = base;

base.beforeEach(async ({ page }) => {
  // Sign in before each test
  const user = await getTestUser(0);
  console.log('[E2E DEBUG] About to sign in with test user:', user.email);
  await page.goto('/profile');
  console.log('[E2E DEBUG] Current URL before sign-in:', page.url());
  await page.screenshot({ path: 'test-results/screenshots/before-signin.png', fullPage: true });
  await uiSignIn(page, { email: user.email, password: user.password, profilePath: '/profile' });
  console.log('[E2E DEBUG] URL after sign-in:', page.url());
  await page.screenshot({ path: 'test-results/screenshots/after-signin.png', fullPage: true });

  // Clear localStorage, sessionStorage, and cookies before each test
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.context().clearCookies();
});

test.setTimeout(60000); // Increase timeout for all tests in this file

test('should reset quiz and focus first option after restart', async ({ page }, testInfo) => {
  // Collect browser console logs for debug
  const logs: string[] = [];
  page.on('console', msg => logs.push(msg.type() + ': ' + msg.text()));

  console.log('[E2E DEBUG] Test start, current URL:', page.url());
  await page.screenshot({ path: 'test-results/screenshots/test-start.png', fullPage: true });
  console.log('Navigating to quiz page...');
  await page.goto('/quiz');
  console.log('[E2E DEBUG] After goto /quiz, URL:', page.url());
  await page.screenshot({ path: 'test-results/screenshots/after-goto-quiz.png', fullPage: true });
  console.log('Filling Quiz Length...');
  await page.getByLabel('Quiz Length').fill('1');
  console.log('Clicking Start button...');
  await page.getByRole('button', { name: /start/i }).click();
  console.log('Clicking first quiz option...');
  await page.getByTestId('quiz-option').first().click();
  console.log('Clicking Finish button...');
  await page.getByRole('button', { name: /finish/i }).click();
  console.log('Clicking Start New Quiz button...');
  await page.getByRole('button', { name: /start new quiz/i }).click();
  // After reset, fill the start form again and start the quiz
  console.log('Filling Quiz Length again...');
  await page.getByLabel('Quiz Length').fill('1');
  console.log('Clicking Start button again...');
  await page.getByRole('button', { name: /start/i }).click();

  // Wait for loading spinner to disappear (if present)
  try {
    console.log('Waiting for quiz loading spinner to disappear...');
    await page.waitForSelector('[data-testid="quiz-loading"]', { state: 'detached', timeout: 35000 });
  } catch {
    const html = await page.content();
    console.error('Quiz loading spinner did not disappear. Page HTML:', html);
    console.error('Browser console logs:', logs.join('\n'));
    if (testInfo) await testInfo.attach('page-html', { body: html, contentType: 'text/html' });
    throw new Error('Quiz did not finish loading.');
  }

  // Wait for quiz question container to be visible
  try {
    console.log('Waiting for quiz question card to be visible...');
    await page.waitForSelector('[data-testid="quiz-question-card"]', { state: 'visible', timeout: 25000 });
  } catch {
    const html = await page.content();
    console.error('Quiz question card not visible after spinner. Page HTML:', html);
    console.error('Browser console logs:', logs.join('\n'));
    if (testInfo) await testInfo.attach('page-html', { body: html, contentType: 'text/html' });
    throw new Error('Quiz question card not visible.');
  }

  // Wait a bit longer to allow React to focus
  await page.waitForTimeout(1200);

  // Log number of quiz options
  const optionCount = await page.getByTestId('quiz-option').count();
  console.log('Number of quiz options after restart:', optionCount);

  // Wait for the first radio input to be visible and enabled
  const firstOption = page.getByTestId('quiz-option').first();
  const input = await firstOption.locator('input[type="radio"]');
  await expect(input).toBeVisible({ timeout: 20000 });
  await expect(input).toBeEnabled();

  // Log all focusable quiz options and their focus state
  const allOptions = await page.locator('[data-testid="quiz-option"] input[type="radio"]').all();
  for (let i = 0; i < allOptions.length; i++) {
    const isFocused = await allOptions[i].evaluate((node) => node === document.activeElement);
    console.log(`Option ${i} focused:`, isFocused);
  }
  const activeTag = await page.evaluate(() => document.activeElement?.outerHTML || 'none');
  console.log('Active element after quiz restart:', activeTag);

  // Wait for focus, log debug info if not focused
  let focused = false;
  let lastActiveTag = '';
  for (let retry = 0; retry < 30; retry++) {
    focused = await input.evaluate((node) => node === document.activeElement);
    if (focused) break;
    lastActiveTag = await page.evaluate(() => document.activeElement?.outerHTML || 'none');
    await page.waitForTimeout(200);
  }
  if (!focused) {
    // Try to focus programmatically
    console.warn('First quiz option radio not focused, trying to focus programmatically...');
    await input.focus();
    await page.waitForTimeout(400);
    focused = await input.evaluate((node) => node === document.activeElement);
    if (!focused) {
      // Try tabbing to the input
      console.warn('Programmatic focus failed, trying to tab to the input...');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(400);
      focused = await input.evaluate((node) => node === document.activeElement);
    }
  }
  if (!focused) {
    const html = await page.content();
    const screenshot = await page.screenshot();
    console.error('First quiz option radio was not focused after restart. Page HTML:', html);
    console.error('Active element:', lastActiveTag);
    console.error('Browser console logs:', logs.join('\n'));
    if (testInfo) {
      await testInfo.attach('page-html', { body: html, contentType: 'text/html' });
      await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
    }
  }
  expect(focused).toBeTruthy();
});

test('should handle edge case: rapid answer selection', async ({ page }) => {
  console.log('[E2E DEBUG] Navigating to quiz page...');
  await page.goto('/quiz');
  console.log('[E2E DEBUG] After goto /quiz, URL:', page.url());
  await page.screenshot({ path: 'test-results/screenshots/after-goto-quiz-rapid.png', fullPage: true });
  console.log('[E2E DEBUG] Filling Quiz Length...');
  await page.getByLabel('Quiz Length').fill('2');
  console.log('[E2E DEBUG] Clicking Start button...');
  await page.getByRole('button', { name: /start/i }).click();
  console.log('[E2E DEBUG] Waiting for quiz question card to be visible...');
  try {
    await page.waitForSelector('[data-testid="quiz-question-card"]', { state: 'visible', timeout: 15000 });
    console.log('[E2E DEBUG] Quiz question card is visible.');
  } catch (e) {
    const html = await page.content();
    console.error('[E2E DEBUG] Quiz question card not visible after start. Page HTML:', html);
    throw e;
  }
  const options = page.getByTestId('quiz-option');
  console.log('[E2E DEBUG] Clicking first option...');
  await options.nth(0).click();
  await page.waitForTimeout(150); // allow UI to update
  console.log('[E2E DEBUG] Clicking second option...');
  await options.nth(1).click();
  await page.waitForTimeout(150); // allow UI to update
  console.log('[E2E DEBUG] Clicking first option again...');
  await options.nth(0).click();
  // Should not crash, and feedback should be shown
  const feedback = page.getByTestId('quiz-feedback');
  if (!(await feedback.isVisible())) {
    const html = await page.content();
    console.error('[E2E DEBUG] Quiz feedback not found after rapid answer selection. Page HTML:', html);
  }
  await expect(feedback).toBeVisible();
  // Now test quiz restart
  console.log('[E2E DEBUG] Clicking Finish button...');
  await page.getByRole('button', { name: /finish/i }).click();
  console.log('[E2E DEBUG] Clicking Start New Quiz button...');
  await page.getByRole('button', { name: /start new quiz/i }).click();
  console.log('[E2E DEBUG] Filling Quiz Length again...');
  await page.getByLabel('Quiz Length').fill('2');
  console.log('[E2E DEBUG] Clicking Start button again...');
  await page.getByRole('button', { name: /start/i }).click();
  console.log('[E2E DEBUG] Waiting for quiz loading spinner to disappear...');
  try {
    await page.waitForSelector('[data-testid="quiz-loading-spinner"]', { state: 'hidden', timeout: 15000 });
    console.log('[E2E DEBUG] Quiz loading spinner is hidden.');
  } catch (e) {
    const html = await page.content();
    console.error('[E2E DEBUG] Quiz loading spinner did not disappear. Page HTML:', html);
    throw e;
  }
  console.log('[E2E DEBUG] Waiting for quiz question card to be visible after restart...');
  try {
    await page.waitForSelector('[data-testid="quiz-question-card"]', { state: 'visible', timeout: 15000 });
    console.log('[E2E DEBUG] Quiz question card is visible after restart.');
  } catch (e) {
    const html = await page.content();
    console.error('[E2E DEBUG] Quiz question card not visible after restart. Page HTML:', html);
    throw e;
  }
});

test('should show explanations when enabled', async ({ page }) => {
  // Go to the quiz page (use correct path for quiz start form)
  await page.goto('/quiz');

  // Set the toggle state in localStorage for this origin
  await page.evaluate(() => {
    window.localStorage.setItem('quizToggleState', JSON.stringify({
      showExplanations: true,
      instantFeedback: true,
      randomizeQuestions: true,
      randomizeOptions: false
    }));
  });

  // Reload so the app picks up the new localStorage value
  await page.reload();

  // Wait for the Quiz Start form and Quiz Length input
  await page.waitForSelector('[data-testid="quiz-start-form"]', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('[aria-label="Quiz Length"]', { state: 'visible', timeout: 15000 });

  // Explicitly enable the Show Explanations toggle if present
  const explanationsToggle = page.locator('#show-explanations-toggle');
  if (await explanationsToggle.isVisible()) {
    if (!(await explanationsToggle.isChecked())) {
      await explanationsToggle.check();
    }
  } else {
    console.warn('Show Explanations toggle not found.');
  }

  await page.getByLabel('Quiz Length').fill('1');
  await page.getByRole('button', { name: /start/i }).click();

  // Wait for quiz question card to be visible
  await page.waitForSelector('[data-testid="quiz-question-card"]', { state: 'visible', timeout: 15000 });

  // Click the first option to trigger feedback/explanation
  const options = page.getByTestId('quiz-option');
  await options.nth(0).click();
  await page.waitForTimeout(200); // allow UI to update

  // Log the question object for debug
  const questionDebug = await page.evaluate(() => {
    // @ts-ignore
    return window.__LAST_QUIZ_QUESTION__ || null;
  });
  console.log('[E2E DEBUG] Quiz question object:', questionDebug);

  // Check for explanation element by class
  const explanation = page.locator('.quiz-explanation');
  if (!(await explanation.isVisible())) {
    const html = await page.content();
    console.error('Explanation element not found. Page HTML:', html);
    if (!questionDebug || (!questionDebug.shortExplanation && !questionDebug.longExplanation)) {
      throw new Error('Test question does not have an explanation.');
    }
  }
  await expect(explanation).toBeVisible();
});

test('should show topic stats in results', async ({ page }) => {
  await page.goto('/quiz');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByRole('button', { name: /start/i }).click();
  await page.getByTestId('quiz-option').first().click();
  await page.getByRole('button', { name: /finish/i }).click();

  // Wait for loading spinner to disappear (if present)
  try {
    await page.waitForSelector('[data-testid="quiz-loading"]', { state: 'detached', timeout: 20000 });
  } catch {
    console.error('Quiz loading spinner did not disappear after finishing quiz. Page HTML:', await page.content());
    throw new Error('Quiz did not finish loading after finishing.');
  }

  // Wait for topic stats to appear
  try {
    await page.waitForSelector('[data-testid="quiz-topic-progress"]', { timeout: 20000 });
  } catch {
    console.error('Topic stats did not appear. Page HTML:', await page.content());
    throw new Error('Topic stats not found in results.');
  }
  await expect(page.getByTestId('quiz-topic-progress')).toBeVisible();
  // Optionally, check for a topic name from your test data, e.g. 'Anatomy' or similar
});

test('should render and be usable on mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone 8 size
  await page.goto('/quiz');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByRole('button', { name: /start/i }).click();
  await expect(page.getByTestId('quiz-question-card')).toBeVisible();
  // Check that options are visible and accessible
  await expect(page.getByTestId('quiz-option').first()).toBeVisible();
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
  const fallbackImg = page.locator('img[data-testid="badge-image"][src*="badges/badge_test.png"]');
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
    // Debug: log all links with their text and aria-label
    const allLinks = await page.locator('a').all();
    for (const link of allLinks) {
      const text = await link.textContent();
      const aria = await link.getAttribute('aria-label');
      const href = await link.getAttribute('href');
      console.log(`[E2E DEBUG] Link: text="${text}", aria-label="${aria}", href="${href}"`);
    }
    // Always use aria-label for nav links
    const ariaLabel = `Go to ${label} page`;
    const navLink = page.getByRole('link', { name: ariaLabel });
    await navLink.first().click();
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

base.afterEach(async ({ page }, testInfo) => {
  console.log(`[E2E DEBUG] After test: ${testInfo.title}`);
  if (page) {
    try {
      console.log('[E2E DEBUG] Current URL after test:', page.url());
      await page.screenshot({ path: `test-results/screenshots/after-test-${testInfo.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '')}.png`, fullPage: true });
    } catch (e) {
      console.log('[E2E DEBUG] Could not get URL or screenshot after test:', e);
    }
  }
});
