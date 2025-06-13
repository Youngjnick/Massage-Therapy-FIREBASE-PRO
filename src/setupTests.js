import { TextEncoder, TextDecoder } from 'util';

// Use globalThis for compatibility in both Node and browser-like environments
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}

import '@testing-library/jest-dom';
