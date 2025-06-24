/* eslint-env node */
// ESM-compatible upload_questions_to_firestore_2.js
// Usage: node upload_questions_to_firestore_2.js

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
// import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../serviceAccountKey.json'), 'utf8')
);
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
  // Require all canonical fields
  const requiredFields = [
    'id',
    'question',
    'correctAnswer',
    'options',
    'topics',
    'short_explanation',
    'long_explanation',
    'clinical_application',
    'source_reference',
    'filepath',
    'question_type',
    'difficulty',
    'difficulty_rating',
    'difficulty_adjustment',
    'relevance_score',
    'created_at',
    'updated_at',
    'tags',
    'keywords',
    'synonyms'
  ];
  requiredFields.forEach(field => {
    // Only error if field is undefined (not present at all), but allow null or empty
    if (q[field] === undefined) {
      errors.push(`Missing ${field}`);
    }
  });
  // Additional checks for options/correctAnswer
  if (!Array.isArray(q.options) || q.options.length < 2) errors.push('Missing or invalid options');
  if (typeof q.correctAnswer !== 'string' || !Array.isArray(q.options) || !q.options.includes(q.correctAnswer)) {
    errors.push('Missing or invalid correctAnswer');
  }
  return (errors.length > 0)
    ? { file, idx, id: q.id, errors, warnings: [] }
    : null;
}

function toSnakeCase(str) {
  return str
    ? str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
    : str;
}

function normalizeQuestionId(id, fileBase, idx) {
  if (!id && fileBase && typeof idx === 'number') {
    return `${fileBase}_${String(idx + 1).padStart(3, '0')}`;
  }
  if (!id) return id;
  return id.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

const FIELD_ORDER = [
  'id',
  'correctAnswer',
  'question',
  'options',
  'topics',
  'short_explanation',
  'long_explanation',
  'clinical_application',
  'source_reference',
  'filepath',
  'question_type',
  'difficulty',
  'difficulty_rating',
  'difficulty_adjustment',
  'relevance_score',
  'created_at',
  'updated_at',
  'tags',
  'keywords',
  'synonyms'
];

function canonicalizeQuestion(q) {
  const out = {};
  FIELD_ORDER.forEach(field => {
    let v = q[field];
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) v = null;
    out[field] = v;
  });
  return out;
}

async function uploadQuestions() {
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
      continue;
    }
    if (!Array.isArray(questions)) continue;
    const baseName = path.basename(file, '.json');
    const snakeSource = toSnakeCase(baseName);
    for (let i = 0; i < questions.length; i++) {
      let q = questions[i];
      // Normalize answer_options to options if needed
      if (!q.options && Array.isArray(q.answer_options)) {
        q.options = q.answer_options;
      }
      // abcd is no longer generated or used
      q.unit = snakeSource;
      if (q.id) {
        q.id = normalizeQuestionId(q.id, snakeSource, i);
      } else {
        q.id = normalizeQuestionId(undefined, snakeSource, i);
      }
      if (q.filename) delete q.filename;
      const vErr = validateQuestion(q, file, i);
      if (vErr) {
        if (vErr.errors.length > 0) {
          validationErrors.push(vErr);
          skippedQuestions.push(q);
        }
        if (vErr.warnings.length > 0) {
          console.warn(`Warning for question in ${file} [index ${i}, id: ${q.id}]: ${vErr.warnings.join('; ')}`);
        }
        continue;
      }
      // Canonicalize question to match field order and nulls
      q = canonicalizeQuestion(q);
      // Uncomment to enable actual upload
      try {
        console.log(`Uploading: [${q.id}] ${q.text || q.question || ''}`);
        await db.collection('questions').doc(q.id).set(q, { merge: true });
        total++;
      } catch (err) {
        console.error(`Failed to upload question [${q.id}]:`, err);
      }
      // console.log(`Dry run: Skipping upload for question [${q.id}]`);
    }
  }
  if (validationErrors.length > 0) {
    console.log('\nValidation errors summary:');
    validationErrors.forEach(e => {
      console.log(`File: ${e.file}, Index: ${e.idx}, Id: ${e.id || 'N/A'} => ${e.errors.join('; ')}`);
    });
    console.log(`\nTotal invalid questions skipped: ${validationErrors.length}`);
    // --- FIXED LOGIC BELOW ---
    const skippedDir = path.join(__dirname, 'skipped_questions');
    if (!fs.existsSync(skippedDir)) {
      fs.mkdirSync(skippedDir);
    }
    const grouped = {};
    skippedQuestions.forEach(q => {
      // Use q.unit or fallback to 'unknown' for skipped file grouping
      let fileName = (q.unit ? q.unit : 'unknown') + '.json';
      if (!grouped[fileName]) grouped[fileName] = [];
      grouped[fileName].push(q);
    });
    Object.entries(grouped).forEach(([fileName, questions]) => {
      fs.writeFileSync(path.join(skippedDir, fileName), JSON.stringify(questions, null, 2));
    });
    console.log(`Skipped questions grouped and written to ${skippedDir}`);
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
