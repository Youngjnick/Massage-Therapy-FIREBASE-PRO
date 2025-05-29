// Auto-generates unlock condition stubs for all badges in badges.json
// Usage: node scripts/generateBadgeUnlockStubs.cjs

const fs = require('fs');
const path = require('path');

const BADGES_PATH = path.join(__dirname, '../public/badges/badges.json');
const OUTPUT_PATH = path.join(__dirname, '../src/data/generated_badge_conditions.js');

const badges = JSON.parse(fs.readFileSync(BADGES_PATH, 'utf8'));

function unlockStub(badge) {
  const id = badge.id.replace(/[-\s%]/g, '_');
  // Heuristics for common badge types
  if (/streak_(\d+)/i.test(badge.id)) {
    const n = badge.id.match(/streak_(\d+)/i)[1];
    return `export function checkUnlock_${id}(user) { return user.current_streak_days >= ${n}; }`;
  }
  if (/accuracy_(\d+)/i.test(badge.id)) {
    const n = badge.id.match(/accuracy_(\d+)/i)[1];
    return `export function checkUnlock_${id}(user) { return user.last_quiz_score >= ${n}; }`;
  }
  if (/first_quiz/i.test(badge.id)) {
    return `export function checkUnlock_${id}(user) { return user.total_quizzes >= 1; }`;
  }
  if (/quiz_thousand_club/i.test(badge.id)) {
    return `export function checkUnlock_${id}(user) { return user.total_questions_answered >= 1000; }`;
  }
  if (/badge_collector_2/i.test(badge.id)) {
    return `export function checkUnlock_${id}(user) { return Object.keys(user.badges || {}).length >= 25; }`;
  }
  if (/badge_collector/i.test(badge.id)) {
    return `export function checkUnlock_${id}(user) { return Object.keys(user.badges || {}).length >= 10; }`;
  }
  // Default stub
  return `export function checkUnlock_${id}(user) { /* TODO: Implement unlock logic for ${badge.name} */ return false; }`;
}

const fileHeader = `// Auto-generated badge unlock condition stubs\n// Edit these functions to implement real unlock logic\n`;
const code = badges.map(unlockStub).join('\n\n');

fs.writeFileSync(OUTPUT_PATH, fileHeader + code + '\n');
console.log('Generated unlock stubs for all badges in', OUTPUT_PATH);
