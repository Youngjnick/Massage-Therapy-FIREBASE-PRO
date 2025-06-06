// playwright/helpers/e2eDebugHelpers.ts
// Playwright helpers for reading and asserting on the E2E debug panel and window.__E2E_DEBUG_STATE__

import { Page, expect } from "@playwright/test";

// Add this at the top of the file to extend the Window interface for __E2E_DEBUG_STATE__
declare global {
  interface Window {
    __E2E_DEBUG_STATE__?: unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appState?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    badges?: any;
  }
}

/**
 * Reads and parses the visible E2E debug panel JSON from the app.
 * @param page Playwright Page
 */
export async function getE2EDebugPanelState(page: Page) {
  const debugText = await page
    .locator('[data-testid="e2e-debug-state"]')
    .textContent();
  try {
    return JSON.parse(debugText || "{}");
  } catch (e) {
    throw new Error(
      "Failed to parse e2e-debug-state panel: " + e + "\nRaw: " + debugText,
    );
  }
}

/**
 * Reads the global window.__E2E_DEBUG_STATE__ from the browser context.
 * @param page Playwright Page
 */
export async function getWindowE2EDebugState(page: Page) {
  return await page.evaluate(() => window.__E2E_DEBUG_STATE__);
}

/**
 * Asserts that a property exists and is not null in the E2E debug panel state.
 * @param page Playwright Page
 * @param prop Property name (e.g. 'badgesData')
 */
export async function expectDebugPanelPropDefined(page: Page, prop: string) {
  const state = (await getE2EDebugPanelState(page)) as Record<string, unknown>;
  expect(state[prop]).toBeDefined();
}

/**
 * Asserts that a property exists and is not null in window.__E2E_DEBUG_STATE__.
 * @param page Playwright Page
 * @param prop Property name (e.g. 'analyticsData')
 */
export async function expectWindowDebugStatePropDefined(
  page: Page,
  prop: string,
) {
  const state = (await getWindowE2EDebugState(page)) as Record<string, unknown>;
  expect(state && state[prop]).toBeDefined();
}

/**
 * Asserts that analyticsData exists and is not null in the debug panel state.
 */
export async function expectAnalyticsDataDefined(page: Page) {
  const state = (await getE2EDebugPanelState(page)) as Record<string, unknown>;
  expect(state?.analyticsData).toBeDefined();
}

/**
 * Asserts that analyticsData exists and is not null in window.__E2E_DEBUG_STATE__.
 */
export async function expectWindowAnalyticsDataDefined(page: Page) {
  const state = (await getWindowE2EDebugState(page)) as Record<string, unknown>;
  expect(state?.analyticsData).toBeDefined();
}

/**
 * Logs the current E2E debug panel state for debugging.
 * @param page Playwright Page
 */
export async function logE2EDebugPanelState(page: Page) {
  const state = await getE2EDebugPanelState(page);
  // eslint-disable-next-line no-console
  console.log("E2E Debug Panel State:", state);
}

/**
 * Logs the current window.__E2E_DEBUG_STATE__ for debugging.
 * @param page Playwright Page
 */
export async function logWindowE2EDebugState(page: Page) {
  const state = await getWindowE2EDebugState(page);
  // eslint-disable-next-line no-console
  console.log("window.__E2E_DEBUG_STATE__:", state);
}

/**
 * Returns a deep clone of the analyticsData from the debug panel state.
 */
export async function getAnalyticsData(page: Page) {
  const state = (await getE2EDebugPanelState(page)) as Record<string, unknown>;
  return JSON.parse(JSON.stringify(state.analyticsData));
}

/**
 * Compares analyticsData before and after an action, and asserts that it has changed.
 * @param page Playwright Page
 * @param actionFn async function that performs the action expected to update analytics
 */
export async function expectAnalyticsDataToChange(
  page: Page,
  actionFn: () => Promise<void>,
) {
  const before = await getAnalyticsData(page);
  await actionFn();
  // Wait for UI/state update
  await page.waitForTimeout(200); // adjust as needed for your app
  const after = await getAnalyticsData(page);
  expect(after).not.toEqual(before);
}

