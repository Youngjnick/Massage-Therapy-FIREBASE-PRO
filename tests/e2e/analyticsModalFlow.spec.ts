// @ts-nocheck
// Playwright E2E: Analytics modal and chart rendering
import { test, expect, Page } from '@playwright/test';
import fs from 'fs';

// Helper to set mock auth before each test
async function mockAuth(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
      email: 'testuser@gmail.com',
      name: 'Test User',
      uid: 'mock-uid-123',
    }));
  });
}

// Remove patchE2EState helper (all logic is now inlined in the test)

test.describe('Analytics Modal', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      // eslint-disable-next-line no-console
      console.log(`[browser console.${msg.type()}]`, msg.text());
    });
    page.on('pageerror', error => {
      // eslint-disable-next-line no-console
      console.error('[browser pageerror]', error);
    });
  });

  test('Analytics Modal: open modal and display chart', async ({ page }) => {
    await mockAuth(page);
    // Define E2E mock questions for stubbing
    const mockQuestions = [
      {
        id: 'test-q1',
        question: 'What is the capital of France?',
        answers: ['Paris', 'London', 'Berlin', 'Rome'],
        correct: 0,
        topic: 'geography',
        unit: 'europe',
        answered: 0
      },
      {
        id: 'test-q2',
        question: 'What is the capital of Germany?',
        answers: ['Paris', 'London', 'Berlin', 'Rome'],
        correct: 2,
        topic: 'geography',
        unit: 'europe',
        answered: 1
      },
      {
        id: 'test-q3',
        question: 'What is the capital of Italy?',
        answers: ['Paris', 'London', 'Berlin', 'Rome'],
        correct: 3,
        topic: 'geography',
        unit: 'europe',
        answered: 1
      },
      {
        id: 'test-q4',
        question: 'What is the capital of Spain?',
        answers: ['Madrid', 'London', 'Berlin', 'Rome'],
        correct: 0,
        topic: 'geography',
        unit: 'europe',
        answered: 0
      },
      {
        id: 'test-q5',
        question: 'What is the capital of UK?',
        answers: ['Paris', 'London', 'Berlin', 'Rome'],
        correct: 1,
        topic: 'geography',
        unit: 'europe',
        answered: 1
      }
    ];
    // Stub fetchQuestions and getQuestions before app loads
    await page.addInitScript((questions) => {
      window.__E2E_TEST__ = true;
      window.fetchQuestions = async () => questions;
      window.getQuestions = async () => questions;
      window.localStorage.setItem('questions', JSON.stringify(questions));
      window.appState = window.appState || {};
      window.appState.questions = questions;
      window.appState.selectedTopic = 'geography';
      window.appState.quizStarted = true;
    }, mockQuestions);
    // --- E2E PATCH: Set window.__E2E_QUESTIONS__ before app loads ---
    await page.addInitScript((questions) => {
      window.__E2E_QUESTIONS__ = questions;
    }, mockQuestions);
    await page.goto('/');
    // Monkey-patch the actual imported getQuestions function in the browser
    await page.evaluate((questions) => {
      // Try to patch all module cache entries for getQuestions
      // @ts-ignore
      if (window.__vite__ && window.__vite__.ssrModuleLoader) {
        // Vite SSR module loader (rare in browser)
        for (const key in window.__vite__.ssrModuleLoader.moduleCache) {
          const mod = window.__vite__.ssrModuleLoader.moduleCache[key]?.exports;
          if (mod && typeof mod.getQuestions === 'function') {
            mod.getQuestions = async () => questions;
          }
        }
      }
      // Try to patch all modules in import.meta.glob cache (Vite)
      if (window.__vite__ && window.__vite__.moduleCache) {
        for (const key in window.__vite__.moduleCache) {
          const mod = window.__vite__.moduleCache[key]?.exports;
          if (mod && typeof mod.getQuestions === 'function') {
            mod.getQuestions = async () => questions;
          }
        }
      }
      // Try to patch all properties on window for dev/debug
      for (const k in window) {
        try {
          if (window[k] && typeof window[k].getQuestions === 'function') {
            window[k].getQuestions = async () => questions;
          }
        } catch {}
      }
    }, mockQuestions);
    // Patch E2E state and fire questionsUpdated multiple times to win against real fetches
    await page.evaluate(async (questions) => {
      function patch() {
        window.appState = window.appState || {};
        window.appState.questions = questions;
        window.appState.badges = [];
        window.appState.selectedTopic = 'geography';
        window.appState.quizStarted = true;
        window.appState.quizHistory = [{
          date: Date.now(),
          total: questions.length,
          correct: questions.filter(q => q.answered === 1).length,
          incorrect: questions.filter(q => q.answered === 0).length,
          unanswered: questions.filter(q => q.answered === undefined).length,
          score: questions.filter(q => q.answered === 1).length,
          streak: 2,
        }];
        if (typeof window.__REACT_SET_TEST_STATE__ === 'function') {
          window.__REACT_SET_TEST_STATE__({
            questions,
            quizStarted: true,
            selectedTopic: 'geography',
            quizHistory: window.appState.quizHistory
          });
        }
        window.dispatchEvent(new Event('questionsUpdated'));
      }
      // Patch 5 times with 200ms delay
      for (let i = 0; i < 5; ++i) {
        patch();
        // eslint-disable-next-line no-await-in-loop
        await new Promise(res => setTimeout(res, 200));
      }
    }, mockQuestions);
    // Wait for the dropdown to appear in the DOM
    const dropdown = await page.waitForSelector('select[data-topic]', { timeout: 5000 });
    const dropdownHtml = await dropdown.evaluate(sel => sel.outerHTML);
    // eslint-disable-next-line no-console
    console.log('[E2E DEBUG] Dropdown initial HTML:', dropdownHtml);
    // Wait for the dropdown to have the E2E topic
    try {
      await page.waitForFunction(() => {
        const sel = document.querySelector('select[data-topic]');
        return sel && Array.from(sel.options).some(opt => opt.value === 'geography');
      }, { timeout: 5000 });
    } catch (e) {
      // Dump dropdown HTML and take screenshot for debug
      const html = await page.evaluate(() => {
        const sel = document.querySelector('select[data-topic]');
        return sel ? sel.outerHTML : 'NO DROPDOWN FOUND';
      });
      // eslint-disable-next-line no-console
      console.log('[E2E DEBUG] Dropdown HTML after timeout:', html);
      await page.screenshot({ path: 'dropdown-debug.png' });
      throw e;
    }
    // Select the first real topic (skip placeholder)
    await page.selectOption('select[data-topic]', { index: 1 });
    await page.selectOption('select[data-quiz-length]', { value: '5' });

    // Start the quiz
    await page.click('[data-testid="start-quiz-btn"]');

    // Wait for the first question to load
    await page.waitForSelector('.question-text, .question-container', { timeout: 5000 });

    // Wait for the analytics button
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    try {
      await expect(page.getByTestId('open-analytics-btn')).toBeVisible();
    } 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (e) {
      await page.screenshot({ path: 'analytics-btn-not-found.png' });
      const dom = await page.content();
      fs.writeFileSync('analytics-btn-not-found.html', dom);
      throw new Error('Analytics button not found. Screenshot and DOM saved.');
    }

    await page.getByTestId('open-analytics-btn').click();

    // Wait for the analytics modal
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    try {
      await expect(page.getByTestId('analytics-modal')).toBeVisible();
    } 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (e) {
      await page.screenshot({ path: 'modal-not-found.png' });
      const dom = await page.content();
      fs.writeFileSync('modal-not-found.html', dom);
      throw new Error('Modal overlay not found. Screenshot and DOM saved.');
    }

    // Wait for the chart to be visible
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    try {
      await expect(page.getByRole('img', { name: 'Quiz Accuracy Chart' })).toBeVisible();
    } 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (e) {
      await page.screenshot({ path: 'chart-not-found.png' });
      const dom = await page.content();
      fs.writeFileSync('chart-not-found.html', dom);
      throw new Error('Chart canvas not found. Screenshot and DOM saved.');
    }

    const modal = await page.getByTestId('analytics-modal');
    expect(modal).not.toBeNull();
    const chart = await page.getByRole('img', { name: 'Quiz Accuracy Chart' });
    expect(chart).not.toBeNull();
  });
});
