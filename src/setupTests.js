/* global jest */
// Mock import.meta.env for Jest so Vite-specific code doesn't break tests
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        BASE_URL: '/',
      },
    },
  },
});

// Mock getBaseUrl for all tests so import.meta.env is never called in Jest
jest.mock('../utils/getBaseUrl', () => ({
  getBaseUrl: () => '/',
}));
