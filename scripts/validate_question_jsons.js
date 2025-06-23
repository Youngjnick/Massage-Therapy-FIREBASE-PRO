// validate_question_jsons.js
// Recursively validate all JSON files in question directories for syntax, invisible characters, and encoding issues.

const fs = require('fs');
const path = require('path');

const DEFAULT_QUESTION_ROOTS = [
  path.join(__dirname, '../src/data/questions'),
  path.join(__dirname, '../public/questions'),
];

// Accept directory argument(s) from command line
const userDirs = process.argv.slice(2);
const QUESTION_ROOTS = userDirs.length > 0 ? userDirs.map(dir => path.resolve(dir)) : DEFAULT_QUESTION_ROOTS;

function isJsonFile(filename) {
  return filename.endsWith('.json');
}

function hasInvisibleChars(str) {
  // Checks for non-printable ASCII except tab/newline/carriage return
  // eslint-disable-next-line no-control-regex
  return /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B\uFEFF]/.test(str);
}

function validateJsonFile(filepath) {
  let content;
  try {
    content = fs.readFileSync(filepath, 'utf8');
  } catch (e) {
    return { filepath, error: 'File read error: ' + e.message };
  }
  if (content.trim().length === 0) {
    return { filepath, error: 'File is empty or only whitespace' };
  }
  if (hasInvisibleChars(content)) {
    return { filepath, error: 'Contains invisible or non-printable characters' };
  }
  try {
    JSON.parse(content);
    return null; // valid
  } catch (e) {
    return { filepath, error: 'JSON parse error: ' + e.message };
  }
}

function walk(dir, callback) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, callback);
    } else if (isJsonFile(entry.name)) {
      callback(fullPath);
    }
  });
}

function main() {
  const errors = [];
  for (const root of QUESTION_ROOTS) {
    if (!fs.existsSync(root)) continue;
    walk(root, (filepath) => {
      // Print absolute path for debugging
      console.log('Checking:', path.resolve(filepath));
      const result = validateJsonFile(filepath);
      if (result) errors.push(result);
    });
  }
  if (errors.length === 0) {
    console.log('All question JSON files are valid!');
  } else {
    console.log('Invalid or problematic JSON files found:');
    errors.forEach(({ filepath, error }) => {
      console.log(`- ${filepath}: ${error}`);
    });
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
