import { TextEncoder, TextDecoder } from 'util';
if (typeof globalThis.TextEncoder === 'undefined') {
  // @ts-ignore
  globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
  // @ts-ignore
  globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}

jest.mock('../hooks/useAnalytics', () => {
  const mockLogEvent = jest.fn();
  return {
    useAnalytics: () => ({ logEvent: mockLogEvent }),
    mockLogEvent,
  };
});
jest.mock('../questions', () => {
  return {
    getQuestions: jest.fn(() => Promise.reject(new Error('fail'))), // Always fail for all tests
  };
});
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/' }),
  };
});

test('renders main content', async () => {
  render(<App />);
  // Wait for loading spinner to disappear
  await waitFor(() => {
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
  });
  // Use getAllByText to avoid multiple match error
  expect(screen.getAllByText(/Massage/i).length).toBeGreaterThan(0);
});

test('logs analytics event on app load', () => {
  const { mockLogEvent } = jest.requireMock('../hooks/useAnalytics');
  mockLogEvent.mockClear();
  render(<App />);
  expect(mockLogEvent).toHaveBeenCalledWith('app_loaded');
});
