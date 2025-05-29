// tools/checkBadgeImages.js
// Checks that every badge icon in badges.json exists in public/badges/ (case-sensitive)
// Usage: node tools/checkBadgeImages.js

import fs from 'fs';
import path from 'path';

const badgesJsonPath = path.resolve('public/badges/badges.json');
const badgesDir = path.resolve('public/badges');

function main() {
  if (!fs.existsSync(badgesJsonPath)) {
    console.error('badges.json not found at', badgesJsonPath);
    process.exit(1);
  }
  const badges = JSON.parse(fs.readFileSync(badgesJsonPath, 'utf8'));
  let missing = [];
  let checked = 0;
  badges.forEach(badge => {
    const icon = badge.icon || badge.filename || badge.image || badge.id + '.png';
    if (!icon) return;
    const iconPath = path.join(badgesDir, icon);
    checked++;
    if (!fs.existsSync(iconPath)) {
      missing.push(icon);
    }
  });
  if (missing.length) {
    console.log('Missing badge images:');
    missing.forEach(f => console.log(' -', f));
    process.exit(2);
  } else {
    console.log(`All ${checked} badge images found!`);
  }
}

main();
