import './e2e-badge-patch';

// app.ts - TypeScript migration of app.js
// This file provides E2E/test hooks, utility badge/question sync, and global error logging for the React app.

// --- E2E: Set hook as early as possible for Playwright ---
import { getAllBadges } from "./utils/badgeHelpers";
import { mapUserBadgesToObjects } from "./utils/mapUserBadgesToObjects";

// --- E2E/DEBUG/TEST HOOKS AND GLOBALS MIGRATED FROM app.js ---

// FORCE E2E FLAG FOR PLAYWRIGHT
// if (typeof window !== "undefined") {
//   window.__E2E_TEST__ = true;
//   // eslint-disable-next-line no-console
//   console.log("[E2E/DEBUG] window.__E2E_TEST__ forced true in app.ts");
// }

// E2E PATCH: Set appState.questions from window.__E2E_QUESTIONS__ before any imports
if (typeof window !== "undefined" && Array.isArray(window.__E2E_QUESTIONS__)) {
  window.appState = window.appState || {};
  (window.appState as { questions?: unknown[] }).questions = [...window.__E2E_QUESTIONS__];
  // eslint-disable-next-line no-console
  console.debug("[E2E] Patched appState.questions from window.__E2E_QUESTIONS__ before React import. Count:", Array.isArray(window.appState.questions) ? window.appState.questions.length : 0);
}

// E2E PATCH: Set appState.badges from window.__E2E_BADGES__ before any imports
if (typeof window !== "undefined" && Array.isArray(window.__E2E_BADGES__)) {
  window.appState = window.appState || {};
  window.appState.badges = [...window.__E2E_BADGES__];
  // eslint-disable-next-line no-console
  console.debug("[E2E] Patched appState.badges from window.__E2E_BADGES__ before React import. Count:", Array.isArray(window.appState.badges) ? window.appState.badges.length : 0);
  // Dispatch custom event for robust E2E sync
  window.dispatchEvent(new Event('e2e-badges-injected'));
}

// E2E TEST HOOK: Make setTestState available globally for Playwright E2E tests
if (
  typeof window !== "undefined" &&
  (import.meta.env?.MODE === "development" || import.meta.env?.VITE_E2E || window.__E2E_TEST__)
) {
  window.appState = window.appState || {};
  window.setTestState = async (state: unknown) => {
    if (!window.appState) window.appState = {};
    if (typeof state === 'object' && state && !Array.isArray(state)) {
      Object.assign(window.appState, state as Record<string, unknown>);
      // PATCH: Normalize badges array if present
      const s = state as Record<string, unknown>;
      if (s.badges && Array.isArray(s.badges)) {
        const allBadges = await getAllBadges();
        const earnedIds = s.badges.filter((b: unknown) => typeof b === 'object' && b && (b as { earned?: boolean }).earned).map((b: unknown) => (b as { id: string }).id);
        window.appState.badges = mapUserBadgesToObjects(earnedIds, allBadges).map((b) => {
          const override = (s.badges as { id: string }[]).find((e2eB) => e2eB.id === b.id);
          return override ? { ...b, ...override } : b;
        });
      }
      if (!Array.isArray(window.appState.badges)) window.appState.badges = [];
      window.badges = window.appState.badges ?? [];
      // PATCH: Sync E2E debug state for badges and bookmarks
      if (!window.__E2E_DEBUG_STATE__) window.__E2E_DEBUG_STATE__ = {};
      window.__E2E_DEBUG_STATE__.badgesData = Array.isArray(window.appState.badges) ? JSON.parse(JSON.stringify(window.appState.badges)) : [];
      window.__E2E_DEBUG_STATE__.bookmarksData = Array.isArray(window.appState.bookmarks) ? JSON.parse(JSON.stringify(window.appState.bookmarks)) : [];
      // If React-level setTestState exists, call it too
      if (typeof window.__REACT_SET_TEST_STATE__ === "function") {
        window.__REACT_SET_TEST_STATE__(state as Record<string, unknown>);
      }
      if (typeof window.dispatchEvent === "function") {
        window.dispatchEvent(new Event("testStateChanged"));
        window.dispatchEvent(new Event("badgesUpdated"));
      }
    }
  };
  // For debugging: log when the E2E hook is set
  // eslint-disable-next-line no-console
  console.log("[E2E] __E2E_HOOK_ATTACHED set by app.ts");
  window.badges = window.appState?.badges ?? [];
  window.addEventListener("testStateChanged", () => {
    window.badges = window.appState?.badges ?? [];
  });
  // eslint-disable-next-line no-console
  console.log("[E2E] window.setTestState attached on window");
  // --- FIX: Signal E2E readiness for Playwright ---
  window.__E2E_HOOK_ATTACHED = true;
}

// --- GLOBAL ERROR LOGGING FOR E2E/DEBUG ---
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    // eslint-disable-next-line no-console
    console.error("[E2E/DEBUG][window.onerror]", (e as ErrorEvent).error || (e as ErrorEvent).message || e);
  });
  window.addEventListener("unhandledrejection", (e) => {
    // eslint-disable-next-line no-console
    console.error("[E2E/DEBUG][window.onunhandledrejection]", (e as PromiseRejectionEvent).reason || e);
  });
}

// Global error handler for E2E debugging
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[E2E][GlobalError] Uncaught error:', event.error || event.message, event);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[E2E][GlobalError] Unhandled promise rejection:', event.reason, event);
  });
}

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  window.addEventListener("error", (event) => {
    // eslint-disable-next-line no-console
    console.error("[Global Error]", (event as ErrorEvent).message, (event as ErrorEvent).error);
  });
  window.addEventListener("unhandledrejection", (event) => {
    // eslint-disable-next-line no-console
    console.error("[Global UnhandledRejection]", (event as PromiseRejectionEvent).reason);
  });
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;
  const origDebug = console.debug;
  console.log = (...args) => { origLog("[AppLog]", ...args); };
  console.warn = (...args) => { origWarn("[AppWarn]", ...args); };
  console.error = (...args) => { origError("[AppError]", ...args); };
  console.debug = (...args) => { origDebug("[AppDebug]", ...args); };
}

// --- Confirm app.ts entry file execution ---
console.log("[E2E] app.ts loaded at top");
(window as unknown as Record<string, unknown>)['__E2E_IMPORT_ERROR__'] = undefined;

// --- Mount React app (ensure BadgeProvider and all context are mounted) ---
import './components/react-entry'; // eslint-disable-line import/first -- React entry must be imported after E2E patching for test reliability
