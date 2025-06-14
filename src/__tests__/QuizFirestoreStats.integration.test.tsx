import React from 'react';
import { render, waitFor, fireEvent, screen } from '@testing-library/react';
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
    { id: 'q1', text: 'Q1', options: ['A', 'B'], correctAnswer: 'A', topic: 'Test' },
    { id: 'q2', text: 'Q2', options: ['C', 'D'], correctAnswer: 'D', topic: 'Test' },
  ]),
}));

// Mock useQuizToggles and useQuizState to default values
jest.mock('../hooks/useQuizToggles', () => ({
  useQuizToggles: () => [{ randomizeQuestions: false, randomizeOptions: false, showExplanations: false, instantFeedback: false }, jest.fn()],
}));
jest.mock('../hooks/useQuizState', () => ({
  useQuizState: () => ({
    started: true,
    setStarted: jest.fn(),
    showResults: false,
    setShowResults: jest.fn(),
    current: 0,
    setCurrent: jest.fn(),
    userAnswers: [undefined, undefined],
    setUserAnswers: jest.fn(),
    shuffledQuestions: [
      { id: 'q1', text: 'Q1', options: ['A', 'B'], correctAnswer: 'A', topic: 'Test' },
      { id: 'q2', text: 'Q2', options: ['C', 'D'], correctAnswer: 'D', topic: 'Test' },
    ],
    setShuffledQuestions: jest.fn(),
    shuffledOptions: { 0: ['A', 'B'], 1: ['C', 'D'] },
    setShuffledOptions: jest.fn(),
    answered: false,
    setAnswered: jest.fn(),
    questionTimes: [0, 0],
    setQuestionTimes: jest.fn(),
    questionStart: null,
    setQuestionStart: jest.fn(),
    hasCompletedQuiz: false,
    setHasCompletedQuiz: jest.fn(),
    filter: 'all',
    setFilter: jest.fn(),
    filterValue: '',
    setFilterValue: jest.fn(),
    sort: 'default',
    setSort: jest.fn(),
  }),
}));

describe('Quiz Firestore Stats Integration', () => {
  beforeEach(() => {
    mockSetDoc.mockClear();
    mockGetDoc.mockClear();
    mockDoc.mockClear();
  });

  it('calls setDoc with correct stats after answering a question (realistic flow)', async () => {
    render(<Quiz />);
    // Wait for the question card to appear (quiz is already started in mock)
    await screen.findByTestId('quiz-question-card');
    // Click the first radio input to answer
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    // Wait for Firestore update
    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalled();
      const call = mockSetDoc.mock.calls[0];
      expect(call[1]).toMatchObject({
        correct: 0,
        total: 2,
      });
    });
  });
});
