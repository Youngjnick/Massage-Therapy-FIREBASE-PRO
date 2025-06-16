/* eslint-env node, jest */
/* global process */
import fs from 'fs';
import path from 'path';
import badges from '../../public/badges/badges.json';

const badgeDir = path.join(process.cwd(), 'public/badges');
const badgeFiles = fs.readdirSync(badgeDir);

describe('Badge images in public/badges', () => {
  badges.forEach((badge: any) => {
    it(`should have an image file for badge "${badge.id}"`, () => {
      const expectedFile = `${badge.image}`;
      expect(badgeFiles).toContain(expectedFile);
    });
  });
});
