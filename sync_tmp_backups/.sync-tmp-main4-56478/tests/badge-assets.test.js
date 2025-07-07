/* eslint-env node, jest */
const fs = require('fs');
const path = require('path');

describe('Badge asset checks (Node/Jest)', () => {
  const badgeFile = 'first_quiz.png';
  const badgesDir = path.join(__dirname, '../public/badges');
  const badgePath = path.join(badgesDir, badgeFile);

  test('first_quiz.png exists in public/badges/ (case-sensitive)', () => {
    const files = fs.readdirSync(badgesDir);
    expect(files).toContain(badgeFile);
    expect(fs.existsSync(badgePath)).toBe(true);
  });

  test('first_quiz.png is not ignored by .gitignore', () => {
    const gitignorePath = path.join(__dirname, '../.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');
      expect(gitignore.includes('public/badges/first_quiz.png')).toBe(false);
    }
  });

  test('No case-different files in public/badges/', () => {
    const files = fs.readdirSync(badgesDir);
    const lower = files.map(f => f.toLowerCase());
    const hasCaseDiff = lower.some((f, i) => lower.indexOf(f) !== i);
    expect(hasCaseDiff).toBe(false);
  });

  test('All badge image references in code are dynamically loaded (no static first_quiz.png references)', () => {
    const srcDir = path.join(__dirname, '../src');
    function walk(dir) {
      let results = [];
      fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) results = results.concat(walk(full));
        else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) results.push(full);
      });
      return results;
    }
    const files = walk(srcDir);
    const pattern = /first_quiz\.png/gi;
    let found = false;
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      if (pattern.test(content)) {
        found = true;
      }
    });
    expect(found).toBe(false); // Should be false since badge rendering is dynamic
  });
});
