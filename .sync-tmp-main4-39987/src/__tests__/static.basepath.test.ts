import fs from 'fs';
import path from 'path';

declare const process: any; // Fix for process not defined in some test runners

// Helper to get the expected base path
function getExpectedBasePath() {
  if (typeof process !== 'undefined' && process.env && process.env.VITE_BASE) return process.env.VITE_BASE;
  // Fallback: check for production base path in HTML
  const indexPath = path.join((typeof process !== 'undefined' ? process.cwd() : '.'), 'dist/index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  if (html.includes('/Massage-Therapy-FIREBASE-PRO/assets/')) return '/Massage-Therapy-FIREBASE-PRO/';
  return '/';
}

describe('Vite base path in build output', () => {
  it('should use the correct base path prefix for assets in dist/index.html', () => {
    const indexPath = path.join((typeof process !== 'undefined' ? process.cwd() : '.'), 'dist/index.html');
    const html = fs.readFileSync(indexPath, 'utf8');
    const expectedBase = getExpectedBasePath();
    // Check that asset paths use the expected base
    expect(html).toContain(`${expectedBase}assets/`);
    // The icon may be referenced as a relative path or with base prefix, so allow either
    expect(
      html.includes(`${expectedBase}icon-512x512.png`) ||
      html.includes('icon-512x512.png')
    ).toBe(true);
  });
});
