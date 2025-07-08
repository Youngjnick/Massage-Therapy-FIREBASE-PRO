// @ts-nocheck
/* global console */
import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';
import fs from 'fs/promises';
import path from 'path';
import './helpers/playwright-coverage';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
async function getTestUser(index = 0) {
	const usersPath = path.resolve(__dirname, 'test-users.json');
	const usersRaw = await fs.readFile(usersPath, 'utf-8');
	const users = JSON.parse(usersRaw);
	return users[index];
}

const PAGES = [
	{ path: '/', name: 'landing' },
	{ path: '/quiz?e2e=1', name: 'quiz' },
	{ path: '/profile', name: 'profile', auth: true },
	{ path: '/achievements', name: 'achievements', auth: true },
	{ path: '/analytics', name: 'analytics', auth: true },
];

// Use a consistent viewport for regression
const VIEWPORT = { width: 1280, height: 800 };

test.describe('Critical UI Visual Regression', () => {
	for (const { path, name, auth } of PAGES) {
		test.skip(
			`${name} page matches visual snapshot`,
			async ({ page }, testInfo) => {
				testInfo.setTimeout(20000); // Set per-test timeout to 20s
				if (auth) {
					const user = await getTestUser(0);
					await uiSignIn(page, { email: user.email, password: user.password });
				}
				await page.setViewportSize(VIEWPORT);
				await page.goto(path);
				if (name === 'quiz') {
					// Capture browser console errors
					page.on('console', (msg: import('@playwright/test').ConsoleMessage) => {
						if (msg.type() === 'error') {
							console.error('BROWSER CONSOLE ERROR:', msg.text());
						}
					});
					// Capture failed network requests
					page.on('requestfailed', (request: import('@playwright/test').Request) => {
						console.error('FAILED REQUEST:', request.url(), request.failure()?.errorText);
					});
					// Log all network requests and responses
					page.on('request', (request: import('@playwright/test').Request) => {
						console.log('REQUEST:', request.method(), request.url());
					});
					page.on('response', async (response: import('@playwright/test').Response) => {
						const url = response.url();
						if (url.includes('localhost:8080') || url.includes('firestore')) {
							console.log('RESPONSE:', response.status(), url);
							try {
								const body = await response.text();
								console.log('RESPONSE BODY:', body.slice(0, 500));
							} catch {
								// Ignore binary or non-text responses
							}
						}
					});
					// Wait for quiz start form (use same selector and timeout as quiz-stats-live-update.spec.ts)
					console.log('WAIT: quiz-start-form');
					await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
					console.log('WAITED: quiz-start-form');
					// Select the first available topic with a non-empty value
					let selectedValue = null;
					const topicSelectEl = await page.$('select#quiz-topic-select');
					if (topicSelectEl) {
						const options = await topicSelectEl.$$('option');
						for (const opt of options) {
							const val = await opt.getAttribute('value');
							if (val && val.trim() !== '') {
								await topicSelectEl.selectOption(val);
								selectedValue = val;
								console.log('Selected topic value:', val);
								break;
							}
						}
						if (!selectedValue) {
							console.warn('No available topic with questions found.');
						}
					}
					// Log available topics and selected topic before clicking Start
					if (topicSelectEl) {
						const options = await topicSelectEl.$$('option');
						const optionValues = [];
						for (const opt of options) {
							const val = await opt.getAttribute('value');
							const label = await opt.textContent();
							optionValues.push({ value: val, label });
						}
						console.log('Available topics:', optionValues);
						const selectedValue = await topicSelectEl.inputValue();
						console.log('Selected topic value:', selectedValue);
					}
					// Set quiz length to 2 and submit (same as quiz-stats-live-update.spec.ts)
					const lengthInput = await page.$('input[aria-label="Quiz Length"]');
					if (lengthInput) {
						await lengthInput.fill('2');
					}
					// Wait for the start button to be enabled, then click
					const startBtn = page.getByRole('button', { name: /start/i });
					await startBtn.waitFor({ state: 'visible', timeout: 3000 });
					await expect(startBtn).toBeEnabled();
					await startBtn.click();
					console.log('Clicked start button');
					// Extra debug: capture screenshot and HTML immediately after clicking Start
					const debugScreenshot = await page.screenshot({ fullPage: true });
					await testInfo.attach('quiz-page-after-start.png', { body: debugScreenshot, contentType: 'image/png' });
					const debugContent = await page.content();
					const { Buffer } = await import('buffer');
					await testInfo.attach('quiz-page-after-start.html', { body: Buffer.from(debugContent, 'utf-8'), contentType: 'text/html' });
					// Wait for first question card to appear (use same selector and timeout as quiz-stats-live-update.spec.ts)
					try {
						await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 10000 });
						console.log('WAITED: quiz-question-card');
					} catch (err) {
						console.error('ERROR: quiz-question-card did not appear after clicking Start.');
						// Check for error or warning banners
						const errorBanner = await page.$('[data-testid="quiz-error"]');
						if (errorBanner) {
							const errorText = await errorBanner.textContent();
							console.error('Quiz error banner:', errorText);
						}
						const warningBanner = await page.$('[data-testid="quiz-warning"]');
						if (warningBanner) {
							const warningText = await warningBanner.textContent();
							console.error('Quiz warning banner:', warningText);
						}
						// Check if quiz start form is still visible
						const startForm = await page.$('[data-testid="quiz-start-form"]');
						if (startForm) {
							console.error('Quiz start form is still visible after clicking Start.');
						}
						// Attach screenshot and HTML to test report for debugging
						const screenshot = await page.screenshot({ fullPage: true });
						await testInfo.attach('quiz-page-debug.png', { body: screenshot, contentType: 'image/png' });
						const content = await page.content();
						// Polyfill Buffer for this line only
						const { Buffer } = await import('buffer');
						await testInfo.attach('quiz-page-debug.html', { body: Buffer.from(content, 'utf-8'), contentType: 'text/html' });
						console.log('DEBUG: Quiz page content after submit (first 2000 chars):', content.slice(0, 2000));
						throw err;
					}
				} else {
					// Wait for main content to load
					console.log('WAIT: domcontentloaded');
					await page.waitForLoadState('domcontentloaded');
					await page.waitForTimeout(500);
					console.log('WAITED: domcontentloaded');
				}
				// Take screenshot and compare
				expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(`${name}-page.png`, { threshold: 0.03 });
			},
			20000 // Set per-test timeout to 20s
		);
	}
});
