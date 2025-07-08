/* global process */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import './helpers/playwright-coverage';

const DEV_BASE_URL = 'http://localhost:5173';
const badgeFile = 'first_quiz.png';
const badgePath = `/badges/${badgeFile}`;

// 1. Check if badge image is served (HTTP 200)
test('Badge image is served by Vite dev server (case-sensitive)', async ({ request }) => {
  const resp = await request.get(`${DEV_BASE_URL}${badgePath}`);
  expect(resp.status()).toBe(200);
});

// 2. Check for case-different files in public/badges
test('No case-different files in public/badges/', async () => {
  const badgesDir = path.join(process.cwd(), 'public/badges');
  const files = fs.readdirSync(badgesDir);
  const lower = files.map(f => f.toLowerCase());
  const hasCaseDiff = lower.some((f, i) => lower.indexOf(f) !== i);
  expect(hasCaseDiff).toBe(false);
});
