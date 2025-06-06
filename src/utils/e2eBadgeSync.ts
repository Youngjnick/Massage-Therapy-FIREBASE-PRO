// filepath: src/utils/e2eBadgeSync.ts
import type { Badge } from "./badgeHelpers";

/**
 * Updates all badge state mirrors for E2E: window.appState.badges, window.badges, window.__E2E_DEBUG_STATE__.badgesData
 */
export function updateAllBadgeMirrors(badgeObjs: Badge[]) {
  if (!window.appState) window.appState = {};
  window.appState.badges = badgeObjs;
  window.badges = [...badgeObjs];
  if (!window.__E2E_DEBUG_STATE__) window.__E2E_DEBUG_STATE__ = {};
  window.__E2E_DEBUG_STATE__.badgesData = JSON.parse(JSON.stringify(badgeObjs));
}

/**
 * Dispatches the e2e-badges-updated event for robust E2E badge sync
 */
export function dispatchE2EBadgesUpdated() {
  window.dispatchEvent(new Event("e2e-badges-updated"));
}

/**
 * Asserts badge state consistency across all mirrors
 */
export function assertBadgeStateConsistency() {
  if (typeof window === 'undefined') return;
  const a = JSON.stringify(window.appState && window.appState.badges ? window.appState.badges : []);
  const b = JSON.stringify(window.badges || []);
  const c = JSON.stringify(window.__E2E_DEBUG_STATE__ && window.__E2E_DEBUG_STATE__.badgesData ? window.__E2E_DEBUG_STATE__.badgesData : []);
  if (a !== b || a !== c) {
    console.warn('[E2E][BADGE STATE INCONSISTENCY]', { appState: a, badges: b, debugState: c });
  }
}
