import { TextEncoder, TextDecoder } from 'util';
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

jest.mock('../hooks/useAnalytics', () => {
  const mockLogEvent = jest.fn();
  return {
    useAnalytics: () => ({ logEvent: mockLogEvent }),
    mockLogEvent,
  };
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
jest.mock('vite', () => ({
  env: { BASE_URL: '/' }
}));
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/' }),
  };
});

globalThis.import = { meta: { env: { BASE_URL: '/' } } };

test('renders main content', async () => {
  render(<App />);
  // Wait for the Quiz link to appear, indicating main content is loaded
  const quizLinks = await screen.findAllByRole('link', { name: /Quiz/i });
  expect(quizLinks.length).toBeGreaterThan(0);
  // Use getAllByText to avoid multiple match error
  expect(screen.getAllByText(/Massage/i).length).toBeGreaterThan(0);
});

test('logs analytics event on app load', () => {
  const { mockLogEvent } = jest.requireMock('../hooks/useAnalytics');
  mockLogEvent.mockClear();
  render(<App />);
  expect(mockLogEvent).toHaveBeenCalledWith('app_loaded');
});
