import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Quiz from '../pages/Quiz';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: { uid: 'test-user' } }),
}));

// Firestore mocks
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn(() => ({ exists: () => false, data: () => ({}) }));
const mockDoc = jest.fn();
let onSnapshotCallback: ((_snapshot: any) => void) | null = null;

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => { mockDoc(...args); return {}; },
  setDoc: (...args: any[]) => mockSetDoc(...args),
  getDoc: () => mockGetDoc(),
  onSnapshot: (ref: unknown, cb: (_snapshot: any) => void) => {
    onSnapshotCallback = cb;
    // Initial call with default stats
    cb({ exists: () => true, data: () => ({ topicStats: { Test: { correct: 1, total: 2 } } }) });
    return jest.fn();
  },
  getFirestore: () => ({}),
  collection: () => ({}),
  query: () => ({}),
  where: () => ({}),
  getDocs: () => Promise.resolve({ docs: [] }),
}));

jest.mock('../firebaseClient', () => ({ db: {} }));
jest.mock('../questions/index', () => ({
  getQuestions: () => Promise.resolve([
    { id: 'q1', text: 'Q1', options: ['A', 'B'], correctAnswer: 'A', topic: 'Test' },
    { id: 'q2', text: 'Q2', options: ['C', 'D'], correctAnswer: 'D', topic: 'Test' },
  ]),
}));
jest.mock('../hooks/useQuizToggles', () => ({
  useQuizToggles: () => [{ randomizeQuestions: false, randomizeOptions: false, showExplanations: false, instantFeedback: false }, jest.fn()],
}));
describe('QuizResultsScreen Firestore live stats', () => {
  it('shows topic stats from Firestore', async () => {
    render(<Quiz />);
    // Start the quiz
    await screen.findByTestId('quiz-start-form');
    const startQuizBtn = await screen.findByRole('button', { name: /start quiz/i });
    await userEvent.click(startQuizBtn);
    // Answer all questions
    for (let i = 0; i < 2; i++) {
      await screen.findByTestId('quiz-question-card');
      const radios = screen.getAllByRole('radio');
      await userEvent.click(radios[0]);
      let navBtn = null;
      try {
        navBtn = screen.getByRole('button', { name: /next question/i });
      } catch { /* ignore error */ }
      try {
        if (!navBtn) navBtn = screen.getByRole('button', { name: /finish quiz/i });
      } catch { /* ignore error */ }
      if (navBtn && navBtn instanceof HTMLButtonElement && !navBtn.disabled) {
        await userEvent.click(navBtn);
        // Wait for either the results screen or the quiz card to disappear
        await waitFor(() => {
          const quizCard = document.querySelector('[data-testid="quiz-question-card"]');
          const finishBtn = document.querySelector('button[aria-label="Finish quiz"]');
          if (!quizCard || !finishBtn) return true;
          return false;
        });
      }
    }
    // Wait for UI update
    await new Promise(r => setTimeout(r, 100));
    // Wait for the quiz card to disappear (results screen shown)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="quiz-question-card"]')).toBeNull();
    });
    // Wait for UI update
    await new Promise(r => setTimeout(r, 200));
    // Robustly wait for the stat to appear by joining all text nodes in each subtree
    await waitFor(() => {
      function getAllText(node: any): string {
        let text = '';
        node.childNodes.forEach((child: any) => {
          if (child.nodeType === 3) text += child.textContent;
          else text += getAllText(child);
        });
        return text;
      }
      const statFound = Array.from(document.querySelectorAll('*')).some(node =>
        /1\s*\/\s*2\s*correct/.test(getAllText(node).replace(/\s+/g, ' '))
      );
      expect(statFound).toBe(true);
    });
  });

  it('shows topic stats from Firestore and updates when Firestore changes', async () => {
    render(<Quiz />);
    // Start the quiz
    await screen.findByTestId('quiz-start-form');
    const startQuizBtn = await screen.findByRole('button', { name: /start quiz/i });
    await userEvent.click(startQuizBtn);
    // Answer all questions
    for (let i = 0; i < 2; i++) {
      await screen.findByTestId('quiz-question-card');
      const radios = screen.getAllByRole('radio');
      await userEvent.click(radios[0]); // always select first option (correct for q1, incorrect for q2)
      // Find either Next or Finish button, click whichever is present and enabled
      let navBtn = null;
      try {
        navBtn = screen.getByRole('button', { name: /next question/i });
      } catch { /* ignore error */ }
      try {
        if (!navBtn) navBtn = screen.getByRole('button', { name: /finish quiz/i });
      } catch { /* ignore error */ }
      if (navBtn && navBtn instanceof HTMLButtonElement && !navBtn.disabled) {
        await userEvent.click(navBtn);
        // Wait for either the results screen or the quiz card to disappear
        await waitFor(() => {
          const quizCard = document.querySelector('[data-testid="quiz-question-card"]');
          const finishBtn = document.querySelector('button[aria-label="Finish quiz"]');
          if (!quizCard || !finishBtn) return true;
          return false;
        });
      }
    }
    // Wait for UI update
    await new Promise(r => setTimeout(r, 100));
    // Wait for the quiz card to disappear (results screen shown)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="quiz-question-card"]')).toBeNull();
    });
    // Wait for UI update
    await new Promise(r => setTimeout(r, 200));
    // Simulate Firestore stats update after quiz completion
    if (onSnapshotCallback) {
      onSnapshotCallback({ exists: () => true, data: () => ({ topicStats: { Test: { correct: 2, total: 2 } } }) });
    }
    // Wait for the updated stat to appear
    await waitFor(() => {
      function getAllText(node: any) {
        let text = '';
        node.childNodes.forEach((child: any) => {
          if (child.nodeType === 3) text += child.textContent;
          else text += getAllText(child);
        });
        return text;
      }
      const found = Array.from(document.querySelectorAll('*')).some(node => /2\s*\/\s*2\s*correct/.test(getAllText(node).replace(/\s+/g, ' ')));
      expect(found).toBe(true);
    });
    await waitFor(() => {
      function getAllText(node: any) {
        let text = '';
        node.childNodes.forEach((child: any) => {
          if (child.nodeType === 3) text += child.textContent;
          else text += getAllText(child);
        });
        return text;
      }
      const found = Array.from(document.querySelectorAll('*')).some(node => /Test\s*:\s*2\s*\/\s*2\s*correct/i.test(getAllText(node).replace(/\s+/g, ' ')));
      expect(found).toBe(true);
    });
    // Now, click 'Start New Quiz' to restart
    const startNewQuizBtn = document.querySelector('[data-testid="start-new-quiz-btn"]');
    if (startNewQuizBtn) {
      await userEvent.click(startNewQuizBtn);
    } else {
      const tryAnotherBtn = Array.from(document.querySelectorAll('button')).find(btn => /try another quiz/i.test(btn.textContent || ''));
      if (tryAnotherBtn) {
        await userEvent.click(tryAnotherBtn);
      } else {
        const closeBtn = Array.from(document.querySelectorAll('button')).find(btn => /close/i.test(btn.textContent || ''));
        if (closeBtn) {
          await userEvent.click(closeBtn);
        } else {
          throw new Error('Quiz start form not found and no Try Another Quiz or Close button present');
        }
      }
    }
    // Wait for the first question card of the new quiz
    await screen.findByTestId('quiz-question-card');
  });
});
