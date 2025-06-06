import React from 'react';
import { render, screen } from '@testing-library/react';
import AnalyticsModal from '../AnalyticsModal';
import { AnalyticsProvider } from '../AnalyticsContext';
import { BadgeProvider } from '../BadgeContext';

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(() => jest.fn()), // returns a mock unsub function
}));
jest.mock('../firebase/indexFirebase.js', () => ({
  auth: {},
  firestoreDb: {},
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
}));
jest.mock('../utils/usePersistentState', () => {
  return () => [
    { correct: 1, total: 1, streak: 1, completed: 1, lastUpdated: 0 },
    jest.fn()
  ];
});
jest.mock('../firebase/helpersFirebase', () => require('../../__mocks__/firebase/helpersFirebase.js'));

describe('AnalyticsModal', () => {
  test('renders correctly', () => {
    render(
      <AnalyticsProvider>
        <BadgeProvider>
          <AnalyticsModal open={true} onClose={() => {}} analytics={{ correct: 1, total: 1, streak: 1, completed: 1, lastUpdated: 0 }} quizHistory={[]} masteryHistory={[]} errorMap={{}} questions={[{ id: 'q1', stats: { correct: 1, incorrect: 0 }, topic: 'A' }]} badges={[{ id: 'b1', name: 'Badge 1', earned: true }]} />
        </BadgeProvider>
      </AnalyticsProvider>
    );
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  test('placeholder', () => {
    expect(true).toBe(true);
  });
});