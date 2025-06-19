/* eslint-env node */
// ESM-compatible upload_questions_to_firestore.js
// Usage: node upload_questions_to_firestore.js

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Recursively walk directory for .json files
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

async function confirmUpload() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Are you sure you want to upload questions to Firestore? (y/n): ', (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

function validateQuestion(q, file, idx) {
  const errors = [];
  if (!q.id) errors.push('Missing id');
  if (!q.question && !q.text) errors.push('Missing question/text');
  if (!Array.isArray(q.options) || q.options.length < 2) errors.push('Missing or invalid options');
  if (typeof q.correctAnswer !== 'string' || !q.options.includes(q.correctAnswer)) errors.push('Missing or invalid correctAnswer');
  if (!Array.isArray(q.abcd) || q.abcd.length !== q.options.length) errors.push('Missing or invalid abcd');
  if (!q.sourceFile) errors.push('Missing sourceFile');
  // Warn if clinical explanation fields are missing (but do not block upload)
  const warnings = [];
  if (!q.short_explanation) warnings.push('Missing short_explanation');
  if (!q.long_explanation) warnings.push('Missing long_explanation');
  if (!q.applied_example) warnings.push('Missing applied_example');
  return (errors.length > 0 || warnings.length > 0)
    ? { file, idx, id: q.id, errors, warnings }
    : null;
}

// Utility to convert to snake_case
function toSnakeCase(str) {
  return str
    ? str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
    : str;
}

// Utility to normalize question ID
function normalizeQuestionId(id, sourceFile, idx) {
  if (!id && sourceFile && typeof idx === 'number') {
    return `${sourceFile}_${String(idx + 1).padStart(3, '0')}`;
  }
  if (!id) return id;
  return id.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

async function uploadQuestions() {
  // Recursively find all .json files under src/data/questions
  const questionsDir = path.join(__dirname, 'src/data/questions');
  const files = walk(questionsDir);
  let total = 0;
  let validationErrors = [];
  let skippedQuestions = [];
  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.warn(`File not found: ${file}`);
      continue;
    }
    const raw = fs.readFileSync(file, 'utf8');
    let questions;
    try {
      questions = JSON.parse(raw);
    } catch {
      // Invalid JSON in file, skipping.
      continue;
    }
    if (!Array.isArray(questions)) continue;
    // Get prettified filename for sourceFile
    const baseName = path.basename(file, '.json');
    const snakeSource = toSnakeCase(baseName);
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      // Debug: print the question object before validation
      console.log('DEBUG: Question object before validation:', JSON.stringify(q, null, 2));
      // Enforce snake_case for sourceFile and unit
      q.sourceFile = snakeSource;
      q.unit = snakeSource;
      // Normalize question ID
      if (q.id) {
        q.id = normalizeQuestionId(q.id, snakeSource, i);
      } else {
        q.id = normalizeQuestionId(undefined, snakeSource, i);
      }
      if (q.filename) delete q.filename;
      // Validate
      const vErr = validateQuestion(q, file, i);
      if (vErr) {
        if (vErr.errors.length > 0) {
          validationErrors.push(vErr);
          skippedQuestions.push({ file, idx: i, id: q.id, errors: vErr.errors, question: q });
          console.warn(`Skipping invalid question in ${file} [index ${i}, id: ${q.id || 'N/A'}]: ${vErr.errors.join(', ')}`);
          continue;
        }
        if (vErr.warnings.length > 0) {
          console.warn(`Warning for question in ${file} [index ${i}, id: ${q.id || 'N/A'}]: ${vErr.warnings.join(', ')}`);
        }
      }
      try {
        console.log(`Uploading: [${q.id}] ${q.text || q.question || ''}`);
        await db.collection('questions').doc(q.id).set(q, { merge: true });
        total++;
      } catch (err) {
        console.error(`Error uploading question ${q.id} from ${file}:`, err);
      }
    }
  }
  if (validationErrors.length > 0) {
    console.log('\nValidation errors summary:');
    validationErrors.forEach(e => {
      console.log(`File: ${e.file}, Index: ${e.idx}, Id: ${e.id || 'N/A'} => ${e.errors.join('; ')}`);
    });
    console.log(`\nTotal invalid questions skipped: ${validationErrors.length}`);
    // Write skipped questions to a JSON file
    fs.writeFileSync(path.join(__dirname, 'skipped_questions.json'), JSON.stringify(skippedQuestions, null, 2));
    console.log(`Skipped questions written to skipped_questions.json`);
  }
  console.log(`Upload complete. Total questions uploaded: ${total}`);
  process.exit(0);
}

(async () => {
  const confirmed = await confirmUpload();
  if (!confirmed) {
    console.log('Upload cancelled. No questions were uploaded.');
    process.exit(0);
  }
  await uploadQuestions();
})();