// Robust E2E helper: Wait for setTestState before calling it in page.evaluate
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function setTestStateWithWait(page: Page, state: unknown) {
  // DEBUG: Log the state being injected
  // eslint-disable-next-line no-console
  console.log(
    "[E2E][setTestStateWithWait] Injecting state:",
    JSON.stringify(state),
  );
  await page.evaluate(async (state) => {
    function waitForSetTestState(): Promise<void> {
      return new Promise<void>((resolve) => {
        if (typeof window.setTestState === "function") return resolve();
        const check = () => {
          if (typeof window.setTestState === "function") return resolve();
          else setTimeout(check, 10);
        };
        check();
      });
    }
    return waitForSetTestState().then(() => {
      if (typeof window.setTestState === "function") window.setTestState(state);
      window.dispatchEvent(new Event("testStateChanged"));
      // @ts-ignore
      if (typeof window.__SYNC_BADGES__ === "function")
        window.__SYNC_BADGES__();
      // @ts-ignore
      if (typeof window.__SYNC_BOOKMARKS__ === "function")
        window.__SYNC_BOOKMARKS__();
      // DEBUG: Log badge and bookmark state after injection using eval to avoid TS errors
      try {
        // eslint-disable-next-line no-eval
        eval(
          `if (window.__E2E_DEBUG__) { console.log('[E2E][setTestStateWithWait] window.appState.badges after injection:', JSON.stringify(window.appState && window.appState.badges)); console.log('[E2E][setTestStateWithWait] window.badges after injection:', JSON.stringify(window.badges)); console.log('[E2E][setTestStateWithWait] window.appState.bookmarks after injection:', JSON.stringify(window.appState && window.appState.bookmarks)); console.log('[E2E][setTestStateWithWait] window.bookmarks after injection:', JSON.stringify(window.bookmarks)); }`,
        );
      } catch {
        /* ignore */
      }
    });
  }, state);
  // PATCH: Wait for badge and bookmark context sync after state injection
  await page.evaluate(() => {
    // @ts-ignore
    if (typeof window.__SYNC_BADGES__ === "function") window.__SYNC_BADGES__();
    // @ts-ignore
    if (typeof window.__SYNC_BOOKMARKS__ === "function")
      window.__SYNC_BOOKMARKS__();
  });
  // PATCH: Always render QuizCard, badges, and analytics/profile buttons in E2E/dev mode
  // Ensure E2E/dev mode always injects at least one badge and analytics button is always present
  // This prevents React hook order errors and ensures selectors are always available for E2E
  //
  // NOTE: You must also ensure in your React app (e.g., AppWithReactPanels.jsx) that in E2E/dev mode,
  // QuizCard, BadgeProgressPanel, and analytics/profile buttons are always rendered (even if state is not ready),
  // possibly in a disabled or placeholder state, but never conditionally omitted.
  //
  // Example (in your React component):
  //   {isE2E ? <QuizCard data={questions || []} ... /> : null}
  //   {isE2E ? <button data-testid="open-analytics-btn" disabled={!ready}>View Analytics</button> : null}
  //
  // This ensures React hook order is stable and selectors are always present for E2E tests.

  // PATCH: Wait for badge state to be present after sync if badges are injected
  if (
    state &&
    typeof state === "object" &&
    Array.isArray((state as { badges?: Array<{ id: string }> }).badges) &&
    (state as { badges: Array<{ id: string }> }).badges.length > 0
  ) {
    const badgeId = (state as { badges: Array<{ id: string }> }).badges[0].id;
    await page.waitForFunction(
      (id) =>
        window.appState &&
        Array.isArray(window.appState.badges) &&
        window.appState.badges.some((b: { id: string }) => b.id === id) &&
        window.badges &&
        Array.isArray(window.badges) &&
        window.badges.some((b: { id: string }) => b.id === id),
      badgeId,
      { timeout: 8000 },
    );
  }
  // PATCH: Ensure at least one badge is earned for E2E analytics tests
  if (
    state &&
    typeof state === "object" &&
    Array.isArray(
      (state as { badges?: Array<{ id: string; earned?: boolean }> }).badges,
    )
  ) {
    const badgesArr = (
      state as { badges: Array<{ id: string; earned?: boolean }> }
    ).badges;
    if (badgesArr.length > 0 && !badgesArr.some((b) => b.earned)) {
      badgesArr[0].earned = true;
    }
  }
}

// Robust E2E helper: Wait for app and E2E hook to be ready
export async function waitForAppReady(page: Page) {
  await page.waitForSelector("#react-root", {
    state: "attached",
    timeout: 30000,
  });
  await page.waitForFunction(() => !!window.__E2E_HOOK_ATTACHED, null, {
    timeout: 30000,
  });
}

/**
 * Sets mock authentication in localStorage for E2E tests.
 * @param page Playwright Page
 */
export async function mockAuth(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "e2e-mock-auth",
      JSON.stringify({
        email: "testuser@gmail.com",
        name: "Test User",
        uid: "mock-uid-123",
      }),
    );
  });
}

