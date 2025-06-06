// filepath: tests/helpers/e2eBadgeModalHelpers.ts
import { Page, expect } from "@playwright/test";

/**
 * Opens the profile modal and analytics modal, waits for analytics modal to be visible.
 */
export async function openAnalyticsModal(page: Page) {
  await page.click("#profileBtn");
  await page.waitForSelector('[data-testid="profile-modal"]', {
    state: "visible",
    timeout: 10000,
  });
  await page.getByTestId("analytics-btn").click();
  await page.waitForSelector('[data-testid="analytics-modal"]', {
    state: "visible",
    timeout: 10000,
  });
}

/**
 * Checks that a badge with the given id is visible in the analytics modal.
 */
export async function expectBadgeEarnedVisible(page: Page, badgeId: string) {
  await expect(
    page.locator(
      `[data-testid="analytics-modal"] [data-testid="badge-earned-${badgeId}"]`,
    ),
  ).toBeVisible();
}

/**
 * Checks that all badge images are visible in the analytics modal.
 */
export async function expectAllBadgeImagesVisible(page: Page) {
  const badgeImages = page.locator('[data-testid^="badge-earned-"] img');
  await expect(badgeImages).toBeVisible();
}

/**
 * Checks that a badge description is not shown for an unearned badge.
 */
export async function expectNoBadgeDescriptionForUnearned(
  page: Page,
  badgeId: string,
) {
  const unearnedDesc = await page.locator(
    `[data-testid="badge-earned-${badgeId}"] [data-testid="badge-description"]`,
  );
  await expect(unearnedDesc).toHaveCount(0);
}
