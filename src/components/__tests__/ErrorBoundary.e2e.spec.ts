import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('ErrorBoundary fallback UI is shown on error', async ({ page }) => {
  await page.goto('/');
  // Simulate a badge error by injecting a global error flag
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
  });
  // Reload to trigger error boundary
  await page.reload();
  // Wait for error boundary fallback UI
  const alert = page.locator('[role="alert"]');
  await expect(alert).toContainText('Something went wrong');
  // Accessibility: alert should be visible and focusable
  await expect(alert).toBeVisible();
  await alert.focus();
  await expect(alert).toBeFocused();
  // Accessibility snapshot
  const alertHandle = await alert.elementHandle();
  if (alertHandle) {
    const snapshot = await page.accessibility.snapshot({ root: alertHandle });
    expect(snapshot).toMatchObject({ role: 'alert', name: expect.stringContaining('Something went wrong') });
  }
  // Report this issue button
  const reportBtn = page.getByRole('button', { name: /report this issue/i });
  await expect(reportBtn).toBeVisible();
  await reportBtn.focus();
  await expect(reportBtn).toBeFocused();
  await reportBtn.click();
  // Feedback form appears
  const feedbackForm = page.getByRole('alertdialog');
  await expect(feedbackForm).toBeVisible();
  await page.getByLabel('Describe what happened').fill('Test feedback from E2E');
  await page.getByRole('button', { name: /submit/i }).click();
  // Form closes after submit
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

test('ErrorBoundary fallback UI recovers when error is cleared', async ({ page }) => {
  await page.goto('/');
  // Simulate error
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
  });
  await page.reload();
  await expect(page.locator('[role="alert"]')).toContainText('Something went wrong');
  // Remove error and reload
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = false;
  });
  await page.reload();
  // Fallback UI should be gone, normal UI should be present
  await expect(page.locator('[role="alert"]')).toHaveCount(0);
  // Example: check for a badge card or main UI element
  await expect(page.locator('[data-testid^="badge-earned-"]')).toBeVisible();
  // ARIA live region for recovery (visually hidden, but present in accessibility tree)
  const liveRegion = page.locator('[aria-live]');
  if (await liveRegion.count()) {
    const liveHandle = await liveRegion.first().elementHandle();
    if (liveHandle) {
      const recoverySnapshot = await page.accessibility.snapshot({ root: liveHandle });
      expect(recoverySnapshot).toMatchObject({ role: 'status' });
    }
  }
});

test('ErrorBoundary fallback UI is fully keyboard accessible', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
  });
  await page.reload();
  // Tab to alert
  await page.keyboard.press('Tab');
  const alert = page.locator('[role="alert"]');
  await expect(alert).toBeFocused();
  // Tab to report button
  await page.keyboard.press('Tab');
  const reportBtn = page.getByRole('button', { name: /report this issue/i });
  await expect(reportBtn).toBeFocused();
  // Enter to open feedback dialog
  await page.keyboard.press('Enter');
  const feedbackForm = page.getByRole('alertdialog');
  await expect(feedbackForm).toBeVisible();
  // Escape to close dialog
  await page.keyboard.press('Escape');
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

test('ErrorBoundary renders custom fallback', async ({ page }) => {
  // This test assumes you have a route/component that uses ErrorBoundary with a custom fallback
  // e.g., /custom-fallback-test
  await page.goto('/custom-fallback-test');
  // Simulate a badge error by injecting a global error flag
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
  });
  // Reload to trigger error boundary
  await page.reload();
  // Wait for custom error boundary fallback UI
  await expect(page.getByText(/custom fallback/i)).toBeVisible();
});

