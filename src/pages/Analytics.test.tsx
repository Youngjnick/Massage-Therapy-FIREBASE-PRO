import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

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
jest.mock('firebase/firestore', () => {
  return {
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    doc: jest.fn(() => ({})),
    onSnapshot: (ref: unknown, cb: (snapshot: any) => void) => {
      firestoreCallback = cb;
      cb({
        exists: () => true,
        data: () => ({
          quizzesTaken: 5,
          correctAnswers: 40,
          totalQuestions: 50,
          accuracy: 80,
          streak: 3,
          badges: 2,
        }),
      });
      return jest.fn();
    },
  };
});

import Analytics from './Analytics';

describe('Analytics Page', () => {
  beforeEach(() => {
    // Always mock user as authenticated by default
    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'test-user' });
      return jest.fn();
    });
  });

  it('renders analytics stats for authenticated user', async () => {
    render(<Analytics />);
    expect(await screen.findByText('Quizzes Taken:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('40 / 50')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
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
    expect(await screen.findByText('Quizzes Taken:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    // Simulate Firestore update
    firestoreCallback({
      exists: () => true,
      data: () => ({
        quizzesTaken: 2,
        correctAnswers: 15,
        totalQuestions: 25,
        accuracy: 60,
        streak: 2,
        badges: 1,
      }),
    });
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    expect(screen.getByText('15 / 25')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('2 days')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
