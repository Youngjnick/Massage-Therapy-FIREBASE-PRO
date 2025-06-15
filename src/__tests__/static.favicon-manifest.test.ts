import fs from 'fs';
import path from 'path';

declare const process: any;

describe('Favicon and manifest existence', () => {
  const staticAssets = [
    'public/favicon.ico',
    'public/manifest.webmanifest',
  ];

  staticAssets.forEach((asset) => {
    it(`should have ${asset} present`, () => {
      expect(fs.existsSync(path.join((typeof process !== 'undefined' ? process.cwd() : '.'), asset))).toBe(true);
    });
  });
});