test('Multiple ErrorBoundaries show independent fallback UIs and recover independently', async ({ page }) => {
  // This assumes two panels (e.g., badges and analytics) each have their own ErrorBoundary and can be forced to error independently
  await page.goto('/');
  // Simulate errors in both panels
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean, __FORCE_ANALYTICS_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
    (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean, __FORCE_ANALYTICS_ERROR__?: boolean }).__FORCE_ANALYTICS_ERROR__ = true;
  });
  await page.reload();
  // Both fallback UIs should be visible
  const alerts = page.locator('[role="alert"]');
  await expect(alerts).toHaveCount(2);
  // Each should have a feedback button
  await expect(page.getByRole('button', { name: /report this issue/i })).toHaveCount(2);
  // Recover only badge error
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = false;
  });
  await page.reload();
  // One fallback should remain (analytics)
  await expect(alerts).toHaveCount(1);
  // Recover analytics error
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_ANALYTICS_ERROR__?: boolean }).__FORCE_ANALYTICS_ERROR__ = false;
  });
  await page.reload();
  // No fallback UIs should remain
  await expect(alerts).toHaveCount(0);
  // Main UI should be present
  await expect(page.locator('[data-testid^="badge-earned-"]')).toBeVisible();
});

test('Feedback form shows error on submission failure and allows retry', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
  });
  await page.reload();
  // Open feedback form
  await page.getByRole('button', { name: /report this issue/i }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  // Intercept feedback POST and force error
  await page.route('**/feedback*', route => route.fulfill({ status: 500, body: 'Server error' }));
  await page.getByLabel('Describe what happened').fill('Test feedback error');
  await page.getByRole('button', { name: /submit/i }).click();
  // Error message should appear
  await expect(page.getByText(/could not submit|error/i)).toBeVisible();
  // Form should remain open for retry
  await expect(page.getByRole('alertdialog')).toBeVisible();
  // Remove route, retry with success
  await page.unroute('**/feedback*');
  await page.route('**/feedback*', route => route.fulfill({ status: 200, body: '{}' }));
  await page.getByRole('button', { name: /submit/i }).click();
  // Form closes after success
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

test('ErrorBoundary fallback UI visual regression', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
  });
  await page.reload();
  // Wait for fallback UI
  await expect(page.locator('[role="alert"]')).toBeVisible();
  // Take screenshot for visual regression
  await expect(page).toHaveScreenshot('error-boundary-fallback.png');
});

test('AnalyticsModal ErrorBoundary fallback UI, feedback, recovery, and visual regression', async ({ page }) => {
  // Open analytics modal
  await page.goto('/');
  // Simulate analytics error
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_ANALYTICS_ERROR__?: boolean }).__FORCE_ANALYTICS_ERROR__ = true;
  });
  // Open analytics modal (assume button exists)
  await page.getByTestId('open-analytics-modal-btn').click();
  // Fallback UI should appear inside modal
  const modalAlert = page.locator('.modal [role="alert"]');
  await expect(modalAlert).toBeVisible();
  // Accessibility snapshot
  const alertHandle = await modalAlert.elementHandle();
  if (alertHandle) {
    const snapshot = await page.accessibility.snapshot({ root: alertHandle });
    expect(snapshot).toMatchObject({ role: 'alert' });
  }
  // Feedback form in modal
  await page.getByRole('button', { name: /report this issue/i }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  // Simulate feedback error
  await page.route('**/feedback*', route => route.fulfill({ status: 500, body: 'Server error' }));
  await page.getByLabel('Describe what happened').fill('Analytics modal feedback error');
  await page.getByRole('button', { name: /submit/i }).click();
  await expect(page.getByText(/could not submit|error/i)).toBeVisible();
  // Retry with success
  await page.unroute('**/feedback*');
  await page.route('**/feedback*', route => route.fulfill({ status: 200, body: '{}' }));
  await page.getByRole('button', { name: /submit/i }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  // Recovery: clear error and reopen modal
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_ANALYTICS_ERROR__?: boolean }).__FORCE_ANALYTICS_ERROR__ = false;
  });
  await page.getByTestId('close-analytics-modal-btn').click();
  await page.getByTestId('open-analytics-modal-btn').click();
  // Fallback UI should be gone, normal analytics UI should be present
  await expect(page.locator('.modal [role="alert"]')).toHaveCount(0);
  await expect(page.getByTestId('analytics-stats')).toBeVisible();
  // Visual regression
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_ANALYTICS_ERROR__?: boolean }).__FORCE_ANALYTICS_ERROR__ = true;
  });
  await page.getByTestId('close-analytics-modal-btn').click();
  await page.getByTestId('open-analytics-modal-btn').click();
  await expect(page.locator('.modal [role="alert"]')).toBeVisible();
  await expect(page).toHaveScreenshot('analytics-modal-error-fallback.png');
});

