import fs from 'fs';
import path from 'path';

declare const process: any;

describe('Badge images in dist after build', () => {
  const distBadgesDir = path.join((typeof process !== 'undefined' ? process.cwd() : '.'), 'dist/badges');
  it('should have badge images in dist/badges', () => {
    const files = fs.existsSync(distBadgesDir) ? fs.readdirSync(distBadgesDir) : [];
    expect(files.length).toBeGreaterThan(0);
    expect(files.some(f => f.endsWith('.png'))).toBe(true);
  });
});
