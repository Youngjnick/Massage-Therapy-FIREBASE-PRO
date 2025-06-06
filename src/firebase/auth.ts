// @ts-ignore
import { auth } from "../firebase/indexFirebase.js";
// @ts-ignore
import { onAuthStateChanged, signInWithPhoneNumber, RecaptchaVerifier, User, ConfirmationResult, ApplicationVerifier } from "firebase/auth";
// @ts-ignore
import { onSnapshot, doc } from "firebase/firestore";
// @ts-ignore
import { firestoreDb } from "../firebase/indexFirebase.js";
// @ts-ignore
import { setUserBadges } from "../appState";
// @ts-ignore
import { mapUserBadgesToObjects } from "../utils/mapUserBadgesToObjects";
import { getAllBadges } from "../utils/badgeHelpers";
import { updateAllBadgeMirrors, dispatchE2EBadgesUpdated, assertBadgeStateConsistency } from "../utils/e2eBadgeSync";

declare global {
  interface Window {
    __E2E_BADGES__?: unknown; // match global.d.ts
    __E2E_BADGES_DEBUG__?: boolean;
    setE2EBadges?: (badges: string[]) => void;
    // PATCH: Allow E2E badge rerender callback for test sync
    forceE2EBadgeRerender?: () => void;
    recaptchaVerifier?: RecaptchaVerifier;
    clearE2EMockAuth?: () => void;
    printFullDebugState?: (label?: string) => void;
  }
}

// --- E2E TEST HOOK: Mock Firebase Auth user for Playwright E2E tests ---
let observeAuthStateImpl = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
// Remove unused variable warning
observeAuthStateImpl;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
if (typeof window !== "undefined" && localStorage.getItem("e2e-mock-auth")) {
  // Only run in browser and if test key is set
  const mockUser = {
    uid: "e2e-test-user",
    displayName: "E2E Test User",
    email: "e2e-test@example.com",
    photoURL: "/default-avatar.png",
    emailVerified: true,
    isAnonymous: false,
    providerData: [{
      providerId: "google.com",
      uid: "e2e-test-user",
      displayName: "E2E Test User",
      email: "e2e-test@example.com",
      photoURL: "/default-avatar.png",
    }],
    getIdToken: async () => "e2e-mock-token",
    _startProactiveRefresh: () => {},
    _stopProactiveRefresh: () => {},
    // Add required User properties as needed for tests
    metadata: {},
    refreshToken: "",
    tenantId: "",
    delete: async () => {},
    toJSON: () => ({}),
    reload: async () => {},
    // ...other User properties if needed
  } as unknown as User;
  // Patch observeAuthState to always call with mockUser
  observeAuthStateImpl = function(callback: (user: User | null) => void): () => void {
    setTimeout(() => {
      console.log("[E2E] observeAuthState called with mockUser", mockUser);
      callback(mockUser);
    }, 0);
    return () => {
      console.log("[E2E] observeAuthState unsubscribe called");
    };
  };
  window.__E2E_TEST__ = true;
  console.log("[E2E] __E2E_TEST__ set to true in auth.ts, before React entry");
  // --- PATCH: Wait for React E2E hook to attach before resolving E2E test state ---
  // --- E2E TEST HOOK: Playwright test utility ---
  // Wait for React E2E hook (__E2E_HOOK_ATTACHED) before proceeding with test assertions
  // Usage in Playwright: await page.evaluate(() => window.waitForE2EReactReady && window.waitForE2EReactReady());
  window.waitForE2EReactReady = async function(timeout = 10000, log = false, onReady) {
    const start = Date.now();
    let lastLog = 0;
    // If React is already ready, resolve immediately
    if (window.__E2E_HOOK_ATTACHED) {
      if (log) {
        console.log("[E2E] __E2E_HOOK_ATTACHED already set. appState:", window.appState);
      }
      window.__E2E_LAST_WAIT_DURATION = Date.now() - start;
      window.dispatchEvent(new Event("e2e-react-ready"));
      if (typeof onReady === "function") { onReady(); }
      await Promise.resolve();
      return;
    }
    while (!window.__E2E_HOOK_ATTACHED) {
      if (Date.now() - start > timeout) {
        // Extra debug info for E2E troubleshooting
        const attached = window.__E2E_HOOK_ATTACHED;
        const state = window.appState;
        throw new Error(
          "Timed out waiting for __E2E_HOOK_ATTACHED. attached=" + attached +
          ", appState=" + JSON.stringify(state) +
          ", url=" + window.location.href +
          ", dom=" + document.body.innerHTML.slice(0, 500)
        );
      }
      if (log && Date.now() - lastLog > 1000) {
        // Log progress every second if requested
        console.log("[E2E] Waiting for __E2E_HOOK_ATTACHED... appState:", window.appState);
        lastLog = Date.now();
      }
      await new Promise(r => setTimeout(r, 50));
    }
    if (log) {
      console.log("[E2E] __E2E_HOOK_ATTACHED detected. appState:", window.appState);
    }
    window.__E2E_LAST_WAIT_DURATION = Date.now() - start;
    window.dispatchEvent(new Event("e2e-react-ready"));
    if (typeof onReady === "function") { onReady(); }
    await Promise.resolve();
  };

  // Promise-based event waiter for Playwright: resolves when e2e-react-ready event fires
  window.waitForE2EReactReadyEvent = function(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out waiting for e2e-react-ready event")), timeout);
      window.addEventListener("e2e-react-ready", function handler() {
        clearTimeout(timer);
        window.removeEventListener("e2e-react-ready", handler);
        resolve();
      });
    });
  };

  // Utility to reset E2E state for test isolation
  window.resetE2ETestState = function() {
    window.__E2E_HOOK_ATTACHED = false;
    window.appState = {};
    window.__E2E_LAST_WAIT_DURATION = 0;
    // Add more resets as needed for your app
  };
  console.log("[E2E] Mock Firebase Auth user injected for E2E test");
}

