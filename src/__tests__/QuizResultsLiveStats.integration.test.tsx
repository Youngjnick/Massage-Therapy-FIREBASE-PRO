import React from 'react';
import { render, waitFor, screen, act } from '@testing-library/react';
import Quiz from '../pages/Quiz';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: { uid: 'test-user' } }),
}));

// Firestore mocks
let onSnapshotCallback: any = null;
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn(() => ({ exists: () => false, data: () => ({}) }));
const mockDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => { mockDoc(...args); return {}; },
  setDoc: (...args: any[]) => mockSetDoc(...args),
  getDoc: () => mockGetDoc(),
  onSnapshot: (ref: unknown, cb: (snapshot: any) => void) => {
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
jest.mock('../hooks/useQuizState', () => ({
  useQuizState: () => ({
    started: true,
    setStarted: jest.fn(),
    showResults: true,
    setShowResults: jest.fn(),
    current: 0,
    setCurrent: jest.fn(),
    userAnswers: [0, 1],
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

describe('QuizResultsScreen Firestore live stats', () => {
  beforeEach(() => {
    mockSetDoc.mockClear();
    mockGetDoc.mockClear();
    mockDoc.mockClear();
    onSnapshotCallback = null;
  });

  it('shows topic stats from Firestore and updates when Firestore changes', async () => {
    render(<Quiz />);
    // Wait for the results screen to appear
    await screen.findByText('Results');
    // Initial Firestore stats
    // Check that the topic label and stats are both present in the topic progress UI
    expect(screen.getAllByText('Test').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1 / 2 correct').length).toBeGreaterThan(0);
    // QuizSessionCharts and QuizSessionSummary both render 'Accuracy by Topic'
    const accuracyLabels = screen.getAllByText(/Accuracy by Topic/i);
    expect(accuracyLabels.length).toBeGreaterThanOrEqual(2);
    // QuizSessionCharts
    expect(screen.getByText(/Test: 1 \/ 2 correct/i)).toBeInTheDocument();
    // QuizSessionSummary
    expect(screen.getByText(/Test: 1 \/ 2 \(50%\)/i)).toBeInTheDocument();
    // QuizTopicProgress
    const progressLabel = screen.getAllByText('Test')[0];
    expect(progressLabel).toBeInTheDocument();
    // Simulate Firestore update
    act(() => {
      onSnapshotCallback({ exists: () => true, data: () => ({ topicStats: { Test: { correct: 2, total: 2 } } }) });
    });
    await waitFor(() => {
      expect(screen.getAllByText('Test').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2 / 2 correct').length).toBeGreaterThan(0);
      expect(screen.getByText(/Test: 2 \/ 2 correct/i)).toBeInTheDocument();
      expect(screen.getByText(/Test: 2 \/ 2 \(100%\)/i)).toBeInTheDocument();
    });
  });
});
