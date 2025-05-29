// scripts/syncBadgeImages.js
// Node.js script to ensure every badge in badges.json has an image in public/badges/.
// It will also print extra images not referenced by any badge.
const fs = require('fs');
const path = require('path');

const badgesJsonPath = path.resolve(__dirname, '../public/badges/badges.json');
const badgesDir = path.resolve(__dirname, '../public/badges');

const badges = JSON.parse(fs.readFileSync(badgesJsonPath, 'utf8'));
const badgeIcons = badges.map(b => b.icon || `${b.id}.png`);

const files = fs.readdirSync(badgesDir).filter(f => /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(f));

const missing = badgeIcons.filter(icon => !files.includes(icon));
const extra = files.filter(f => !badgeIcons.includes(f));

if (missing.length) {
  console.log('Missing badge images (add these to public/badges/):');
  missing.forEach(f => console.log('  ' + f));
} else {
  console.log('All badge images referenced in badges.json exist.');
}

if (extra.length) {
  console.log('\nExtra images in public/badges/ not referenced by any badge:');
  extra.forEach(f => console.log('  ' + f));
} else {
  console.log('No extra images in public/badges/.');
}