// --- Utility: Deep diff for debugging ---
function deepDiff(a: unknown, b: unknown, path = ''): string[] {
  const diffs: string[] = [];
  if (typeof a !== typeof b) {
    diffs.push(`${path}: type mismatch (${typeof a} vs ${typeof b})`);
    return diffs;
  }
  if (typeof a !== 'object' || a === null || b === null) {
    if (a !== b) diffs.push(`${path}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
    return diffs;
  }
  const aKeys = Object.keys(a as object);
  const bKeys = Object.keys(b as object);
  for (const key of new Set([...aKeys, ...bKeys])) {
    if (!(key in (a as object))) diffs.push(`${path}.${key}: missing in a`);
    else if (!(key in (b as object))) diffs.push(`${path}.${key}: missing in b`);
    else diffs.push(...deepDiff((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], path ? `${path}.${key}` : key));
  }
  return diffs;
}

// --- PATCH: E2E badge state mocking ---
let listenToUserBadgesImpl: (userId: string) => void = function(userId) {
  const userDocRef = doc(firestoreDb, "users", userId);
  onSnapshot(userDocRef, (docSnap) => {
    const userData = docSnap.data() || {};
    const earnedBadgeIds = userData.earnedBadges || [];
    setUserBadges(earnedBadgeIds);
    // Optionally trigger a UI update here if needed
  });
};

if (typeof window !== "undefined" && window.__E2E_TEST__) {
  // Patch listenToUserBadges to use mock badge state in E2E
  listenToUserBadgesImpl = async function () {
    const earnedBadgeIds = Array.isArray(window.__E2E_BADGES__) ? window.__E2E_BADGES__ : [];
    await setUserBadges(earnedBadgeIds);
    if (!window.appState) window.appState = {};
    // Deep diff logging
    const prevAppState = JSON.parse(JSON.stringify(window.appState.badges || []));
    const prevBadges = JSON.parse(JSON.stringify(window.badges || []));
    let badgeObjs;
    try {
      const allBadges = await getAllBadges();
      badgeObjs = mapUserBadgesToObjects(earnedBadgeIds, allBadges).filter(b => b.earned);
    } catch {
      badgeObjs = earnedBadgeIds.map(id => ({ id, earned: true }));
    }
    window.appState.badges = badgeObjs;
    window.badges = [...badgeObjs];
    if (window.__E2E_DEBUG_STATE__) {
      window.__E2E_DEBUG_STATE__.badgesData = JSON.parse(JSON.stringify(badgeObjs));
    }
    // Log deep diffs
    if (window.__E2E_BADGES_DEBUG__) {
      const appStateDiff = deepDiff(prevAppState, window.appState.badges, 'appState.badges');
      const badgesDiff = deepDiff(prevBadges, window.badges, 'window.badges');
      if (appStateDiff.length || badgesDiff.length) {
        console.group('[E2E][BADGE DIFF] listenToUserBadgesImpl');
        if (appStateDiff.length) console.log('appState.badges diff:', appStateDiff);
        if (badgesDiff.length) console.log('window.badges diff:', badgesDiff);
        console.groupEnd();
      }
    }
    // Utility: Assert badge state consistency across all representations
    function assertBadgeStateConsistency() {
      if (typeof window === 'undefined') return;
      const a = JSON.stringify(window.appState && window.appState.badges ? window.appState.badges : []);
      const b = JSON.stringify(window.badges || []);
      const c = JSON.stringify(window.__E2E_DEBUG_STATE__ && window.__E2E_DEBUG_STATE__.badgesData ? window.__E2E_DEBUG_STATE__.badgesData : []);
      if (a !== b || a !== c) {
        console.warn('[E2E][BADGE STATE INCONSISTENCY]', { appState: a, badges: b, debugState: c });
      }
    }
    assertBadgeStateConsistency();
    window.dispatchEvent(new Event("e2e-badges-updated"));
    // --- PATCH: Force UI update for E2E badge sync ---
    if (typeof window.forceE2EBadgeRerender === 'function') {
      window.forceE2EBadgeRerender();
    }
    if (window.__E2E_BADGES_DEBUG__) {
      console.log("[E2E] listenToUserBadges mock called, badges:", earnedBadgeIds, "badgeObjs:", badgeObjs, "appState:", window.appState);
    }
  };
  // Utility for Playwright to set badges
  window.setE2EBadges = async function (badges) {
    window.__E2E_BADGES__ = badges;
    await setUserBadges(badges);
    if (!window.appState) window.appState = {};
    // Deep diff logging
    const prevAppState = JSON.parse(JSON.stringify(window.appState.badges || []));
    const prevBadges = JSON.parse(JSON.stringify(window.badges || []));
    let badgeObjs;
    try {
      const allBadges = await getAllBadges();
      badgeObjs = mapUserBadgesToObjects(badges, allBadges).filter(b => b.earned);
    } catch {
      badgeObjs = badges.map((id: string) => ({ id, earned: true }));
    }
    updateAllBadgeMirrors(badgeObjs);
    // Log deep diffs
    if (window.__E2E_BADGES_DEBUG__) {
      const appStateDiff = deepDiff(prevAppState, (window.appState && window.appState.badges) || [], 'appState.badges');
      const badgesDiff = deepDiff(prevBadges, window.badges || [], 'window.badges');
      if (appStateDiff.length || badgesDiff.length) {
        console.group('[E2E][BADGE DIFF] setE2EBadges');
        if (appStateDiff.length) console.log('appState.badges diff:', appStateDiff);
        if (badgesDiff.length) console.log('window.badges diff:', badgesDiff);
        console.groupEnd();
      }
    }
    assertBadgeStateConsistency();
    dispatchE2EBadgesUpdated();
    // --- PATCH: Force UI update for E2E badge sync ---
    if (typeof window.forceE2EBadgeRerender === 'function') {
      window.forceE2EBadgeRerender();
    }
    // --- PATCH: Always await __SYNC_BADGES__ to flush React context and all mirrors ---
    if (typeof window.__SYNC_BADGES__ === 'function') {
      await window.__SYNC_BADGES__();
    }
    if (window.__E2E_BADGES_DEBUG__) {
      console.log("[E2E] setE2EBadges called, badges:", badges, "badgeObjs:", badgeObjs, "appState:", window.appState);
    }
  };
}

// --- GLOBAL ERROR HANDLERS FOR DEBUGGING ---
if (typeof window !== 'undefined') {
  window.onerror = function(message, source, lineno, colno, error) {
    console.group('[GLOBAL ERROR]');
    console.error('Message:', message);
    console.error('Source:', source, 'Line:', lineno, 'Col:', colno);
    if (error && error.stack) console.error('Stack:', error.stack);
    if (window.appState) console.log('window.appState:', JSON.stringify(window.appState));
    if (window.badges) console.log('window.badges:', JSON.stringify(window.badges));
    if (window.__E2E_DEBUG_STATE__) console.log('window.__E2E_DEBUG_STATE__:', JSON.stringify(window.__E2E_DEBUG_STATE__));
    // DOM snapshot
    try {
      console.log('DOM snapshot:', document.body.innerHTML.slice(0, 1000));
      console.log('URL:', window.location.href);
    } catch {}
    console.groupEnd();
  };
  window.onunhandledrejection = function(event) {
    console.group('[UNHANDLED PROMISE REJECTION]');
    console.error('Reason:', event.reason);
    if (window.appState) console.log('window.appState:', JSON.stringify(window.appState));
    if (window.badges) console.log('window.badges:', JSON.stringify(window.badges));
    if (window.__E2E_DEBUG_STATE__) console.log('window.__E2E_DEBUG_STATE__:', JSON.stringify(window.__E2E_DEBUG_STATE__));
    // DOM snapshot
    try {
      console.log('DOM snapshot:', document.body.innerHTML.slice(0, 1000));
      console.log('URL:', window.location.href);
    } catch {}
    console.groupEnd();
  };
  // Expose a debug utility for E2E/manual inspection
  window.printFullDebugState = function(label = '') {
    console.group(`[E2E][DEBUG STATE] ${label}`);
    console.log('window.appState:', JSON.stringify(window.appState));
    console.log('window.badges:', JSON.stringify(window.badges));
    console.log('window.__E2E_DEBUG_STATE__:', JSON.stringify(window.__E2E_DEBUG_STATE__));
    if (window.earnedBadges) console.log('window.earnedBadges:', JSON.stringify(window.earnedBadges));
    console.groupEnd();
  };
}

// --- PHONE AUTH ---
export async function signInWithPhone(phoneNumber: string, appVerifier: ApplicationVerifier): Promise<ConfirmationResult> {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return confirmationResult;
  } catch (error) {
    console.error("Phone sign-in error:", error);
    throw error;
  }
}

// After user signs in and userData is loaded from Firestore:
// const earnedBadgeIds = userData.earnedBadges || [];
// window.appState = window.appState || {};
// window.appState.badges = mapUserBadgesToObjects(earnedBadgeIds, badges);

// Example: Listen for real-time updates to the user's badge data
export function listenToUserBadges(userId: string): void {
  return listenToUserBadgesImpl(userId);
}

// Utility for E2E: clear mock auth state
window.clearE2EMockAuth = function(): void {
  localStorage.removeItem("e2e-mock-auth");
  window.__E2E_TEST__ = false;
  console.log("[E2E] Cleared e2e-mock-auth and __E2E_TEST__");
};