/* eslint-disable */
/**
 * Automated test to ensure every badge in badges.json has a corresponding image file in public/badges/.
 * Uses process.cwd() for Jest and linter compatibility (no require, no __dirname, no import.meta.url).
 */
import fs from 'fs';
import path from 'path';

// badges.json is in public/badges/badges.json (relative to project root)
const badgesJsonPath = path.join(process.cwd(), 'public/badges/badges.json');
const badgesImagesDir = path.join(process.cwd(), 'public/badges');

// Read and parse badges.json
const badges = JSON.parse(fs.readFileSync(badgesJsonPath, 'utf-8'));

describe('Badge images existence', () => {
  it('should have an image file for every badge in badges.json', () => {
    const missingImages = [];
    for (const badge of badges) {
      const imageFile = path.join(badgesImagesDir, `${badge.id}.png`);
      if (!fs.existsSync(imageFile)) {
        missingImages.push(`${badge.id}.png`);
      }
    }
    if (missingImages.length > 0) {
      throw new Error(`Missing badge images: ${missingImages.join(', ')}`);
    }
  });
});
