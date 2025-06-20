// scripts/auto_fix_skipped_questions.js
// This script merges and standardizes skipped questions into their main question files.
// It ensures no duplicates, preserves all metadata, and only merges valid questions.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeQuestionFields } from '../questionUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SKIPPED_DIR = path.join(__dirname, '../skipped_questions');
// Change DATA_DIR to the true root of all question files
const DATA_DIR = path.join(__dirname, '../src/data/questions');

function getAllFiles(dir, ext = '.json') {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, ext));
    } else if (file.endsWith(ext)) {
      results.push(filePath);
    }
  });
  return results;
}

function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('Failed to parse', file, e);
    return [];
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function mergeQuestions(main, skipped) {
  const byId = {};
  main.forEach(q => { if (q.id) byId[q.id] = normalizeQuestionFields(q); });
  skipped.forEach(q => {
    q = normalizeQuestionFields(q);
    if (q.id && !byId[q.id]) {
      byId[q.id] = q;
    }
  });
  return Object.values(byId);
}

function findMainFileForSkipped(skippedFile) {
  const base = path.basename(skippedFile);
  const allMainFiles = getAllFiles(DATA_DIR);
  console.log('Looking for main file for:', base);
  console.log('Candidate files:');
  allMainFiles.forEach(f => console.log('  ', f));
  // Try to match by filename first
  for (const file of allMainFiles) {
    if (path.basename(file) === base) {
      console.log('Matched by filename:', file);
      return file;
    }
  }
  // Try to match by ignoring underscores and dashes
  const baseSimple = base.replace(/[_-]/g, '').toLowerCase();
  for (const file of allMainFiles) {
    const fileSimple = path.basename(file).replace(/[_-]/g, '').toLowerCase();
    if (fileSimple === baseSimple) {
      console.log('Matched by simplified filename:', file);
      return file;
    }
  }
  // Try to match by relative path from DATA_DIR (e.g. subdir/filename)
  const skippedRel = path.relative(SKIPPED_DIR, skippedFile).replace(/\\/g, '/');
  for (const file of allMainFiles) {
    const rel = path.relative(DATA_DIR, file).replace(/\\/g, '/');
    if (rel.endsWith(skippedRel)) {
      console.log('Matched by relative path:', file);
      return file;
    }
  }
  // Try to match by filename in the full path
  for (const file of allMainFiles) {
    if (file.includes(base)) {
      console.log('Matched by filename in path:', file);
      return file;
    }
  }
  console.warn('No match found for', base);
  return null;
}

// Diagnostic: List contents of the skin layers directory
const skinLayersDir = path.join(DATA_DIR, 'anatomy/muscle_fascia_and_connective_tissue/skin layers');
if (fs.existsSync(skinLayersDir)) {
  console.log('Contents of skin layers directory:');
  fs.readdirSync(skinLayersDir).forEach(f => console.log('  ', f));
} else {
  console.warn('skin layers directory does not exist:', skinLayersDir);
}

// Diagnostic: List all directories under anatomy/muscle_fascia_and_connective_tissue
const mfctDir = path.join(DATA_DIR, 'anatomy/muscle_fascia_and_connective_tissue');
if (fs.existsSync(mfctDir)) {
  console.log('Directories under muscle_fascia_and_connective_tissue:');
  fs.readdirSync(mfctDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .forEach(dirent => console.log('  ', dirent.name));
} else {
  console.warn('muscle_fascia_and_connective_tissue directory does not exist:', mfctDir);
}

function main() {
  const skippedFiles = getAllFiles(SKIPPED_DIR);
  skippedFiles.forEach(skippedFile => {
    const skippedQuestions = loadJSON(skippedFile);
    if (!Array.isArray(skippedQuestions) || skippedQuestions.length === 0) return;
    const mainFile = findMainFileForSkipped(skippedFile);
    if (!mainFile) {
      console.warn('No main file found for', skippedFile);
      return;
    }
    const mainQuestions = loadJSON(mainFile);
    const merged = mergeQuestions(mainQuestions, skippedQuestions);
    saveJSON(mainFile, merged);
    console.log(`Merged ${skippedQuestions.length} skipped questions into ${mainFile}`);
  });
}

main();
