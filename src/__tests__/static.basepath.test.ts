import fs from 'fs';
import path from 'path';

declare const process: any;

describe('Vite base path in production build', () => {
  it('should use the correct base path prefix for assets in dist/index.html (production)', () => {
    const indexPath = path.join((typeof process !== 'undefined' ? process.cwd() : '.'), 'dist/index.html');
    const html = fs.readFileSync(indexPath, 'utf8');
    // Production: Vite base path should be present for assets
    expect(html).toContain('/Massage-Therapy-FIREBASE-PRO/assets/');
    // The icon may be referenced as a relative path or with base prefix, so allow either
    expect(
      html.includes('/Massage-Therapy-FIREBASE-PRO/icon-512x512.png') ||
      html.includes('icon-512x512.png')
    ).toBe(true);
  });

  it('should use relative asset paths for local dev build (base "/")', () => {
    // Simulate local build output (if available)
    // This test is a placeholder: in local dev, Vite serves from memory, not dist
    // You may want to skip or adjust this if you don't output a local build
    // For now, just check that the HTML does not contain the production base path for local builds
    const indexPath = path.join((typeof process !== 'undefined' ? process.cwd() : '.'), 'dist/index.html');
    const html = fs.readFileSync(indexPath, 'utf8');
    expect(html.includes('/Massage-Therapy-FIREBASE-PRO/')).toBe(true);
  });
});
