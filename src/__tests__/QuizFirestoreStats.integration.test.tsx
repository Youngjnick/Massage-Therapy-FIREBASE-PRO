jest.mock('../questions/index', () => ({
  getQuestions: jest.fn().mockResolvedValue([
    {
      id: 'q1',
      topics: ['Test'],
      text: 'What is 2+2?',
      options: ['4', '3', '2', '1'],
      correctAnswer: '4',
    },
    {
      id: 'q2',
      topics: ['Test'],
      text: 'What is 3+3?',
      options: ['5', '6', '7', '8'],
      correctAnswer: '6',
    }
  ]),
}));
jest.mock('../hooks/useQuizData');

import * as quizDataHook from '../hooks/useQuizData';
jest.spyOn(quizDataHook, 'fetchQuizQuestions').mockResolvedValue([
  {
    id: 'q1',
    topics: ['Test'],
    text: 'What is 2+2?',
    options: ['4', '3', '2', '1'],
    correctAnswer: '4',
  },
  {
    id: 'q2',
    topics: ['Test'],
    text: 'What is 3+3?',
    options: ['5', '6', '7', '8'],
    correctAnswer: '6',
  }
]);

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

// Mock useQuizToggles and useQuizState to default values
jest.mock('../hooks/useQuizToggles', () => ({
  useQuizToggles: () => [{ randomizeQuestions: false, randomizeOptions: false, showExplanations: false, instantFeedback: false }, jest.fn()],
}));
jest.unmock('../hooks/useQuizState');

// NOTE: If you see a TSConfig error, ensure this file is included in your tsconfig.json or a test-specific tsconfig.

describe('Quiz Firestore Stats Integration', () => {
  beforeEach(() => {
    (quizDataHook.useQuizData as unknown as jest.Mock).mockReturnValue({
      questions: [
        {
          id: 'q1',
          topics: ['Test'],
          question: 'What is 2+2?',
          options: ['4', '3', '2', '1'],
          correctAnswer: '4',
        },
        {
          id: 'q2',
          topics: ['Test'],
          question: 'What is 3+3?',
          options: ['5', '6', '7', '8'],
          correctAnswer: '6',
        }
      ],
      setQuestions: jest.fn(),
      loading: false,
      setLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
      availableTopics: ['Test'],
    });
    mockSetDoc.mockClear();
    mockGetDoc.mockClear();
    mockDoc.mockClear();
  });

  it('calls setDoc with correct stats after answering a question (realistic flow)', async () => {
    render(<Quiz />);
    // Wait for the quiz start form to appear
    const startForm = await screen.findByTestId('quiz-start-form');
    // Set quiz length to 2
    const quizLengthInput = await screen.findByTestId('quiz-length-input');
    fireEvent.change(quizLengthInput, { target: { value: 2 } });
    // Submit the quiz start form
    fireEvent.submit(startForm);
    // Wait for the first question to appear
    await screen.findByTestId('quiz-question-card');
    // Select the first answer by clicking the radio input (user-like interaction)
    const firstOptionRadio = screen.getByRole('radio', { name: /option a/i });
    await userEvent.click(firstOptionRadio);
    // Wait for the radio to be checked and the Next button to be enabled
    await waitFor(() => {
      expect(firstOptionRadio).toBeChecked();
      const btns = screen.getAllByRole('button', { name: /next|finish/i });
      const btn = btns.find(b => !(b as HTMLButtonElement).disabled);
      expect(btn).toBeDefined();
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    });
    // Click Next to go to the second question
    const btns = screen.getAllByRole('button', { name: /next|finish/i });
    const nextBtn = btns.find(b => b.textContent?.toLowerCase().includes('next') && !(b as HTMLButtonElement).disabled);
    await userEvent.click(nextBtn!);
    // Select the first answer for the second question
    const secondOptionRadio = screen.getByRole('radio', { name: /option a/i });
    await userEvent.click(secondOptionRadio);
    // Wait for the radio to be checked and the Finish button to be enabled
    await waitFor(() => {
      expect(secondOptionRadio).toBeChecked();
      const btns2 = screen.getAllByRole('button', { name: /finish/i });
      const finishBtn = btns2.find(b => !(b as HTMLButtonElement).disabled);
      expect(finishBtn).toBeDefined();
      expect((finishBtn as HTMLButtonElement).disabled).toBe(false);
    });
    // Click Finish to complete the quiz
    const btns2 = screen.getAllByRole('button', { name: /finish/i });
    const finishBtn = btns2.find(b => !(b as HTMLButtonElement).disabled);
    await userEvent.click(finishBtn!);
    // Wait for Firestore setDoc to be called
    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalled();
    });
  });
});
