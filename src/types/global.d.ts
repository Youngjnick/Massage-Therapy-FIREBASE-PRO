/// <reference types="vite/client" />

interface Window {
  __E2E_TEST__?: boolean;
  __E2E_DEBUG__?: boolean;
  __SYNC_BADGES__?: () => void;
  appState?: {
    badges?: import('../utils/badgeHelpers').Badge[];
    bookmarks?: unknown[];
    [key: string]: unknown;
  };
  badges?: import('../utils/badgeHelpers').Badge[];
  earnedBadges?: string[];
  __E2E_DEBUG_STATE__?: {
    badgesData?: import('../utils/badgeHelpers').Badge[];
    bookmarksData?: unknown[];
    [key: string]: unknown;
  };
  __E2E_HOOK_ATTACHED?: boolean;
  waitForE2EReactReady?: (timeout?: number, log?: boolean, onReady?: () => void) => Promise<void>;
  waitForE2EReactReadyEvent?: (timeout?: number) => Promise<void>;
  resetE2ETestState?: () => void;
  __E2E_LAST_WAIT_DURATION?: number;
  __FORCE_BOOKMARK_SYNC_ERROR__?: boolean;
  renderBookmarkedIndex?: () => void;
  localStorageError?: boolean;
  setTestState?: (state: unknown) => void;
  fetchQuestions?: () => Promise<unknown>;
  // PATCH: Allow E2E badge rerender callback for test sync
  forceE2EBadgeRerender?: () => void;
  Chart?: typeof import('chart.js').Chart;
  firebase?: { auth?: { currentUser?: { uid?: string } } };
  // --- Analytics/E2E additions ---
  __E2E_ANALYTICS_PATCH?: {
    analytics?: unknown;
    quizHistory?: unknown;
    masteryHistory?: unknown;
    errorMap?: unknown;
  };
  __E2E_ANALYTICS_MODAL?: boolean;
  __FORCE_ANALYTICS_ERROR__?: boolean;
  __ANALYTICS_LOAD_ERROR__?: boolean;
  CYPRESS_E2E?: boolean;
  PLAYWRIGHT_E2E?: boolean;
  badgesData?: import('../utils/badgeHelpers').Badge[];
  __ERROR_BOUNDARY_FIREBASE_ERROR__?: string | boolean | Error | undefined;
  __ERROR_BOUNDARY_ERROR__?: string | boolean | Error | undefined;
  charts?: { [key: string]: import('chart.js').Chart };
  firestoreAnalytics?: unknown;
  lastAnalyticsSync?: number;
  bookmarks?: unknown;
  __REACT_SET_TEST_STATE__?: (patch: Record<string, unknown>) => void;
  __SHOW_BADGE_DETAILS_MODAL__?: (badge: import("../utils/badgeHelpers").Badge) => void;
  __E2E_QUESTIONS__?: unknown;
  __BADGE_LOAD_ERROR__?: string;
  __E2E_BADGES__?: unknown;
  __E2E_BADGES_EARNED?: unknown;
  analytics?: unknown;
}

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}
