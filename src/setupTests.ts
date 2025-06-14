import '@testing-library/jest-dom';

// Polyfill TextEncoder for Jest/react-router-dom v6+ tests
import { TextEncoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  // @ts-expect-error: Assigning Node.js TextEncoder to global for Jest/react-router-dom v6+ compatibility
  global.TextEncoder = TextEncoder;
}
