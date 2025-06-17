import { TextEncoder, TextDecoder } from 'util';
if (typeof globalThis.TextEncoder === 'undefined') {
  // @ts-expect-error: Assigning Node.js TextEncoder for Jest
  globalThis.TextEncoder = TextEncoder;
  // @ts-expect-error: Assigning Node.js TextDecoder for Jest
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
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/' }),
  };
});

test('renders main content', () => {
  render(<App />);
  expect(screen.getByText(/Massage/i)).toBeInTheDocument();
});

test('logs analytics event on app load', () => {
  const { mockLogEvent } = jest.requireMock('../hooks/useAnalytics');
  mockLogEvent.mockClear();
  render(<App />);
  expect(mockLogEvent).toHaveBeenCalledWith('app_loaded');
});