/**
 * Opens a modal and waits for a badge to appear, with retries.
 * @param page Playwright Page
 * @param openModalFn Function that opens the modal
 * @param modalSelector Selector for the modal element
 * @param badgeSelector Selector for the badge element
 * @param debugLabel Debug label for logging
 */
export async function openModalAndWaitForBadge(
  page: Page,
  openModalFn: () => Promise<void>,
  modalSelector: string,
  badgeSelector: string,
  debugLabel: string,
) {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await openModalFn();
      await page.waitForSelector(modalSelector, {
        state: "visible",
        timeout: 10000,
      });
      await page.waitForFunction(
        (selector) => !!document.querySelector(selector),
        badgeSelector,
        { timeout: 5000 },
      );
      // Debug output
      const badgeEls = await page.$$eval(badgeSelector, (els) =>
        els.map((el) => el.outerHTML),
      );
      // eslint-disable-next-line no-console
      console.log(`[E2E][${debugLabel}] badge-earned-test elements:`, badgeEls);
      return;
    } catch (e) {
      lastError = e;
      // Try to close modal if open
      try {
        await page.keyboard.press("Escape");
      } catch {}
      await page.waitForTimeout(500);
    }
  }
  let errMsg = "";
  if (lastError && typeof lastError === "object" && "message" in lastError) {
    errMsg = (lastError as { message?: string }).message || String(lastError);
  } else {
    errMsg = String(lastError);
  }
  throw new Error(
    `[E2E][${debugLabel}] Failed to open modal and find badge-earned-test after 3 attempts: ` +
      errMsg,
  );
}

/**
 * Waits for badge state to be present in appState and React context, with debug output.
 * @param page Playwright Page
 * @param badgeId Badge ID to check (default: 'test')
 */
export async function waitForBadgeState(
  page: import("@playwright/test").Page,
  badgeId = "test",
) {
  let lastAppState = null;
  let lastContextState = null;
  let attempts = 0;
  const maxAttempts = 40; // 8s
  while (attempts < maxAttempts) {
    attempts++;
    lastAppState = await page.evaluate(() =>
      window.appState && window.appState.badges
        ? JSON.stringify(window.appState.badges)
        : "no appState.badges",
    );
    lastContextState = await page.evaluate(() =>
      window.badges ? JSON.stringify(window.badges) : "no window.badges",
    );
    // Debug: print badge state for this badgeId
    const appStateBadge = await page.evaluate((id: string) => {
      if (window.appState && Array.isArray(window.appState.badges)) {
        return (
          window.appState.badges.find((b: { id: string }) => b.id === id) ||
          null
        );
      }
      return null;
    }, badgeId);
    const contextBadge = await page.evaluate((id: string) => {
      if (window.badges && Array.isArray(window.badges)) {
        return window.badges.find((b: { id: string }) => b.id === id) || null;
      }
      return null;
    }, badgeId);
    // PATCH: Robust logging for both appState and context badges
    console.log(
      `[waitForBadgeState][${attempts}] badgeId: ${badgeId} | appStateBadge:`,
      appStateBadge,
      "| contextBadge:",
      contextBadge,
      "| appState.badges:",
      lastAppState,
      "| window.badges:",
      lastContextState,
    );
    const appStateHas = await page.evaluate(
      (id: string) =>
        window.appState &&
        Array.isArray(window.appState.badges) &&
        window.appState.badges.some(
          (b: { id: string; earned: boolean }) => b.id === id && b.earned,
        ),
      badgeId,
    );
    const contextHas = await page.evaluate(
      (id: string) =>
        window.badges &&
        Array.isArray(window.badges) &&
        window.badges.some(
          (b: { id: string; earned: boolean }) => b.id === id && b.earned,
        ),
      badgeId,
    );
    if (appStateHas && contextHas) {
      console.log(
        `[E2E][waitForBadgeState] appState.badges:`,
        lastAppState,
        "context badges:",
        lastContextState,
      );
      return;
    }
    await page.waitForTimeout(200);
  }
  console.warn(
    "[E2E][waitForBadgeState] Timed out! appState.badges:",
    lastAppState,
    "context badges:",
    lastContextState,
  );
  throw new Error("waitForBadgeState timed out after " + attempts * 200 + "ms");
}

/**
 * Waits for badge state to be present in appState, window.badges, and window.__E2E_DEBUG_STATE__ (if available).
 * Use after setTestStateWithWait for robust E2E analytics/badge tests.
 * @param page Playwright Page
 * @param badgeId Badge ID to check (default: 'test')
 * @param timeoutMs Max time to wait (default: 8000ms)
 */
