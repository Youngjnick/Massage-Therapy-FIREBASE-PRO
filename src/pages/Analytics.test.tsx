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

let firestoreCallback: (snapshot: any) => void;
const mockDoc = jest.fn();
jest.mock('firebase/firestore', () => {
  return {
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    doc: (...args: any[]) => mockDoc(...args),
    onSnapshot: (ref: unknown, cb: (snapshot: any) => void) => {
      firestoreCallback = cb;
      if (!onSnapshotMock.initialCall) {
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
      }
      return jest.fn();
    },
  };
});
const onSnapshotMock = { initialCall: false };

import Analytics from './Analytics';

describe('Analytics Page', () => {
  beforeEach(() => {
    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'test-user' });
      return jest.fn();
    });
    mockDoc.mockClear();
  });

  it('renders analytics stats for authenticated user', async () => {
    render(<Analytics />);
    const quizzesDiv = screen.getByText('Quizzes Taken:').parentElement!;
    expect(quizzesDiv).toHaveTextContent(/Quizzes Taken:\s*5/);
    const correctDiv = screen.getByText('Correct Answers:').parentElement!;
    expect(correctDiv).toHaveTextContent(/Correct Answers:\s*40\s*\/\s*50/);
    const accuracyDiv = screen.getByText('Accuracy:').parentElement!;
    expect(accuracyDiv).toHaveTextContent(/Accuracy:\s*80%/);
    const streakDiv = screen.getByText('Current Streak:').parentElement!;
    expect(streakDiv).toHaveTextContent(/Current Streak:\s*3 days/);
    const badgesDiv = screen.getByText('Badges Earned:').parentElement!;
    expect(badgesDiv).toHaveTextContent(/Badges Earned:\s*2/);
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
      firestoreCallback({
        exists: () => true,
        data: () => ({
          completed: 2,
          correct: 15,
          total: 25,
          streak: 2,
          badges: 1,
        }),
      });
    });
    await waitFor(() => {
      expect(quizzesDiv).toHaveTextContent(/Quizzes Taken:\s*2/);
      expect(correctDiv).toHaveTextContent(/Correct Answers:\s*15\s*\/\s*25/);
    });
  });

  it('handles missing analytics document gracefully', async () => {
    onSnapshotMock.initialCall = true; // Prevent default data
    render(<Analytics />);
    const quizzesDiv = screen.getByText('Quizzes Taken:').parentElement!;
    const correctDiv = screen.getByText('Correct Answers:').parentElement!;
    // Simulate missing doc as the first snapshot after render
    act(() => {
      firestoreCallback({
        exists: () => false,
        data: () => ({}),
      });
    });
    await waitFor(() => {
      expect(quizzesDiv).toHaveTextContent(/Quizzes Taken:\s*0/);
      expect(correctDiv).toHaveTextContent(/Correct Answers:\s*0\s*\/\s*0/);
    });
    onSnapshotMock.initialCall = false; // Reset for other tests
  });
});
