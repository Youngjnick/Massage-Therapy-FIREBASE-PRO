// eslint-disable-next-line @typescript-eslint/no-explicit-any
// TypeScript global declarations for E2E Playwright helpers
// Place this file in src/firebase/ and ensure your tsconfig.json includes it

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    waitForE2EReactReady?: (timeout?: number, log?: boolean, onReady?: () => void) => Promise<void>;
    waitForE2EReactReadyEvent?: (timeout?: number) => Promise<void>;
    resetE2ETestState?: () => void;
    __E2E_LAST_WAIT_DURATION?: number;
    __E2E_HOOK_ATTACHED?: boolean;
    __E2E_TEST__?: boolean;
    __FORCE_BOOKMARK_SYNC_ERROR__?: boolean;
    appState?: any;
    renderBookmarkedIndex?: () => void;
    localStorageError?: boolean;
    setTestState?: (state: any) => void;
    fetchQuestions?: () => Promise<any>;
  }
}

export {};
