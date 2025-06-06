export {};

declare global {
  interface Window {
    appState: {
      badges?: unknown[];
      [key: string]: unknown;
    };
    setupUI: () => void;
    fetchQuestions: () => Promise<unknown>;
    renderAccuracyChart: () => void;
    renderHistoryChart: () => void;
    renderMasteryHistoryChart: () => void;
    renderConfidenceChart: () => void;
    localStorageError?: boolean;
    setTestState: (patch: Record<string, unknown>) => void;
    /**
     * E2E badge sync globals for Playwright and badge context
     */
    __SYNC_BADGES__?: () => void | Promise<void>;
    __E2E_DEBUG_STATE__?: Record<string, unknown>;
    __E2E_TEST__?: boolean;
    badges?: unknown[];
    earnedBadges?: string[];
  }
}