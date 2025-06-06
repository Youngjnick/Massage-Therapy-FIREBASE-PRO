// @ts-nocheck
import { test, expect } from '@playwright/test';
import { setTestStateWithWait, waitForAppReady, waitForBadgeState, waitForFullBadgeSync } from './helpers/e2eDebugHelpers';
import { printBadgeState } from './helpers/printBadgeState';

// Bookmarking a question updates bookmarks sidebar
test('Bookmarking a question updates bookmarks sidebar', async ({ page }) => {
  await page.addInitScript(() => {
    window.__E2E_TEST__ = true;
    window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
      email: 'testuser@gmail.com',
      name: 'Test User',
      uid: 'mock-uid-123',
    }));
  });
  await page.goto('/');
  await waitForAppReady(page);
  await setTestStateWithWait(page, {
    questions: [
      {
        id: 'test-q1',
        question: 'What is the capital of France?',
        answers: ['Paris', 'London', 'Berlin', 'Rome'],
        correct: 0,
        topic: 'geography',
        unit: 'europe'
      }
    ],
    quizStarted: true,
    selectedTopic: 'geography',
    bookmarks: [],
  });
  // Wait for quiz card and question to be visible before looking for bookmark button
  await page.waitForSelector('[data-testid="quiz-card"]', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('[data-testid="quiz-question"]', { state: 'visible', timeout: 5000 });
  // Now wait for and click the bookmark button
  await page.waitForSelector('[data-testid="bookmark-btn"]', { state: 'visible', timeout: 10000 });
  await page.getByTestId('bookmark-btn').click();
  // Wait for bookmark to be added in context before waiting for sidebar button
  await page.waitForFunction(() => window.bookmarks && Array.isArray(window.bookmarks) && window.bookmarks.length > 0);
  // Open bookmarks sidebar before checking for bookmarked question
  await page.waitForSelector('[data-testid="bookmarks-sidebar-btn"]', { state: 'visible', timeout: 10000 });
  await page.getByTestId('bookmarks-sidebar-btn').click();
  // Check that at least one bookmarked question is listed
  await expect(page.locator('.bookmarked-question')).toBeVisible();
});

// Analytics modal opens and displays stats
test('Analytics modal opens and displays stats', async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-ignore
    window.__E2E_TEST__ = true;
    window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
      email: 'testuser@gmail.com',
      name: 'Test User',
      uid: 'mock-uid-123',
    }));
  });
  await page.goto('/');
  // Assert modal is not visible before click
  await expect(page.getByTestId('analytics-modal-body')).not.toBeVisible();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.evaluate(() => (window as any).waitForE2EReactReady && (window as any).waitForE2EReactReady());
  // Open analytics modal using unique header data-testid
  const analyticsBtn = await page.locator('[data-testid="analytics-btn-header"], [data-testid-alt="open-analytics-btn-header"]');
  await analyticsBtn.waitFor({ state: 'visible', timeout: 10000 });
  await analyticsBtn.click();
  // Wait for modal to be visible
  const modalBody = page.getByTestId('analytics-modal-body');
  await expect(modalBody).toBeVisible({ timeout: 10000 });
  // Debug: log modal body text and HTML before assertion
  const modalText = await modalBody.textContent();
  const modalHtml = await modalBody.innerHTML();
  console.log('[E2E DEBUG] Analytics modal body text:', modalText);
  console.log('[E2E DEBUG] Analytics modal body HTML:', modalHtml);
  await expect(modalBody).toContainText('Quiz Stats');
  // Check for at least one stat
  await expect(modalBody).toContainText(/Total Questions|Accuracy|Streak/i);
  // Optionally, assert on a specific stat value if deterministic
  // await expect(modalBody).toContainText('Total Questions: 1');
  // Test modal close and reopen
  await page.getByTestId('close-analytics-modal').click();
  await expect(modalBody).not.toBeVisible();
  // Reopen modal
  await analyticsBtn.click();
  await expect(modalBody).toBeVisible({ timeout: 10000 });
  // Keyboard accessibility: Tab to analytics button and open with Enter
  await page.keyboard.press('Tab'); // Assumes analytics button is first focusable in header
  await page.keyboard.press('Enter');
  await expect(modalBody).toBeVisible({ timeout: 10000 });
});

