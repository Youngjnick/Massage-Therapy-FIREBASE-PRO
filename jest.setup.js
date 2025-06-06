// eslint-disable-next-line quotes
import "@testing-library/jest-dom";

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
    if (typeof global.localStorage[fn] !== "function" || !("mock" in global.localStorage[fn])) {
      global.localStorage[fn] = jest.fn();
    }
  });
  if (typeof window !== "undefined" && window.localStorage) {
    ["getItem", "setItem", "removeItem", "clear"].forEach(fn => {
      if (typeof window.localStorage[fn] !== "function" || !("mock" in window.localStorage[fn])) {
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
  const actual = jest.requireActual("firebase/auth"); // eslint-disable-line no-unused-vars
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
if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// eslint-disable-next-line quotes
process.env = { ...process.env, ...{ VITE_E2E: "true", MODE: "test" } };

// Mock getContext for canvas elements (Chart.js compatibility)
if (typeof HTMLCanvasElement !== "undefined") {
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

// Mock canvas getContext for Chart.js
if (typeof window !== "undefined") {
  HTMLCanvasElement.prototype.getContext = HTMLCanvasElement.prototype.getContext || jest.fn(() => ({
    // Provide minimal mock for 2d context
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: [] })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => []),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    arcTo: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  }));
}

// --- Chart.js and canvas mocks for test stability ---
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = jest.fn(function(type) {
    if (type === "2d") {
      return {
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        getImageData: jest.fn(() => ({ data: [] })),
        putImageData: jest.fn(),
        createImageData: jest.fn(() => []),
        setTransform: jest.fn(),
        drawImage: jest.fn(),
        save: jest.fn(),
        fillText: jest.fn(),
        restore: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        stroke: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        rotate: jest.fn(),
        arc: jest.fn(),
        arcTo: jest.fn(),
        quadraticCurveTo: jest.fn(),
        bezierCurveTo: jest.fn(),
        isPointInPath: jest.fn(() => false),
        isPointInStroke: jest.fn(() => false),
        measureText: jest.fn(() => ({ width: 0 })),
        transform: jest.fn(),
        setLineDash: jest.fn(),
        getLineDash: jest.fn(() => []),
        rect: jest.fn(),
        clip: jest.fn(),
      };
    }
    return null;
  });
}

// Mock import.meta.env for Jest
if (typeof global.import === "undefined") {
  global.import = { meta: { env: {} } };
}
global.import.meta.env = {
  VITE_API_URL: "http://localhost",
  // Add other env vars as needed
};

// eslint-disable-next-line quotes
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// eslint-disable-next-line quotes
Object.defineProperty(window, "scrollTo", { value: () => {}, writable: true });

// eslint-disable-next-line quotes
Object.defineProperty(window, "ResizeObserver", { value: class { observe() {} unobserve() {} disconnect() {} }, writable: true });

// eslint-disable-next-line quotes
Object.defineProperty(global, "TextEncoder", { value: require("util").TextEncoder, writable: true });

// eslint-disable-next-line quotes
Object.defineProperty(global, "TextDecoder", { value: require("util").TextDecoder, writable: true });

// eslint-disable-next-line quotes
window.HTMLElement.prototype.scrollIntoView = window.HTMLElement.prototype.scrollIntoView || function() {};

// eslint-disable-next-line quotes
window.HTMLElement.prototype.releasePointerCapture = window.HTMLElement.prototype.releasePointerCapture || function() {};
