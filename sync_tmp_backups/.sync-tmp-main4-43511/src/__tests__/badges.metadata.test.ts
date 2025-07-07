import fs from 'fs';
import path from 'path';

declare const process: any;

const badgeJsonPath = path.join((typeof process !== 'undefined' ? process.cwd() : '.'), 'public/badges/badges.json');
const badgeDir = path.join((typeof process !== 'undefined' ? process.cwd() : '.'), 'public/badges/');
const badges: Array<{ id: string; name: string; description: string; criteria: string; image: string; awarded: boolean }> = JSON.parse(fs.readFileSync(badgeJsonPath, 'utf8'));

describe('Badge metadata consistency', () => {
  it('every badge has a valid image field and image file exists', () => {
    badges.forEach((badge) => {
      expect(badge.image).toBeTruthy();
      const imagePath = path.join(badgeDir, badge.image);
      expect(fs.existsSync(imagePath)).toBe(true);
    });
  });

  it('no duplicate badge ids or images', () => {
    const ids = new Set();
    const images = new Set();
    badges.forEach((badge) => {
      expect(ids.has(badge.id)).toBe(false);
      ids.add(badge.id);
      expect(images.has(badge.image)).toBe(false);
      images.add(badge.image);
    });
  });
});
