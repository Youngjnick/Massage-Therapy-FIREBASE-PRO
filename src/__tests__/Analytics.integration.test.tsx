// Static mocks for Firebase Auth and Firestore
jest.mock('../firebaseClient', () => ({ db: {} }));
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: (auth: any, cb: any) => {
    cb({ uid: 'test-user' });
    return jest.fn();
  },
}));
jest.mock('firebase/firestore', () => {
  return {
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    doc: jest.fn(() => ({})),
    onSnapshot: (ref: unknown, cb: (snapshot: any) => void) => {
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

import React from 'react';
import { render, screen } from '@testing-library/react';
import Analytics from '../pages/Analytics';

describe('Analytics integration', () => {
  it('displays user stats: quizzes taken, correct answers, accuracy, streak, badges', async () => {
    render(<Analytics />);
    expect(await screen.findByText(/Quizzes Taken:/)).toBeInTheDocument();
    expect(screen.getByText(/Correct Answers:/)).toBeInTheDocument();
    expect(screen.getByText(/Accuracy:/)).toBeInTheDocument();
    expect(screen.getByText(/Current Streak:/)).toBeInTheDocument();
    expect(screen.getByText(/Badges Earned:/)).toBeInTheDocument();
  });
});
