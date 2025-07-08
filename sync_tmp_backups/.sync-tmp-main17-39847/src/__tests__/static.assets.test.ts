import fs from 'fs';
import path from 'path';

declare const process: any;

describe('Static asset existence', () => {
  const staticAssets = [
    'public/default_avatar.png',
    'public/icon-512x512.png',
  ];

  staticAssets.forEach((asset) => {
    it(`should have ${asset} present`, () => {
      expect(fs.existsSync(path.join((typeof process !== 'undefined' ? process.cwd() : '.'), asset))).toBe(true);
    });
  });
});
