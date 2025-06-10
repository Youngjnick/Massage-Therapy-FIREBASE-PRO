import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

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
jest.mock('../utils/baseUrl', () => ({
  BASE_URL: '/',
}));

globalThis.import = { meta: { env: { BASE_URL: '/' } } };

test('renders main content', () => {
  render(<App />);
  expect(screen.getByText(/Massage/i)).toBeInTheDocument();
});
