// filepath: scripts/generateFileList.js
// Usage: node scripts/generateFileList.js
// Scans public/questions/ for all .json files and updates src/questions/fileList.ts

const fs = require('fs');
const path = require('path');

const QUESTIONS_DIR = path.join(__dirname, '../src/data/questions');
const OUTPUT_FILE = path.join(__dirname, '../src/questions/fileList.ts');

function walk(dir, prefix = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const relPath = prefix ? `${prefix}/${file}` : file;
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath, relPath));
    } else if (file.endsWith('.json')) {
      results.push(relPath);
    }
  });
  return results;
}

const allFiles = walk(QUESTIONS_DIR);

const fileListContent = `// This file is auto-generated. It exports a list of all question JSON files (relative to the project root).
export const fileList = [
${allFiles.map(f => `  "${f}"`).join(',')}
];`;

fs.writeFileSync(OUTPUT_FILE, fileListContent, 'utf8');
console.log(`Updated fileList.ts with ${allFiles.length} files.`);
