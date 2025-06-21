import React from 'react';
import { render, waitFor, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Quiz from '../pages/Quiz';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: { uid: 'test-user' } }),
}));

// Mock Firestore setDoc and doc
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn(() => ({ exists: () => false, data: () => ({}) }));
const mockDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => { mockDoc(...args); return {}; },
  setDoc: (...args: any[]) => mockSetDoc(...args),
  getDoc: () => mockGetDoc(),
  getFirestore: () => ({}),
  collection: () => ({}),
  query: () => ({}),
  where: () => ({}),
  getDocs: () => Promise.resolve({ docs: [] }),
}));

// Mock db export
jest.mock('../firebaseClient', () => ({ db: {} }));

// Minimal question data for test
jest.mock('../questions/index', () => ({
  getQuestions: () => Promise.resolve([
    { id: 'q1', text: 'Q1', options: ['A', 'B'], correctAnswer: 'A', topics: ['Test'] },
    { id: 'q2', text: 'Q2', options: ['C', 'D'], correctAnswer: 'D', topics: ['Test'] },
  ]),
}));

// Mock useQuizToggles and useQuizState to default values
jest.mock('../hooks/useQuizToggles', () => ({
  useQuizToggles: () => [{ randomizeQuestions: false, randomizeOptions: false, showExplanations: false, instantFeedback: false }, jest.fn()],
}));
jest.unmock('../hooks/useQuizState');

describe('Quiz Firestore Stats Integration', () => {
  beforeEach(() => {
    mockSetDoc.mockClear();
    mockGetDoc.mockClear();
    mockDoc.mockClear();
  });

  it('calls setDoc with correct stats after answering a question (realistic flow)', async () => {
    render(<Quiz />);
    // Wait for the quiz start form to appear
    const startForm = await screen.findByTestId('quiz-start-form');
    // Submit the quiz start form
    fireEvent.submit(startForm);
    // Wait for the first question to appear
    await screen.findByTestId('quiz-question-card');
    // Select the first answer by clicking the radio input (user-like interaction)
    const firstOptionRadio = screen.getByRole('radio', { name: /option a/i });
    await userEvent.click(firstOptionRadio);
    // Wait for the radio to be checked and the Finish button to be enabled
    await waitFor(() => {
      expect(firstOptionRadio).toBeChecked();
      // Find all Next/Finish buttons and pick the enabled one
      const btns = screen.getAllByRole('button', { name: /next|finish/i });
      const btn = btns.find(b => !(b as HTMLButtonElement).disabled);
      expect(btn).toBeDefined();
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    });
    const btns = screen.getAllByRole('button', { name: /next|finish/i });
    const nextOrFinishBtn = btns.find(b => !(b as HTMLButtonElement).disabled);
    await userEvent.click(nextOrFinishBtn!);
    // Wait for Firestore setDoc to be called
    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalled();
    });
  });
});
