// E2E PATCH: Set E2E globals as early as possible for robust Playwright badge sync
if (typeof window !== "undefined") {
  // Only set if not already set (allow Playwright to override if needed)
  if (!window.__E2E_TEST__) window.__E2E_TEST__ = true;
  if (!window.__E2E_BADGES__) {
    window.__E2E_BADGES__ = [
      { id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'Badge 1' },
      { id: 'second', name: 'Second Badge', earned: true, image: '/badges/default2.png', description: 'Badge 2' },
      { id: 'third', name: 'Third Badge', earned: false, image: '/badges/default3.png', description: 'Badge 3' }
    ];
  }
  // Debug log to confirm patch runs in E2E
  console.log("[E2E PATCH] Defining window.__SYNC_BADGES__ as no-op");
  window.__SYNC_BADGES__ = () => {};
}
