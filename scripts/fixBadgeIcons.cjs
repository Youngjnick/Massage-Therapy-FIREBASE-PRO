// Node.js script to check badge icon properties in src/data/badges.js against files in public/badges/
// and auto-fix icon properties to match the actual filenames (lowercase, underscores)

const fs = require('fs');
const path = require('path');

const BADGES_JS = path.join(__dirname, '../src/data/badges.js');
const BADGES_DIR = path.join(__dirname, '../public/badges/');

// Read badge filenames from public/badges/
const badgeFiles = fs.readdirSync(BADGES_DIR)
  .filter(f => f.endsWith('.png'))
  .map(f => f.toLowerCase());

// Read badges.js
let badgesSrc = fs.readFileSync(BADGES_JS, 'utf8');

// Parse badges array (very basic, not a full JS parser)
const badgeIconRegex = /icon:\s*['"]([\w\-\. ]+)['"]/g;
let match;
let icons = [];
while ((match = badgeIconRegex.exec(badgesSrc)) !== null) {
  icons.push({
    original: match[1],
    index: match.index,
    length: match[0].length,
  });
}

// For each icon, find the closest match in badgeFiles
let fixed = 0;
icons.forEach(iconObj => {
  const orig = iconObj.original;
  const normalized = orig.replace(/ /g, '_').toLowerCase();
  if (!badgeFiles.includes(normalized)) {
    // Try to find a close match
    const found = badgeFiles.find(f => f.includes(normalized.replace('.png','')));
    if (found) {
      badgesSrc = badgesSrc.replace(`icon: "${orig}"`, `icon: "${found}"`);
      fixed++;
    }
  }
});

if (fixed > 0) {
  fs.writeFileSync(BADGES_JS, badgesSrc, 'utf8');
  console.log(`Fixed ${fixed} badge icon properties in badges.js`);
} else {
  console.log('No badge icon properties needed fixing.');
}
