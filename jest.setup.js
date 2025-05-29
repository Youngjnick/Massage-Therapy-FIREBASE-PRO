import '@testing-library/jest-dom';

// Global localStorage mock for all tests
let store = {};
global.localStorage = {
  getItem: jest.fn((key) => store[key] || null),
  setItem: jest.fn((key, value) => { store[key] = value; }),
  removeItem: jest.fn((key) => { delete store[key]; }),
  clear: jest.fn(() => { store = {}; }),
};

// Ensure jsdom environment for DOM APIs
if (typeof window !== "undefined") {
  window.localStorage = global.localStorage;
}

// Defensive: always ensure localStorage methods are jest.fn()
function ensureLocalStorageMocks() {
  ["getItem", "setItem", "removeItem", "clear"].forEach(fn => {
    if (typeof global.localStorage[fn] !== "function" || !('mock' in global.localStorage[fn])) {
      global.localStorage[fn] = jest.fn();
    }
  });
  if (typeof window !== "undefined" && window.localStorage) {
    ["getItem", "setItem", "removeItem", "clear"].forEach(fn => {
      if (typeof window.localStorage[fn] !== "function" || !('mock' in window.localStorage[fn])) {
        window.localStorage[fn] = jest.fn();
      }
    });
  }
}

beforeEach(() => {
  ensureLocalStorageMocks();
});

afterEach(() => {
  if (global.localStorage && typeof global.localStorage.clear === "function") {
    global.localStorage.clear();
  }
  if (typeof document !== "undefined") {
    document.body.innerHTML = "";
  }
});

// Global Firestore mock for all tests
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(() => ({})),
  getDocs: jest.fn(async () => ({ docs: [] })), // Return a valid snapshot
}));

// Global Auth mock for all tests
jest.mock("firebase/auth", () => {
  const actual = jest.requireActual("firebase/auth");
  const mockAuth = {
    onAuthStateChanged: jest.fn((auth, callback) => {
      // Always set as a function
      mockAuth.__onAuthStateChangedCallback = callback || (() => {});
      return () => {};
    }),
    // Add any other auth methods you use here
    getAuth: jest.fn(() => ({})),
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    GoogleAuthProvider: jest.fn(),
    __onAuthStateChangedCallback: () => {},
  };
  return mockAuth;
});

// Polyfill TextEncoder and TextDecoder for Jest/jsdom environment to fix ReferenceError. This is required for Chart.js and jsdom-based tests.
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

process.env.NODE_ENV = 'development';

// Mock getContext for canvas elements (Chart.js compatibility)
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = HTMLCanvasElement.prototype.getContext || function() {
    // Return a minimal mock context
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      arcTo: () => {},
      quadraticCurveTo: () => {},
      bezierCurveTo: () => {},
      isPointInPath: () => false,
      isPointInStroke: () => false,
      measureText: () => ({ width: 0 }),
      transform: () => {},
      setLineDash: () => {},
      getLineDash: () => [],
      // Add more as needed for Chart.js
    };
  };
}