test('ProfileModal ErrorBoundary fallback UI, feedback, and recovery', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_PROFILE_ERROR__?: boolean }).__FORCE_PROFILE_ERROR__ = true;
  });
  await page.getByTestId('open-profile-modal-btn').click();
  const modalAlert = page.locator('.modal [role="alert"]');
  await expect(modalAlert).toBeVisible();
  await page.getByRole('button', { name: /report this issue/i }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByLabel('Describe what happened').fill('Profile modal feedback');
  await page.getByRole('button', { name: /submit/i }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  // Recovery
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_PROFILE_ERROR__?: boolean }).__FORCE_PROFILE_ERROR__ = false;
  });
  await page.getByTestId('close-profile-modal-btn').click();
  await page.getByTestId('open-profile-modal-btn').click();
  await expect(page.locator('.modal [role="alert"]')).toHaveCount(0);
  await expect(page.getByTestId('profile-main')).toBeVisible();
});

test('SmartLearningModal and SettingsModal ErrorBoundary fallback UI, feedback, and recovery', async ({ page }) => {
  await page.goto('/');
  // SmartLearningModal
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_SMARTLEARNING_ERROR__?: boolean }).__FORCE_SMARTLEARNING_ERROR__ = true;
  });
  await page.getByTestId('open-smartlearning-modal-btn').click();
  await expect(page.locator('.modal [role="alert"]')).toBeVisible();
  await page.getByRole('button', { name: /report this issue/i }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByLabel('Describe what happened').fill('SmartLearning feedback');
  await page.getByRole('button', { name: /submit/i }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_SMARTLEARNING_ERROR__?: boolean }).__FORCE_SMARTLEARNING_ERROR__ = false;
  });
  await page.getByTestId('close-smartlearning-modal-btn').click();
  await page.getByTestId('open-smartlearning-modal-btn').click();
  await expect(page.locator('.modal [role="alert"]')).toHaveCount(0);
  await expect(page.getByTestId('smartlearning-main')).toBeVisible();
  // SettingsModal
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_SETTINGS_ERROR__?: boolean }).__FORCE_SETTINGS_ERROR__ = true;
  });
  await page.getByTestId('open-settings-modal-btn').click();
  await expect(page.locator('.modal [role="alert"]')).toBeVisible();
  await page.getByRole('button', { name: /report this issue/i }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByLabel('Describe what happened').fill('Settings feedback');
  await page.getByRole('button', { name: /submit/i }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_SETTINGS_ERROR__?: boolean }).__FORCE_SETTINGS_ERROR__ = false;
  });
  await page.getByTestId('close-settings-modal-btn').click();
  await page.getByTestId('open-settings-modal-btn').click();
  await expect(page.locator('.modal [role="alert"]')).toHaveCount(0);
  await expect(page.getByTestId('settings-main')).toBeVisible();
});

