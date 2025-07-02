// Static mocks for Firebase Auth and Firestore
jest.mock('../firebaseClient', () => ({ db: {} }));
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: (auth: any, cb: any) => {
    cb({ uid: 'test-user' });
    return jest.fn();
  },
}));
const mockDoc = jest.fn();
jest.mock('firebase/firestore', () => {
  return {
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    doc: (...args: any[]) => mockDoc(...args),
    onSnapshot: (ref: unknown, cb: (_unused: any) => void) => {
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
      return jest.fn();
    },
  };
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import Analytics from '../pages/Analytics';

describe('Analytics integration', () => {
  beforeEach(() => {
    mockDoc.mockClear();
  });
  it('displays user stats: quizzes taken, correct answers, accuracy, streak, badges', async () => {
    render(<Analytics />);
    // Check for labels and values using toHaveTextContent
    const quizzesDiv = (await screen.findByText('Quizzes Taken:')).parentElement!;
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
});
