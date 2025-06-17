import { Page } from '@playwright/test';

// Playwright helper to log in with email/password, trying multiple passwords
export async function loginWithPossiblePasswords(
  page: Page,
  email: string,
  possiblePasswords: string[]
): Promise<string> {
  for (const password of possiblePasswords) {
    try {
      await page.goto('https://youngjnick.github.io/Massage-Therapy-FIREBASE-PRO/login');
      // Output page HTML and console errors for debugging
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.error('PAGE CONSOLE ERROR:', msg.text());
        }
      });
      const html = await page.content();
      console.log('LOGIN PAGE HTML START');
      console.log(html);
      console.log('LOGIN PAGE HTML END');
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      // Wait for navigation or a known element that appears after login
      await page.waitForSelector('nav, [data-testid="achievements-page"], .achievements', { timeout: 5000 });
      return password; // Success
    } catch (e) {
      // Try next password
    }
  }
  throw new Error('Login failed with all provided passwords');
}
