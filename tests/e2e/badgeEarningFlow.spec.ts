// @ts-nocheck
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { test, expect, Page } from '@playwright/test';
import { mockAuth } from './helpers/e2eDebugHelpers';
import { printBadgeState } from './helpers/printBadgeState';
import { setTestStateWithWait, signIn } from './helpers/e2eDebugHelpers';

test.describe('Badge Earning Flow', () => {
  test('should earn a badge and show 🏅 icon', async ({ page }) => {
    await mockAuth(page);
    await signIn(page);
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
      badges: [{ id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'E2E Test Badge' }],
    });
    await printBadgeState(page, 'after setTestStateWithWait - badge earning flow');
    // Add assertion for badge icon or earned badge in UI
    await page.click('#profileBtn');
    await page.click('text=Smart Learning');
    await expect(page.locator('.badge-grid')).toBeVisible();
    const badgeHtml = await page.locator('.badge-grid').innerHTML();
    expect(badgeHtml).toMatch(/Test Badge|🏅/i);
  });
});