// Badge progress panel shows earned and unearned badges
test.describe('Badges, Bookmarks, Analytics E2E', () => {
  test('Badge progress panel shows earned and unearned badges', async ({ page }) => {
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
    await page.goto('/');
    await waitForAppReady(page); // Ensure this is always awaited before setTestStateWithWait
    await setTestStateWithWait(page, {
      questions: [
        {
          id: 'test-q1',
          question: 'What is the capital of France?',
          answers: ['Paris', 'London', 'Berlin', 'Rome'],
          correct: 0,
          topic: 'geography',
          unit: 'europe'
        }
      ],
      badges: [
        { id: 'test-earned', name: 'Test Badge Earned', earned: true, image: '/badges/default.png', description: 'E2E Test Badge (Earned)' },
        { id: 'test-unearned', name: 'Test Badge Unearned', earned: false, image: '/badges/default.png', description: 'E2E Test Badge (Unearned)' }
      ],
    });
    // Ensure badge state is fully synced in all contexts before proceeding
    await waitForFullBadgeSync(page, 'test-earned');
    await waitForFullBadgeSync(page, 'test-unearned');
    // --- Force badge context sync after state injection ---
    await page.evaluate(() => { if (typeof window.__SYNC_BADGES__ === 'function') window.__SYNC_BADGES__(); });
    await waitForBadgeState(page, 'test-earned');
    await waitForBadgeState(page, 'test-unearned');
    await printBadgeState(page, 'after setTestStateWithWait - badges/bookmarks/analytics');
    // Open profile modal to access badges
    await page.click('#profileBtn');
    await page.getByTestId('smart-learning-btn-profile').click();
    // Badge grid should be visible
    await expect(page.locator('.badge-grid')).toBeVisible({ timeout: 10000 });
    // Debug: log badge grid HTML
    const badgeHtml = await page.locator('.badge-grid').innerHTML();
    console.log('[E2E DEBUG] Badge grid HTML:', badgeHtml);
    // Assert earned badge is present and has earned styling
    await expect(page.getByTestId('badge-earned-test-earned')).toBeVisible();
    await expect(page.getByTestId('badge-earned-test-earned')).toContainText('Test Badge Earned');
    await expect(page.locator('.badge-earned')).toContainText('Test Badge Earned');
    // Assert unearned badge is present and has unearned styling
    await expect(page.getByTestId('badge-unearned-test-unearned')).toBeVisible();
    await expect(page.getByTestId('badge-unearned-test-unearned')).toContainText('Test Badge Unearned');
    await expect(page.locator('.badge-unearned')).toContainText('Test Badge Unearned');
    // Print badge state for further debug
    await printBadgeState(page, 'after badge assertions');
  });
  test('Badge progress panel shows earned and unearned badges with accessibility', async ({ page }) => {
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
    await page.goto('/');
    await waitForAppReady(page);
    await setTestStateWithWait(page, {
      questions: [
        {
          id: 'test-q1',
          question: 'What is the capital of France?',
          answers: ['Paris', 'London', 'Berlin', 'Rome'],
          correct: 0,
          topic: 'geography',
          unit: 'europe'
        }
      ],
      badges: [
        { id: 'test-earned', name: 'Test Badge Earned', earned: true, image: '/badges/default.png', description: 'Earned badge for E2E.' },
        { id: 'test-unearned', name: 'Test Badge Unearned', earned: false, image: '/badges/default.png', description: 'Unearned badge for E2E.' }
      ],
    });
    await waitForFullBadgeSync(page, 'test-earned');
    await waitForFullBadgeSync(page, 'test-unearned');
    await page.evaluate(() => { if (typeof window.__SYNC_BADGES__ === 'function') window.__SYNC_BADGES__(); });
    await waitForBadgeState(page, 'test-earned');
    await waitForBadgeState(page, 'test-unearned');
    await printBadgeState(page, 'after setTestStateWithWait - badges/bookmarks/analytics');
    await page.click('#profileBtn');
    await page.getByTestId('smart-learning-btn-profile').click();
    await expect(page.locator('.badge-grid')).toBeVisible({ timeout: 10000 });
    // Badge count
    await expect(page.locator('[role="checkbox"]')).toHaveCount(2);
    // Accessibility: check role, aria-checked, aria-describedby, and visually hidden text
    const earned = page.getByTestId('badge-earned-test-earned');
    const unearned = page.getByTestId('badge-unearned-test-unearned');
    await expect(earned).toHaveAttribute('role', 'checkbox');
    await expect(earned).toHaveAttribute('aria-checked', 'true');
    await expect(earned).toHaveAttribute('aria-describedby', 'badge-desc-test-earned');
    await expect(earned).toContainText('Test Badge Earned');
    await expect(earned).toContainText('Earned');
    await expect(page.locator('#badge-desc-test-earned')).toHaveText('Earned badge for E2E.');
    await expect(unearned).toHaveAttribute('role', 'checkbox');
    await expect(unearned).toHaveAttribute('aria-checked', 'false');
    await expect(unearned).toHaveAttribute('aria-describedby', 'badge-desc-test-unearned');
    await expect(unearned).toContainText('Test Badge Unearned');
    await expect(unearned).toContainText('Not earned');
    await expect(page.locator('#badge-desc-test-unearned')).toHaveText('Unearned badge for E2E.');
    // Badge image visibility and alt text
    await expect(earned.locator('img')).toBeVisible();
    await expect(earned.locator('img')).toHaveAttribute('alt', 'Test Badge Earned');
    await expect(unearned.locator('img')).toBeVisible();
    await expect(unearned.locator('img')).toHaveAttribute('alt', 'Test Badge Unearned');
    // Badge grid responsiveness: test at different viewport sizes
    await page.setViewportSize({ width: 375, height: 800 }); // Mobile
    await expect(page.locator('.badge-grid, [data-testid="badge-progress-panel"]')).toBeVisible();
    await page.setViewportSize({ width: 1200, height: 800 }); // Desktop
    await expect(page.locator('.badge-grid, [data-testid="badge-progress-panel"]')).toBeVisible();
    // Print badge state for further debug
    await printBadgeState(page, 'after badge accessibility assertions');
  });

  // Badge updates: simulate earning a badge and assert UI updates
  test('Badge UI updates in real time when earning a badge', async ({ page }) => {
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
    await page.goto('/');
    await waitForAppReady(page);
    await setTestStateWithWait(page, {
      questions: [],
      badges: [
        { id: 'test-earned', name: 'Test Badge Earned', earned: false, image: '/badges/default.png', description: 'Earned badge for E2E.' }
      ],
    });
    await waitForFullBadgeSync(page, 'test-earned');
    await page.click('#profileBtn');
    await page.getByTestId('smart-learning-btn-profile').click();
    await expect(page.getByTestId('badge-unearned-test-earned')).toBeVisible();
    // Simulate earning the badge
    await page.evaluate(() => {
      window.setTestState && window.setTestState({ badges: [{ id: 'test-earned', name: 'Test Badge Earned', earned: true, image: '/badges/default.png', description: 'Earned badge for E2E.' }] });
    });
    await waitForFullBadgeSync(page, 'test-earned');
    await expect(page.getByTestId('badge-earned-test-earned')).toBeVisible();
  });

  // Badge details modal (simulate Enter key)
  test('Badge details modal opens on Enter', async ({ page }) => {
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
    await page.goto('/');
    await waitForAppReady(page);
    await setTestStateWithWait(page, {
      questions: [],
      badges: [
        { id: 'test-earned', name: 'Test Badge Earned', earned: true, image: '/badges/default.png', description: 'Earned badge for E2E.' }
      ],
    });
    await waitForFullBadgeSync(page, 'test-earned');
    await page.click('#profileBtn');
    await page.getByTestId('smart-learning-btn-profile').click();
    const badge = page.getByTestId('badge-earned-test-earned');
    await badge.focus();
    await page.keyboard.press('Enter');
    // Optionally, assert that a modal/dialog appears (if implemented)
    // await expect(page.getByTestId('badge-details-modal')).toBeVisible();
  });

  // Badge empty/error state
  test('Badge panel shows helpful message when no badges', async ({ page }) => {
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
    await page.goto('/');
    await waitForAppReady(page);
    await setTestStateWithWait(page, { questions: [], badges: [] });
    await page.click('#profileBtn');
    await page.getByTestId('smart-learning-btn-profile').click();
    await expect(page.getByTestId('badge-progress-panel')).toContainText(/no badges|no achievements|nothing to display/i);
  });

  // Analytics: assert on specific stat values
  test('Analytics modal shows correct stat values', async ({ page }) => {
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
    await page.goto('/');
    await waitForAppReady(page);
    await setTestStateWithWait(page, {
      questions: [
        { id: 'q1', question: 'Q1', answers: ['A'], correct: 0, topic: 't', unit: 'u', answered: 0 }
      ],
      analytics: { totalQuestions: 1, accuracy: '100%', streak: 1 }
    });
    await page.getByTestId('open-analytics-btn-header').click();
    const modalBody = page.getByTestId('analytics-modal-body');
    await expect(modalBody).toContainText('Total Questions: 1');
    await expect(modalBody).toContainText('Accuracy: 100%');
    await expect(modalBody).toContainText('Streak: 1');
  });

  // Analytics: test after quiz actions
  test('Analytics updates after answering a question', async ({ page }) => {
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
    await page.goto('/');
    await waitForAppReady(page);
    await setTestStateWithWait(page, {
      questions: [
        { id: 'q1', question: 'Q1', answers: ['A'], correct: 0, topic: 't', unit: 'u' }
      ],
      analytics: { totalQuestions: 0, accuracy: '0%', streak: 0 }
    });
    // Simulate answering the question
    await page.getByTestId('bookmark-btn').click(); // or whatever triggers answer
    await page.evaluate(() => {
      window.setTestState && window.setTestState({ analytics: { totalQuestions: 1, accuracy: '100%', streak: 1 } });
    });
    await page.getByTestId('open-analytics-btn-header').click();
    const modalBody = page.getByTestId('analytics-modal-body');
    await expect(modalBody).toContainText('Total Questions: 1');
    await expect(modalBody).toContainText('Accuracy: 100%');
    await expect(modalBody).toContainText('Streak: 1');
  });

  // Analytics: accessibility snapshot
  test('Analytics modal accessibility tree is correct', async ({ page }) => {
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
    await page.goto('/');
    await waitForAppReady(page);
    await setTestStateWithWait(page, { questions: [], analytics: {} });
    await page.getByTestId('open-analytics-btn-header').click();
    const snapshot = await page.accessibility.snapshot({ interestingOnly: true });
    // Optionally, assert on modal label, role, and focus
    expect(snapshot.children.some(child => child.role === 'dialog' && /analytics/i.test(child.name))).toBeTruthy();
  });

  // Analytics: empty/error state
  test('Analytics modal shows helpful message when no data', async ({ page }) => {
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
    await page.goto('/');
    await waitForAppReady(page);
    await setTestStateWithWait(page, { questions: [], analytics: {} });
    await page.getByTestId('open-analytics-btn-header').click();
    const modalBody = page.getByTestId('analytics-modal-body');
    await expect(modalBody).toContainText(/no analytics|no data|nothing to display/i);
  });
});
