import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

// Static mocks for Firebase Auth and Firestore
jest.mock('../firebaseClient', () => ({ db: {} }));

const mockOnAuthStateChanged = jest.fn((auth: unknown, cb: (user: { uid: string } | null) => void) => {
  cb({ uid: 'test-user' });
  return jest.fn();
});
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  
  onAuthStateChanged: (...args: [unknown, (user: { uid: string } | null) => void]) => mockOnAuthStateChanged(...args),
}));

let mockFirestoreCallback: any;
let mockTopicStatsCallback: any;
const mockDoc = jest.fn();
jest.mock('firebase/firestore', () => {
  return {
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    doc: (...args: any[]) => mockDoc(...args),
    
    onSnapshot: (ref: unknown, cb: (snapshot: any) => void) => {
      // Simulate two onSnapshot listeners: analytics and topicStats
      if (!mockFirestoreCallback) {
        mockFirestoreCallback = cb;
        cb({
          exists: () => true,
          data: () => ({
            completed: 5,
            correct: 40,
            total: 50,
            streak: 3,
            badges: 2,
          }),
        });
      } else {
        mockTopicStatsCallback = cb;
        cb({
          exists: () => true,
          data: () => ({ Anatomy: { correct: 10, total: 12 }, Physiology: { correct: 8, total: 10 } }),
        });
      }
      return jest.fn();
    },
  };
});

import Analytics from './Analytics';

describe('Analytics Page', () => {
  beforeEach(() => {
    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'test-user' });
      return jest.fn();
    });
    mockDoc.mockClear();
    mockFirestoreCallback = undefined;
    mockTopicStatsCallback = undefined;
  });

  it('renders analytics stats for authenticated user', async () => {
    render(<Analytics />);
    const quizzesDiv = screen.getByText('Quizzes Taken:').parentElement!;
    expect(quizzesDiv).toHaveTextContent(/Quizzes Taken:\s*5/);
    const correctDiv = screen.getByText('Correct Answers:').parentElement!;
    expect(correctDiv).toHaveTextContent(/Correct Answers:\s*40\s*\/\s*50/);
    // Topic breakdown
    expect(screen.getByText('Anatomy')).toBeInTheDocument();
    expect(screen.getByText('Physiology')).toBeInTheDocument();
    // Ensure correct Firestore path
    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(),
      'users',
      'test-user',
      'stats',
      'analytics'
    );
  });

  it('prompts for sign-in if no user', async () => {
    mockOnAuthStateChanged.mockImplementationOnce((auth, cb) => {
      cb(null);
      return jest.fn();
    });
    render(<Analytics />);
    expect(await screen.findByText(/please sign in/i)).toBeInTheDocument();
  });

  it('updates UI when Firestore data changes', async () => {
    render(<Analytics />);
    const quizzesDiv = screen.getByText('Quizzes Taken:').parentElement!;
    const correctDiv = screen.getByText('Correct Answers:').parentElement!;
    // Initial state
    expect(quizzesDiv).toHaveTextContent(/Quizzes Taken:\s*5/);
    expect(correctDiv).toHaveTextContent(/Correct Answers:\s*40\s*\/\s*50/);
    // Simulate Firestore update
    act(() => {
      mockFirestoreCallback({
        exists: () => true,
        data: () => ({
          completed: 2,
          correct: 15,
          total: 25,
          streak: 2,
          badges: 1,
        }),
      });
      mockTopicStatsCallback({
        exists: () => true,
        data: () => ({ Anatomy: { correct: 2, total: 3 }, Physiology: { correct: 1, total: 2 } }),
      });
    });
    await waitFor(() => {
      expect(quizzesDiv).toHaveTextContent(/Quizzes Taken:\s*2/);
      expect(correctDiv).toHaveTextContent(/Correct Answers:\s*15\s*\/\s*25/);
      // Updated topic breakdown
      expect(screen.getByText('Anatomy')).toBeInTheDocument();
      expect(screen.getByText('Physiology')).toBeInTheDocument();
    });
  });

  it('handles missing analytics document gracefully', async () => {
    render(<Analytics />);
    const quizzesDiv = screen.getByText('Quizzes Taken:').parentElement!;
    const correctDiv = screen.getByText('Correct Answers:').parentElement!;
    // Simulate missing doc as the first snapshot after render
    act(() => {
      mockFirestoreCallback({
        exists: () => false,
        data: () => ({}),
      });
      mockTopicStatsCallback({
        exists: () => false,
        data: () => ({}),
      });
    });
    await waitFor(() => {
      expect(quizzesDiv).toHaveTextContent(/Quizzes Taken:\s*0/);
      expect(correctDiv).toHaveTextContent(/Correct Answers:\s*0\s*\/\s*0/);
    });
  });
});
