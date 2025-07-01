/* global console */
import { test, expect } from '@playwright/test';

test.describe('Finish and Finish Quiz Buttons', () => {
  test('completes quiz and shows results with Finish button', async ({ page }: { page: import('@playwright/test').Page }) => {
    await page.goto('/');
    console.log('[E2E PROGRESS] Navigated to /');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    let quizLengthInputFound = false;
    try {
      await page.getByLabel('Quiz Length', { exact: false }).waitFor({ state: 'visible', timeout: 10000 });
      quizLengthInputFound = true;
    } catch {
      if (!page.isClosed()) {
        try {
          await page.screenshot({ path: 'test-results/finish-quiz-buttons-quiz-length-missing-1.png', fullPage: true });
          const html = await page.content();
          console.log('[E2E ERROR] Quiz Length input not found. Dumping HTML and labels...');
          const allLabels = await page.$$eval('label', (labels: Element[]) => labels.map(l => (l as HTMLLabelElement).textContent));
          console.log('[E2E ERROR] All labels:', allLabels);
          console.log('[E2E ERROR] HTML:', html);
        } catch {
          console.log('[E2E ERROR] Could not capture screenshot or HTML');
        }
      }
      throw new Error('Quiz Length input not found');
    }
    if (quizLengthInputFound) {
      await page.getByLabel('Quiz Length', { exact: false }).fill('2');
      console.log('[E2E PROGRESS] Filled Quiz Length input');
    }
    await page.getByRole('button', { name: /start/i }).click();
    console.log('[E2E PROGRESS] Clicked Start button');
    // Answer first question
    await page.getByTestId('quiz-option').first().click();
    console.log('[E2E PROGRESS] Selected first quiz option');
    await page.getByRole('button', { name: /next/i }).click();
    console.log('[E2E PROGRESS] Clicked Next button');
    // Answer second question
    await page.getByTestId('quiz-option').first().click();
    console.log('[E2E PROGRESS] Selected second quiz option');
    // Click Finish
    await page.getByRole('button', { name: /finish/i }).click();
    console.log('[E2E PROGRESS] Clicked Finish button');
    // Results screen should be visible
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    console.log('[E2E PROGRESS] Quiz results are visible');
  });

  // @ts-expect-error Playwright test typing workaround
  test('shows Finish Quiz button and works as expected', async function({ page }: { page: import('@playwright/test').Page }) {
    await page.goto('/');
    console.log('[E2E PROGRESS] Navigated to /');
    // Wait for the DOM to be interactive
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    let quizLengthInputFound = false;
    try {
      await page.getByLabel('Quiz Length', { exact: false }).waitFor({ state: 'visible', timeout: 10000 });
      quizLengthInputFound = true;
    } catch {
      // Only try to log if the page is not closed
      if (!page.isClosed()) {
        try {
          await page.screenshot({ path: 'test-results/finish-quiz-buttons-quiz-length-missing.png', fullPage: true });
          const html = await page.content();
          console.log('[E2E ERROR] Quiz Length input not found. Dumping HTML and labels...');
          const allLabels = await page.$$eval('label', (labels: Element[]) => labels.map(l => (l as HTMLLabelElement).textContent));
          console.log('[E2E ERROR] All labels:', allLabels);
          console.log('[E2E ERROR] HTML:', html);
        } catch {
          console.log('[E2E ERROR] Could not capture screenshot or HTML');
        }
      }
      throw new Error('Quiz Length input not found');
    }
    if (quizLengthInputFound) {
      await page.getByLabel('Quiz Length', { exact: false }).fill('1');
      console.log('[E2E PROGRESS] Filled Quiz Length input');
    }
    await page.getByRole('button', { name: /start/i }).click();
    console.log('[E2E PROGRESS] Clicked Start button');
    await page.getByTestId('quiz-option').first().click();
    console.log('[E2E PROGRESS] Selected first quiz option');

    // Wait for either Finish Quiz or Finish button to appear, with progress output
    const maxWaitMs = 20000;
    const pollInterval = 500;
    let waited = 0;
    let finishQuizVisible = false;
    let finishVisible = false;
    let lastLog = '';
    const finishQuizBtn = page.getByRole('button', { name: /finish quiz/i });
    const finishBtn = page.getByRole('button', { name: /finish/i });
    while (waited < maxWaitMs) {
      finishQuizVisible = await finishQuizBtn.isVisible().catch(() => false);
      finishVisible = await finishBtn.isVisible().catch(() => false);
      if (finishQuizVisible || finishVisible) break;
      const msg = `[E2E PROGRESS] Waiting for Finish/Finish Quiz button... waited ${waited / 1000}s`;
      if (msg !== lastLog) console.log(msg);
      lastLog = msg;
      await page.waitForTimeout(pollInterval);
      waited += pollInterval;
    }
    console.log('[E2E DEBUG] Finish Quiz visible:', finishQuizVisible, 'Finish visible:', finishVisible);
    if (finishQuizVisible) {
      await finishQuizBtn.waitFor({ state: 'attached', timeout: 5000 });
      await finishQuizBtn.click();
      console.log('[E2E DEBUG] Clicked Finish Quiz button');
    } else if (finishVisible) {
      await finishBtn.waitFor({ state: 'attached', timeout: 5000 });
      await finishBtn.click();
      console.log('[E2E DEBUG] Clicked Finish button');
    } else {
      // Dump all button texts for debugging
      const allButtons = await page.$$eval('button', (btns: Element[]) => btns.map(b => (b as HTMLButtonElement).textContent));
      console.log('[E2E ERROR] Neither Finish Quiz nor Finish button was visible. All buttons:', allButtons);
      throw new Error('Neither Finish Quiz nor Finish button was visible');
    }
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    console.log('[E2E DEBUG] Quiz results are visible');
  }, 60000);
  });