test('AnalyticsModal ErrorBoundary fallback UI has correct tab order, focus trap, ARIA live, and roles/labels', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_ANALYTICS_ERROR__?: boolean }).__FORCE_ANALYTICS_ERROR__ = true;
  });
  await page.getByTestId('open-analytics-modal-btn').click();
  // Fallback UI should appear inside modal
  const modalAlert = page.locator('.modal [role="alert"]');
  await expect(modalAlert).toBeVisible();
  // Focus should be on alert or first focusable element
  await expect(modalAlert).toBeFocused();
  // Tab through all focusable elements in modal (alert, report button, close button, etc.)
  const focusable = [
    modalAlert,
    page.getByRole('button', { name: /report this issue/i }),
    page.getByRole('button', { name: /close|cerrar|fermer/i }) // support i18n close button
  ];
  for (let i = 0; i < focusable.length; i++) {
    await page.keyboard.press('Tab');
    await expect(focusable[(i + 1) % focusable.length]).toBeFocused();
  }
  // Shift+Tab cycles backwards
  for (let i = focusable.length; i > 0; i--) {
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await expect(focusable[(i - 1 + focusable.length) % focusable.length]).toBeFocused();
  }
  // Open feedback form and check focus trap
  await page.getByRole('button', { name: /report this issue/i }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  // Tab through feedback form (textarea, submit, cancel/close)
  const feedbackFields = [
    page.getByLabel(/describe what happened/i),
    page.getByRole('button', { name: /submit/i }),
    page.getByRole('button', { name: /cancel|close|cerrar|fermer/i })
  ];
  for (let i = 0; i < feedbackFields.length; i++) {
    await page.keyboard.press('Tab');
    await expect(feedbackFields[(i + 1) % feedbackFields.length]).toBeFocused();
  }
  // Shift+Tab cycles backwards in dialog
  for (let i = feedbackFields.length; i > 0; i--) {
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await expect(feedbackFields[(i - 1 + feedbackFields.length) % feedbackFields.length]).toBeFocused();
  }
  // ARIA live region announces error
  const liveRegion = page.locator('[aria-live]');
  if (await liveRegion.count()) {
    const liveHandle = await liveRegion.first().elementHandle();
    if (liveHandle) {
      const snapshot = await page.accessibility.snapshot({ root: liveHandle });
      expect(snapshot).toMatchObject({ role: 'status', name: expect.stringMatching(/something went wrong|error|issue/i) });
    }
  }
  // Role and label assertions
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: /report this issue/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /close|cerrar|fermer/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /submit/i })).toBeVisible();
  await expect(page.getByLabel(/describe what happened/i)).toBeVisible();
  // Recovery: clear error and reopen modal
  await page.getByRole('button', { name: /close|cerrar|fermer/i }).click();
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_ANALYTICS_ERROR__?: boolean }).__FORCE_ANALYTICS_ERROR__ = false;
  });
  await page.getByTestId('open-analytics-modal-btn').click();
  // ARIA live region announces recovery
  if (await liveRegion.count()) {
    const liveHandle = await liveRegion.first().elementHandle();
    if (liveHandle) {
      const snapshot = await page.accessibility.snapshot({ root: liveHandle });
      expect(snapshot).toMatchObject({ role: 'status', name: expect.stringMatching(/recovered|restored|success|normal/i) });
    }
  }
});

test('ProfileModal ErrorBoundary fallback UI has correct tab order, focus trap, ARIA live, and roles/labels', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_PROFILE_ERROR__?: boolean }).__FORCE_PROFILE_ERROR__ = true;
  });
  await page.getByTestId('open-profile-modal-btn').click();
  const modalAlert = page.locator('.modal [role="alert"]');
  await expect(modalAlert).toBeVisible();
  await expect(modalAlert).toBeFocused();
  const focusable = [
    modalAlert,
    page.getByRole('button', { name: /report this issue/i }),
    page.getByRole('button', { name: /close|cerrar|fermer/i })
  ];
  for (let i = 0; i < focusable.length; i++) {
    await page.keyboard.press('Tab');
    await expect(focusable[(i + 1) % focusable.length]).toBeFocused();
  }
  for (let i = focusable.length; i > 0; i--) {
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await expect(focusable[(i - 1 + focusable.length) % focusable.length]).toBeFocused();
  }
  await page.getByRole('button', { name: /report this issue/i }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  const feedbackFields = [
    page.getByLabel(/describe what happened/i),
    page.getByRole('button', { name: /submit/i }),
    page.getByRole('button', { name: /cancel|close|cerrar|fermer/i })
  ];
  for (let i = 0; i < feedbackFields.length; i++) {
    await page.keyboard.press('Tab');
    await expect(feedbackFields[(i + 1) % feedbackFields.length]).toBeFocused();
  }
  for (let i = feedbackFields.length; i > 0; i--) {
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await expect(feedbackFields[(i - 1 + feedbackFields.length) % feedbackFields.length]).toBeFocused();
  }
  const liveRegion = page.locator('[aria-live]');
  if (await liveRegion.count()) {
    const liveHandle = await liveRegion.first().elementHandle();
    if (liveHandle) {
      const snapshot = await page.accessibility.snapshot({ root: liveHandle });
      expect(snapshot).toMatchObject({ role: 'status', name: expect.stringMatching(/something went wrong|error|issue/i) });
    }
  }
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: /report this issue/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /close|cerrar|fermer/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /submit/i })).toBeVisible();
  await expect(page.getByLabel(/describe what happened/i)).toBeVisible();
  await page.getByRole('button', { name: /close|cerrar|fermer/i }).click();
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_PROFILE_ERROR__?: boolean }).__FORCE_PROFILE_ERROR__ = false;
  });
  await page.getByTestId('open-profile-modal-btn').click();
  if (await liveRegion.count()) {
    const liveHandle = await liveRegion.first().elementHandle();
    if (liveHandle) {
      const snapshot = await page.accessibility.snapshot({ root: liveHandle });
      expect(snapshot).toMatchObject({ role: 'status', name: expect.stringMatching(/recovered|restored|success|normal/i) });
    }
  }
});

