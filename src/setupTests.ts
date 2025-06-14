import '@testing-library/jest-dom';

// Polyfill TextEncoder for Jest/react-router-dom v6+ tests
import { TextEncoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  // Assign a constructor function as expected by Jest/global
  global.TextEncoder = TextEncoder as typeof global.TextEncoder;
}

// Polyfill fetch for Jest/jsdom (Firebase Auth/Firestore)
import fetch, { Headers, Request, Response } from 'cross-fetch';
declare global {
  // Extend NodeJS.Global with fetch types for Jest polyfill
  // These are needed for Jest/jsdom + Firebase
  // Remove duplicate fetch declaration if present
  var Headers: typeof globalThis.Headers;
  var Request: typeof globalThis.Request;
  var Response: typeof globalThis.Response;
}
if (typeof global.fetch === 'undefined') {
  global.fetch = fetch;
  global.Headers = Headers;
  global.Request = Request;
  global.Response = Response;
}

// Set IS_REACT_ACT_ENVIRONMENT for React 18+ act() warnings in tests
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// No fetch polyfill needed for Node.js v18+ (global fetch is available)
