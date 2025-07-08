// Playwright afterEach hook to collect and write browser coverage to .nyc_output
import fs from 'fs';
import path from 'path';
import { test } from '@playwright/test';

// Debug: log process.env.COVERAGE at test start
console.log('[COVERAGE DEBUG] process.env.COVERAGE:', process.env.COVERAGE);

test.afterEach(async ({ page }, testInfo) => {
  // Debug: log test file and title
  console.log(`[COVERAGE DEBUG] Running afterEach for: ${testInfo.file} - ${testInfo.title}`);
  // Check for window.__coverage__ in browser
  const coverage = await page.evaluate(() => {
    // @ts-ignore
    return typeof window !== 'undefined' && window.__coverage__ ? window.__coverage__ : null;
  });
  if (coverage) {
    const nycDir = path.join(process.cwd(), '.nyc_output');
    if (!fs.existsSync(nycDir)) fs.mkdirSync(nycDir);
    // Use a unique filename per test to avoid overwriting
    const filename = `out-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
    fs.writeFileSync(path.join(nycDir, filename), JSON.stringify(coverage));
    console.log(`[COVERAGE] Wrote coverage to ${filename}`);
  } else {
    console.log('[COVERAGE] window.__coverage__ is not present');
  }
});

// Debug: log at import time to confirm hook is loaded
console.log('[COVERAGE DEBUG] playwright-coverage.ts loaded');
