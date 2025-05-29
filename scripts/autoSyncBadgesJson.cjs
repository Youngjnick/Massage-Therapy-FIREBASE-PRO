// scripts/autoSyncBadgesJson.cjs
// Auto-sync badges.json to match all images in public/badges/
const fs = require('fs');
const path = require('path');

const badgesJsonPath = path.resolve(__dirname, '../public/badges/badges.json');
const badgesDir = path.resolve(__dirname, '../public/badges');

const imageFiles = fs.readdirSync(badgesDir).filter(f => /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(f));
let badges = [];
try {
  badges = JSON.parse(fs.readFileSync(badgesJsonPath, 'utf8'));
} catch (e) {
  // If file doesn't exist or is empty, start with empty array
  badges = [];
}

// Map for quick lookup
const badgeByIcon = Object.fromEntries(badges.map(b => [(b.icon || (b.id + '.png')), b]));
const badgeById = Object.fromEntries(badges.map(b => [b.id, b]));

// Add missing badges for images
let added = 0;
imageFiles.forEach(img => {
  // Remove extension for id
  const id = img.replace(/\.(png|jpg|jpeg|svg|gif|webp)$/i, '');
  if (!badgeByIcon[img] && !badgeById[id]) {
    badges.push({
      id,
      name: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Earn the ${id.replace(/_/g, ' ')} badge!`,
      icon: img
    });
    added++;
  }
});

// Remove badges with missing images
const imageSet = new Set(imageFiles);
badges = badges.filter(b => imageSet.has(b.icon || (b.id + '.png')));

fs.writeFileSync(badgesJsonPath, JSON.stringify(badges, null, 2));
console.log(`Updated badges.json: added ${added} new badges, total now ${badges.length}.`);