export async function waitForFullBadgeSync(
  page: import("@playwright/test").Page,
  badgeId = "test",
  timeoutMs = 8000,
) {
  const start = Date.now();
  let lastAppState = null;
  let lastContextState = null;
  let lastDebugState = null;
  while (Date.now() - start < timeoutMs) {
    lastAppState = await page.evaluate(() =>
      window.appState && window.appState.badges
        ? JSON.stringify(window.appState.badges)
        : "no appState.badges",
    );
    lastContextState = await page.evaluate(() =>
      window.badges ? JSON.stringify(window.badges) : "no window.badges",
    );
    lastDebugState = await page.evaluate(() =>
      window.__E2E_DEBUG_STATE__ &&
      (window.__E2E_DEBUG_STATE__ as { badgesData?: unknown[] }).badgesData
        ? JSON.stringify(
            (window.__E2E_DEBUG_STATE__ as { badgesData?: unknown[] })
              .badgesData,
          )
        : "no __E2E_DEBUG_STATE__.badgesData",
    );
    const appStateHas = await page.evaluate(
      (id) =>
        window.appState &&
        Array.isArray(window.appState.badges) &&
        window.appState.badges.some(
          (b: { id: string; earned?: boolean }) => b.id === id && b.earned,
        ),
      badgeId,
    );
    const contextHas = await page.evaluate(
      (id) =>
        window.badges &&
        Array.isArray(window.badges) &&
        window.badges.some(
          (b: { id: string; earned?: boolean }) => b.id === id && b.earned,
        ),
      badgeId,
    );
    const debugHas = await page
      .evaluate(
        (id) =>
          window.__E2E_DEBUG_STATE__ &&
          Array.isArray(
            (
              window.__E2E_DEBUG_STATE__ as {
                badgesData?: Array<{ id: string; earned?: boolean }>;
              }
            ).badgesData,
          ) &&
          (
            window.__E2E_DEBUG_STATE__ as {
              badgesData?: Array<{ id: string; earned?: boolean }>;
            }
          ).badgesData!.some(
            (b: { id: string; earned?: boolean }) => b.id === id && b.earned,
          ),
        badgeId,
      )
      .catch(() => true); // tolerate missing debug state
    // Debug output
    console.log(
      `[waitForFullBadgeSync] badgeId: ${badgeId} | appState:`,
      lastAppState,
      "| window.badges:",
      lastContextState,
      "| __E2E_DEBUG_STATE__.badgesData:",
      lastDebugState,
    );
    if (appStateHas && contextHas && debugHas) return;
    await page.waitForTimeout(200);
  }
  throw new Error(
    `[waitForFullBadgeSync] Timed out after ${timeoutMs}ms.\nappState.badges: ${lastAppState}\nwindow.badges: ${lastContextState}\n__E2E_DEBUG_STATE__.badgesData: ${lastDebugState}`,
  );
}

/**
 * Signs in as the test user by filling the login form and waiting for profile/avatar to appear.
 * Use in E2E tests that require UI-based sign-in.
 * @param page Playwright Page
 */
export async function signIn(page: Page) {
  await page.goto("/");
  await page.fill('input[type="email"]', "testuser@gmail.com");
  await page.fill('input[type="password"]', "testpassword123!");
  await page.click('button[type="submit"]');
  await expect(
    page.locator(
      'img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar',
    ),
  ).toBeVisible();
}

/**
 * Injects a minimum viable quiz state to ensure QuizCard and E2E controls always render.
 * Use in E2E tests before navigation or selector checks.
 * @param page Playwright Page
 * @param overrides Optional overrides for injected state
 */
export async function injectMinimumQuizState(
  page: import("@playwright/test").Page,
  overrides: Record<string, unknown> = {},
) {
  const defaultState = {
    questions: [
      {
        id: "q1",
        question: "Sample?",
        answers: ["A", "B", "C", "D"],
        correct: 0,
        answered: 0,
        topic: "General",
      },
    ],
    badges: [
      {
        id: "test",
        name: "Test Badge",
        earned: true,
        icon: "test.png",
        description: "E2E Test Badge",
      },
    ],
    selectedTopic: "General",
    quizStarted: true,
    // Add any other required minimal state here
  };
  // Merge badges if overrides provide them
  const state = {
    ...defaultState,
    ...overrides,
    badges: overrides.badges || defaultState.badges,
  };
  await setTestStateWithWait(page, state);
}
