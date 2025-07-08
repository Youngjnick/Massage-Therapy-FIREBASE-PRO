/* eslint-env node, jest */
import fs from 'fs';
import path from 'path';
import badges from '../../public/badges/badges.json';

// Always resolve from process.cwd() for Jest compatibility
const badgeDir = path.join(process.cwd(), 'dist/badges');
const badgeFiles = fs.existsSync(badgeDir) ? fs.readdirSync(badgeDir) : [];

describe('Badge images in dist/badges', () => {
  if (badgeFiles.length === 0) {
    it('dist/badges directory does not exist', () => {
      expect(badgeFiles.length).toBeGreaterThan(0);
    });
    return;
  }
  badges.forEach((badge: any) => {
    it(`should have an image file for badge "${badge.id}" in dist`, () => {
      const expectedFile = `${badge.image}`;
      expect(badgeFiles).toContain(expectedFile);
    });
  });
});
