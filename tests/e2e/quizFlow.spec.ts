// @ts-nocheck
// Playwright E2E: Quiz flow and analytics update
import { test, expect } from '@playwright/test';
import { setTestStateWithWait, waitForAppReady } from './helpers/e2eDebugHelpers';

test.describe('Quiz Flow', () => {
  test('User can start quiz, answer questions, and analytics update', async ({ page }) => {
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
        { id: 'q1', question: 'Q1', answers: ['A', 'B', 'C'], correct: 0, topic: 'Anatomy' },
        { id: 'q2', question: 'Q2', answers: ['A', 'B', 'C'], correct: 1, topic: 'Anatomy' },
        { id: 'q3', question: 'Q3', answers: ['A', 'B', 'C'], correct: 2, topic: 'Anatomy' },
        { id: 'q4', question: 'Q4', answers: ['A', 'B', 'C'], correct: 0, topic: 'Anatomy' },
        { id: 'q5', question: 'Q5', answers: ['A', 'B', 'C'], correct: 1, topic: 'Anatomy' }
      ],
      quizStarted: false,
      selectedTopic: ''
    });
    await page.evaluate(() => {
      window.dispatchEvent(new Event('questionsUpdated'));
      window.dispatchEvent(new Event('testStateChanged'));
      if (typeof window.setupUI === 'function') window.setupUI();
    });

    // PATCH: Reload after state injection to ensure React picks up questions
    await page.reload();
    await waitForAppReady(page);

    // Re-inject E2E questions after reload (required for React to pick up state)
    await setTestStateWithWait(page, {
      questions: [
        { id: 'q1', question: 'Q1', answers: ['A', 'B', 'C'], correct: 0, topic: 'Anatomy' },
        { id: 'q2', question: 'Q2', answers: ['A', 'B', 'C'], correct: 1, topic: 'Anatomy' },
        { id: 'q3', question: 'Q3', answers: ['A', 'B', 'C'], correct: 2, topic: 'Anatomy' },
        { id: 'q4', question: 'Q4', answers: ['A', 'B', 'C'], correct: 0, topic: 'Anatomy' },
        { id: 'q5', question: 'Q5', answers: ['A', 'B', 'C'], correct: 1, topic: 'Anatomy' }
      ],
      quizStarted: false,
      selectedTopic: ''
    });
    await page.evaluate(() => {
      window.dispatchEvent(new Event('questionsUpdated'));
      window.dispatchEvent(new Event('testStateChanged'));
      if (typeof window.setupUI === 'function') window.setupUI();
    });

    // Debug: log window.appState and QuizCard props after reload
    const appState = await page.evaluate(() => window.appState);
    console.log('[E2E DEBUG] window.appState after reload:', appState);
    const quizCardProps = await page.evaluate(() => {
      const quizCard = document.querySelector('[data-testid="quiz-card"]');
      return quizCard ? quizCard.innerText : 'NO_QUIZ_CARD';
    });
    console.log('[E2E DEBUG] QuizCard props after reload:', quizCardProps);

    // Wait for topic and length dropdowns (with debug logging)
    await page.waitForSelector('[data-testid="topic-select"]', { timeout: 10000 }).catch(async () => {
      const html = await page.content();
      const appState = await page.evaluate(() => window.appState);
      console.log('DEBUG: [data-testid="topic-select"] not found. DOM:', html.slice(0, 2000));
      console.log('DEBUG: window.appState:', appState);
      throw new Error('Timeout waiting for [data-testid="topic-select"]');
    });
    await page.waitForSelector('[data-testid="quiz-length-select"]', { timeout: 10000 });
    // Wait for topic dropdown to have more than 1 option (not just default)
    await page.waitForFunction(() => {
      const sel = document.querySelector('[data-testid="topic-select"]');
      return sel && sel.options && sel.options.length > 1;
    }, { timeout: 10000 }).catch(async () => {
      const html = await page.content();
      const appState = await page.evaluate(() => window.appState);
      console.log('DEBUG: [data-testid="topic-select"] did not populate. DOM:', html.slice(0, 2000));
      console.log('DEBUG: window.appState:', appState);
      throw new Error('Timeout waiting for [data-testid="topic-select"] to populate');
    });

    // Select first topic and quiz length 5
    await page.selectOption('[data-testid="topic-select"]', { index: 1 });
    await page.selectOption('[data-testid="quiz-length-select"]', { value: '5' });

    // Start quiz
    await page.click('[data-testid="start-quiz-btn"]');
    await page.waitForSelector('.quiz-card');

    // Answer all questions
    for (let i = 0; i < 5; i++) {
      await page.waitForSelector('[data-testid^="answer-btn-"]');
      // Capture current question number or text before answering
      const prevQNum = await page.$eval('.quiz-qnum', el => el.textContent).catch(() => null);
      const prevQText = await page.$eval('[data-testid="quiz-question"]', el => el.textContent).catch(() => null);
      const btns = await page.$$('[data-testid^="answer-btn-"]');
      await btns[0].click(); // Always pick first answer
      // Wait for and click next button
      await page.waitForSelector('[data-testid="next-btn"]', { timeout: 5000 });
      await page.click('[data-testid="next-btn"]');
      // Wait for question number or text to change (robust progression)
      await page.waitForFunction(({ prevQNum, prevQText }) => {
        const qnum = document.querySelector('.quiz-qnum')?.textContent;
        const qtext = document.querySelector('[data-testid="quiz-question"]')?.textContent;
        return (qnum && qnum !== prevQNum) || (qtext && qtext !== prevQText);
      }, { prevQNum, prevQText }, { timeout: 5000 }).catch(() => {/* Last question, quiz complete UI will show */});
    }

    // Quiz complete UI
    await page.waitForSelector('[data-testid="quiz-card-complete"]');

    // Open analytics modal
    await page.getByTestId('analytics-btn').click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    // Check that accuracy chart and stats are present
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
    await expect(page.getByTestId('history-chart')).toBeVisible();
    await expect(page.getByTestId('mastery-chart')).toBeVisible();
    // Check that stats reflect 5 questions
    const statsText = await page.getByTestId('analytics-modal').innerText();
    expect(statsText).toContain('Total Questions: 5');
  });
});
