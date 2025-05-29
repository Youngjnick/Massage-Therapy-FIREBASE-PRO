// scripts/exportBadgesToJson.cjs
// Node.js script to export all badges from src/data/badges.js to public/badges/badges.json
// Usage: node scripts/exportBadgesToJson.cjs

const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../src/data/badges.js');
const dest = path.resolve(__dirname, '../public/badges/badges.json');

// badges.js should export: const badges = [ ... ]; export default badges;
let badgesArr;
try {
  // Use require with Babel if using ES6 modules, or eval as fallback
  const code = fs.readFileSync(src, 'utf8');
  // Remove export default and module syntax
  const arrMatch = code.match(/const badges\s*=\s*(\[.*\]);/s);
  if (!arrMatch) throw new Error('Could not find badges array in badges.js');
  badgesArr = eval(arrMatch[1]);
} catch (e) {
  console.error('Failed to parse badges.js:', e);
  process.exit(1);
}

fs.writeFileSync(dest, JSON.stringify(badgesArr, null, 2));
console.log(`Exported ${badgesArr.length} badges to ${dest}`);
