import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  // @ts-expect-error: Assigning Node.js TextEncoder to global for Jest
  global.TextEncoder = TextEncoder;
  // @ts-expect-error: Assigning Node.js TextDecoder to global for Jest
  global.TextDecoder = TextDecoder;
}
import '@testing-library/jest-dom';