test('SmartLearningModal ErrorBoundary fallback UI has correct tab order, focus trap, ARIA live, and roles/labels', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_SMARTLEARNING_ERROR__?: boolean }).__FORCE_SMARTLEARNING_ERROR__ = true;
  });
  await page.getByTestId('open-smartlearning-modal-btn').click();
  const modalAlert = page.locator('.modal [role="alert"]');
  await expect(modalAlert).toBeVisible();
  await expect(modalAlert).toBeFocused();
  const focusable = [
    modalAlert,
    page.getByRole('button', { name: /report this issue/i }),
    page.getByRole('button', { name: /close|cerrar|fermer/i })
  ];
  for (let i = 0; i < focusable.length; i++) {
    await page.keyboard.press('Tab');
    await expect(focusable[(i + 1) % focusable.length]).toBeFocused();
  }
  for (let i = focusable.length; i > 0; i--) {
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await expect(focusable[(i - 1 + focusable.length) % focusable.length]).toBeFocused();
  }
  await page.getByRole('button', { name: /report this issue/i }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  const feedbackFields = [
    page.getByLabel(/describe what happened/i),
    page.getByRole('button', { name: /submit/i }),
    page.getByRole('button', { name: /cancel|close|cerrar|fermer/i })
  ];
  for (let i = 0; i < feedbackFields.length; i++) {
    await page.keyboard.press('Tab');
    await expect(feedbackFields[(i + 1) % feedbackFields.length]).toBeFocused();
  }
  for (let i = feedbackFields.length; i > 0; i--) {
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await expect(feedbackFields[(i - 1 + feedbackFields.length) % feedbackFields.length]).toBeFocused();
  }
  const liveRegion = page.locator('[aria-live]');
  if (await liveRegion.count()) {
    const liveHandle = await liveRegion.first().elementHandle();
    if (liveHandle) {
      const snapshot = await page.accessibility.snapshot({ root: liveHandle });
      expect(snapshot).toMatchObject({ role: 'status', name: expect.stringMatching(/something went wrong|error|issue/i) });
    }
  }
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: /report this issue/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /close|cerrar|fermer/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /submit/i })).toBeVisible();
  await expect(page.getByLabel(/describe what happened/i)).toBeVisible();
  await page.getByRole('button', { name: /close|cerrar|fermer/i }).click();
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_SMARTLEARNING_ERROR__?: boolean }).__FORCE_SMARTLEARNING_ERROR__ = false;
  });
  await page.getByTestId('open-smartlearning-modal-btn').click();
  if (await liveRegion.count()) {
    const liveHandle = await liveRegion.first().elementHandle();
    if (liveHandle) {
      const snapshot = await page.accessibility.snapshot({ root: liveHandle });
      expect(snapshot).toMatchObject({ role: 'status', name: expect.stringMatching(/recovered|restored|success|normal/i) });
    }
  }
});

