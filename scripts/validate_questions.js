// scripts/validate_questions.js
// Validates all question JSON files for schema, formatting, and uniqueness
// Usage: node scripts/validate_questions.js

const fs = require('fs');
const path = require('path');

const QUESTIONS_DIR = path.join(__dirname, '../src/data/questions');
const REQUIRED_FIELDS = ['id', 'question', 'options', 'correctAnswer'];
const FIELD_ORDER = ['id', 'question', 'options', 'correctAnswer'];
const FORBIDDEN_FIELDS = ['FIXME_CORRECT_ANSWER', 'answer_options', 'abcd'];

let duplicateIds = new Set();
let errors = [];

function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filelist);
    } else if (file.endsWith('.json')) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

function isUtf8NoBom(filepath) {
  const buf = fs.readFileSync(filepath);
  // BOM is 0xEF,0xBB,0xBF
  return !(buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF);
}

function checkFieldOrder(obj, filepath, idx) {
  const keys = Object.keys(obj);
  for (let i = 0; i < FIELD_ORDER.length; i++) {
    if (keys[i] !== FIELD_ORDER[i]) {
      errors.push(`${filepath}${idx !== null ? `[${idx}]` : ''}: Field order incorrect. Expected '${FIELD_ORDER[i]}' at position ${i}, found '${keys[i] || 'none'}'.`);
      return;
    }
  }
}

function validateQuestion(q, filepath, idx) {
  // 1. Required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in q)) {
      errors.push(`${filepath}${idx !== null ? `[${idx}]` : ''}: Missing required field '${field}'.`);
    } else if (q[field] === '' || q[field] === null || (Array.isArray(q[field]) && q[field].length === 0)) {
      errors.push(`${filepath}${idx !== null ? `[${idx}]` : ''}: Field '${field}' is empty.`);
    }
  }
  // 2. Data types
  if (typeof q.id !== 'string') errors.push(`${filepath}${idx !== null ? `[${idx}]` : ''}: 'id' should be a string.`);
  if (typeof q.question !== 'string') errors.push(`${filepath}${idx !== null ? `[${idx}]` : ''}: 'question' should be a string.`);
  if (!Array.isArray(q.options)) errors.push(`${filepath}${idx !== null ? `[${idx}]` : ''}: 'options' should be an array.`);
  if (typeof q.correctAnswer !== 'string') errors.push(`${filepath}${idx !== null ? `[${idx}]` : ''}: 'correctAnswer' should be a string.`);
  // 3. Options must be exactly 4
  if (Array.isArray(q.options) && q.options.length !== 4) {
    errors.push(`${filepath}${idx !== null ? `[${idx}]` : ''}: 'options' must have exactly 4 choices.`);
  }
  // 4. correctAnswer must be present and in options
  if (typeof q.correctAnswer === 'string' && (!q.correctAnswer || !q.options.includes(q.correctAnswer))) {
    errors.push(`${filepath}${idx !== null ? `[${idx}]` : ''}: 'correctAnswer' not found in options or is empty.`);
  }
  // 5. Forbidden fields
  FORBIDDEN_FIELDS.forEach(fld => {
    if (Object.prototype.hasOwnProperty.call(q, fld)) {
      errors.push(`${filepath}${idx !== null ? `[${idx}]` : ''}: Forbidden field '${fld}' present.`);
    }
  });
  // 6. Field order
  checkFieldOrder(q, filepath, idx);
}

function validateFile(filepath) {
  // 8. UTF-8 encoding, no BOM
  if (!isUtf8NoBom(filepath)) {
    errors.push(`${filepath}: File has BOM or is not UTF-8 encoded.`);
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    errors.push(`${filepath}: JSON parse error: ${e.message}`);
    return;
  }
  // 5. Formatting: 2-space indent, no trailing commas
  const formatted = JSON.stringify(data, null, 2) + '\n';
  const fileContent = fs.readFileSync(filepath, 'utf8');
  if (fileContent !== formatted) {
    errors.push(`${filepath}: File is not formatted with 2-space indent or has trailing commas.`);
  }
  if (Array.isArray(data)) {
    data.forEach((q, idx) => validateQuestion(q, filepath, idx));
  } else if (typeof data === 'object' && data !== null) {
    validateQuestion(data, filepath, null);
  } else {
    errors.push(`${filepath}: File does not contain a valid question object or array.`);
  }
}

function main() {
  const files = walk(QUESTIONS_DIR);
  files.forEach(validateFile);
  if (duplicateIds.size > 0) {
    errors.push(`Duplicate IDs found: ${Array.from(duplicateIds).join(', ')}`);
  }
  if (errors.length === 0) {
    console.log('All question files passed validation!');
    process.exit(0);
  } else {
    console.error('Validation errors found:');
    errors.forEach(e => console.error(e));
    process.exit(1);
  }
}

main();
