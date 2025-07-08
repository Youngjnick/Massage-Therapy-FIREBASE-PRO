#!/usr/bin/env node
/* eslint-env node */
// ESM-compatible upload_questions_to_firestore_2.js
// Usage: node upload_questions_to_firestore_2.js [e|p]

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../serviceAccountKey.json'), 'utf8')
);
import readline from 'readline';

// Accept CLI argument for target (e=emulator, p=production)
let target = process.argv[2];
if (!target) {
  // Prompt for emulator or production if not provided
  async function promptTarget() {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('Upload to Firestore emulator (e) or production (p)? [e/p]: ', (answer) => {
        rl.close();
        const val = answer.trim().toLowerCase();
        if (val === 'e' || val === 'p') {
          resolve(val);
        } else {
          console.log('Invalid input. Please enter "e" or "p".');
          process.exit(1);
        }
      });
    });
  }
  target = await promptTarget();
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

if (target === 'e') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  db.settings({ host: 'localhost:8080', ssl: false });
  console.log('Uploading to Firestore Emulator at localhost:8080');
} else {
  console.log('Uploading to Firestore Production');
}

// Correctly resolve the questions directory from the project root
const questionsDir = path.join(__dirname, '../src/data/questions');

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
  // Gather all questions from all JSON files for progress tracking
  const files = walk(questionsDir);
  let total = 0;
  let validationErrors = [];
  let skippedQuestions = [];
  let failedQuestions = [];
  let uploadedQuestions = [];
  let allQuestions = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, 'utf8');
    let questions;
    try {
      questions = JSON.parse(raw);
    } catch {
      // If JSON is invalid, skip this file and optionally log an error
      console.error(`Invalid JSON in file: ${file}, skipping.`);
      continue;
    }
    if (!Array.isArray(questions)) continue;
    allQuestions.push(...questions.map((q, i) => ({...q, __file: file, __idx: i})));
  }
  const totalQuestions = allQuestions.length;
  let current = 0;

  // Detect if running against emulator or production
  const isEmulator = (process.env.FIRESTORE_EMULATOR_HOST || '').includes('localhost');

  if (isEmulator) {
    // --- EMULATOR: BULK OVERWRITE USING FIRESTORE BATCH WRITES ---
    const BATCH_SIZE = 500;
    for (let batchStart = 0; batchStart < totalQuestions; batchStart += BATCH_SIZE) {
      const batch = db.batch();
      const batchQuestions = allQuestions.slice(batchStart, batchStart + BATCH_SIZE);
      for (let j = 0; j < batchQuestions.length; j++) {
        current++;
        let q = batchQuestions[j];
        const file = q.__file;
        const i = q.__idx;
        if (!q.options && Array.isArray(q.answer_options)) q.options = q.answer_options;
        const baseName = path.basename(file, '.json');
        const snakeSource = toSnakeCase(baseName);
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
        q = canonicalizeQuestion(q);
        process.stdout.write(`[${current}/${totalQuestions}] Overwriting: [${q.id}]... `);
        const docRef = db.collection('questions').doc(q.id);
        batch.set(docRef, q, { merge: true });
        uploadedQuestions.push(q);
      }
      try {
        await batch.commit();
        process.stdout.write('batch done\n');
        total += batchQuestions.length;
      } catch {
        process.stdout.write('\n');
        for (let j = 0; j < batchQuestions.length; j++) {
          let q = batchQuestions[j];
          const docRef = db.collection('questions').doc(q.id);
          try {
            await docRef.set(q, { merge: true });
            process.stdout.write(`[${batchStart + j + 1}/${totalQuestions}] Overwriting: [${q.id}]... done\n`);
            total++;
          } catch (err2) {
            console.error(`\n[${batchStart + j + 1}/${totalQuestions}] Failed: [${q.id}] -`, err2.message);
            failedQuestions.push({ id: q.id, error: err2.message });
          }
        }
      }
    }
  } else {
    // --- PRODUCTION: MINIMIZE WRITES, ONLY UPDATE IF DIFFERENT ---
    for (const qObj of allQuestions) {
      current++;
      let q = qObj;
      const file = q.__file;
      const i = q.__idx;
      if (!q.options && Array.isArray(q.answer_options)) q.options = q.answer_options;
      const baseName = path.basename(file, '.json');
      const snakeSource = toSnakeCase(baseName);
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
      q = canonicalizeQuestion(q);
      try {
        const docRef = db.collection('questions').doc(q.id);
        const docSnap = await docRef.get();
        let shouldUpdate = true;
        if (docSnap.exists) {
          const remote = docSnap.data();
          const clean = obj => {
            const out = {};
            for (const k in obj) {
              if (obj[k] !== undefined && obj[k] !== null && !(Array.isArray(obj[k]) && obj[k].length === 0)) {
                out[k] = obj[k];
              }
            }
            return out;
          };
          const localClean = clean(q);
          const remoteClean = clean(remote);
          if (JSON.stringify(localClean) === JSON.stringify(remoteClean)) {
            console.log(`[${current}/${totalQuestions}] Skipped (identical): [${q.id}]`);
            skippedQuestions.push(q);
            shouldUpdate = false;
          } else {
            process.stdout.write(`[${current}/${totalQuestions}] Updating: [${q.id}]... `);
          }
        } else {
          process.stdout.write(`[${current}/${totalQuestions}] Uploading: [${q.id}]... `);
        }
        if (shouldUpdate) {
          await docRef.set(q, { merge: true });
          process.stdout.write('done\n');
          total++;
          uploadedQuestions.push(q);
        }
      } catch {
        console.error(`\n[${current}/${totalQuestions}] Failed: [${q.id}] -`, 'Unknown error');
        failedQuestions.push({ id: q.id, error: 'Unknown error' });
      }
    }
  }
  // Validation error reporting and summary
  if (validationErrors.length > 0) {
    console.log('\nValidation errors summary:');
    validationErrors.forEach(e => {
      console.log(`File: ${e.file}, Index: ${e.idx}, Id: ${e.id || 'N/A'} => ${e.errors.join('; ')}`);
    });
    console.log(`\nTotal invalid questions skipped: ${validationErrors.length}`);
    const skippedDir = path.join(__dirname, 'skipped_questions');
    if (!fs.existsSync(skippedDir)) {
      fs.mkdirSync(skippedDir);
    }
    const grouped = {};
    skippedQuestions.forEach(q => {
      let fileName = (q.unit ? q.unit : 'unknown') + '.json';
      if (!grouped[fileName]) grouped[fileName] = [];
      grouped[fileName].push(q);
    });
    Object.entries(grouped).forEach(([fileName, questions]) => {
      fs.writeFileSync(path.join(skippedDir, fileName), JSON.stringify(questions, null, 2));
    });
    console.log(`Skipped questions grouped and written to ${skippedDir}`);
  }
  console.log(`\nUpload complete. Uploaded: ${total}, Failed: ${failedQuestions.length}`);
  if (failedQuestions.length > 0) {
    console.log('Failed questions:');
    failedQuestions.forEach(f => console.log(`- [${f.id}]: ${f.error}`));
  }
  // Open emulator UI if uploading to emulator
  if (target === 'e') {
    const open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    const url = 'http://localhost:4000/firestore/default/data/questions';
    console.log(`Opening Firestore Emulator UI at ${url}...`);
    exec(`${open} ${url}`);
  }
  process.exit(0);
}

uploadQuestions();
