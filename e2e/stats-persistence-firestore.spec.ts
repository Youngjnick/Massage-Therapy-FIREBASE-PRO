import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

// Helper to fetch stats from Firestore using the Node.js script
function getUserStatsFromFirestore(email: string): any {
  try {
    const output = execSync(`node scripts/getUserStatsFromFirestore.js "${email}"`, { encoding: 'utf-8' });
    return JSON.parse(output);
  } catch (e) {
    throw new Error('Failed to fetch stats from Firestore: ' + e);
  }
}

test.describe('Stats Persistence with Firestore Backend Verification', () => {
  // Use environment variables if running in Node, else fallback to hardcoded test credentials
  const testEmail = 'test1234@gmail.com';
  const testPassword = 'test1234';

  test.skip('UI stats and Firestore stats match and persist after quiz and reload', async ({ page }) => {
    // 1. Sign in via UI
    await page.goto('/profile');
    await page.getByPlaceholder('Test Email').fill(testEmail);
    await page.getByPlaceholder('Password').fill(testPassword);
    // Use the unique test-only sign-in button
    await page.getByTestId('test-signin-submit').click();
    // Expect the username part of the email (before @)
    await expect(page.getByTestId('profile-uid')).toHaveText('test1234');

    // 2. Get stats from Firestore before quiz
    const statsBefore = getUserStatsFromFirestore(testEmail);

    // Wait for profile-uid to be visible and check its value
    const profileUid = await page.locator('[data-testid="profile-uid"]');
    await expect(profileUid).toHaveText('test1234');

    // 3. Take a quiz (simulate answering all questions and finishing)
    await page.goto('/quiz');
    await page.getByRole('button', { name: /start quiz/i }).click();
    // Answer all questions (assume 5 for demo, adapt as needed)
    for (let i = 0; i < 5; i++) {
      await page.getByTestId('option-0').click();
      await page.getByRole('button', { name: /next|finish/i }).click();
    }
    // Wait for results
    await expect(page.getByTestId('quiz-results')).toBeVisible();

    // 4. Get UI stats after quiz
    await page.goto('/profile');
    const uiStatsAfter = await page.getByTestId('profile-stats').innerText();

    // 5. Get Firestore stats after quiz
    const statsAfter = getUserStatsFromFirestore(testEmail);

    // 6. Reload and check UI stats again
    await page.reload();
    const uiStatsAfterReload = await page.getByTestId('profile-stats').innerText();

    // 7. Assert UI and backend stats are consistent and incremented
    expect(uiStatsAfter).toBe(uiStatsAfterReload);
    expect(statsAfter.quizzesTaken).toBe(statsBefore.quizzesTaken + 1);
    // Optionally check other stats fields as needed
    // e.g., expect(statsAfter.correctAnswers).toBeGreaterThan(statsBefore.correctAnswers);
  });
});