test('SettingsModal ErrorBoundary fallback UI has correct tab order, focus trap, ARIA live, and roles/labels', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_SETTINGS_ERROR__?: boolean }).__FORCE_SETTINGS_ERROR__ = true;
  });
  await page.getByTestId('open-settings-modal-btn').click();
  const modalAlert = page.locator('.modal [role="alert"]');
  await expect(modalAlert).toBeVisible();
  await expect(modalAlert).toBeFocused();
  const focusable = [
    modalAlert,
    page.getByRole('button', { name: /report this issue/i }),
    page.getByRole('button', { name: /close|cerrar|fermer/i })
  ];
  for (let i = 0; i < focusable.length; i++) {
    await page.keyboard.press('Tab');
    await expect(focusable[(i + 1) % focusable.length]).toBeFocused();
  }
  for (let i = focusable.length; i > 0; i--) {
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await expect(focusable[(i - 1 + focusable.length) % focusable.length]).toBeFocused();
  }
  await page.getByRole('button', { name: /report this issue/i }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  const feedbackFields = [
    page.getByLabel(/describe what happened/i),
    page.getByRole('button', { name: /submit/i }),
    page.getByRole('button', { name: /cancel|close|cerrar|fermer/i })
  ];
  for (let i = 0; i < feedbackFields.length; i++) {
    await page.keyboard.press('Tab');
    await expect(feedbackFields[(i + 1) % feedbackFields.length]).toBeFocused();
  }
  for (let i = feedbackFields.length; i > 0; i--) {
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await expect(feedbackFields[(i - 1 + feedbackFields.length) % feedbackFields.length]).toBeFocused();
  }
  const liveRegion = page.locator('[aria-live]');
  if (await liveRegion.count()) {
    const liveHandle = await liveRegion.first().elementHandle();
    if (liveHandle) {
      const snapshot = await page.accessibility.snapshot({ root: liveHandle });
      expect(snapshot).toMatchObject({ role: 'status', name: expect.stringMatching(/something went wrong|error|issue/i) });
    }
  }
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: /report this issue/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /close|cerrar|fermer/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /submit/i })).toBeVisible();
  await expect(page.getByLabel(/describe what happened/i)).toBeVisible();
  await page.getByRole('button', { name: /close|cerrar|fermer/i }).click();
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_SETTINGS_ERROR__?: boolean }).__FORCE_SETTINGS_ERROR__ = false;
  });
  await page.getByTestId('open-settings-modal-btn').click();
  if (await liveRegion.count()) {
    const liveHandle = await liveRegion.first().elementHandle();
    if (liveHandle) {
      const snapshot = await page.accessibility.snapshot({ root: liveHandle });
      expect(snapshot).toMatchObject({ role: 'status', name: expect.stringMatching(/recovered|restored|success|normal/i) });
    }
  }
});

test('AnalyticsModal ErrorBoundary fallback UI passes axe accessibility audit (desktop and mobile)', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_ANALYTICS_ERROR__?: boolean }).__FORCE_ANALYTICS_ERROR__ = true;
  });
  await page.getByTestId('open-analytics-modal-btn').click();
  // Desktop axe audit
  let results = await new AxeBuilder({ page }).include('.modal').analyze();
  expect(results.violations).toEqual([]);
  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  results = await new AxeBuilder({ page }).include('.modal').analyze();
  expect(results.violations).toEqual([]);
});

test('AnalyticsModal ErrorBoundary fallback UI is accessible in dark and high contrast mode', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_ANALYTICS_ERROR__?: boolean }).__FORCE_ANALYTICS_ERROR__ = true;
  });
  await page.getByTestId('open-analytics-modal-btn').click();
  // Dark mode
  await page.emulateMedia({ colorScheme: 'dark' });
  let results = await new AxeBuilder({ page }).include('.modal').analyze();
  expect(results.violations).toEqual([]);
  // High contrast (forced-colors)
  await page.emulateMedia({ forcedColors: 'active' });
  results = await new AxeBuilder({ page }).include('.modal').analyze();
  expect(results.violations).toEqual([]);
  // Reset
  await page.emulateMedia({ colorScheme: 'light', forcedColors: 'none' });
});
