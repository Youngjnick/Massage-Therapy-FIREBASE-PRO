import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always use project root for crash report
const PROJECT_ROOT = path.resolve(__dirname, '.');
const LOG_PATH = path.join(PROJECT_ROOT, 'fix_and_dedupe_log.txt');

const walk = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filelist);
    } else if (file.endsWith('.json') && !file.endsWith('_fixed.json')) {
      filelist.push(filepath);
    }
  });
  return filelist;
};

const abcd = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const normalize = str => str && str.toLowerCase().replace(/\s+/g, ' ').trim();

const fixQuestion = (q) => {
  const errors = [];
  if (!q.id) errors.push('Missing id');
  if (!q.question) errors.push('Missing question');
  if (!Array.isArray(q.answers)) errors.push('Missing or invalid answers');
  if (typeof q.correct !== 'number' || !q.answers || q.correct < 0 || q.correct >= q.answers.length) errors.push('Invalid correct index');
  if (Array.isArray(q.answers) && q.answers.length < 2) errors.push('Not enough options');
  if (Array.isArray(q.answers) && new Set(q.answers).size !== q.answers.length) errors.push('Duplicate options');
  if (q.correct !== undefined && Array.isArray(q.answers) && typeof q.correct === 'number' && q.answers[q.correct] === undefined) errors.push('Correct index out of range');

  if (errors.length) return { valid: false, errors, original: q, id: q.id };
  // Merge all original fields, but normalize/rename the required ones
  const fixed = {
    ...q,
    text: q.question,
    options: q.answers,
    correctAnswer: q.answers[q.correct],
    abcd: q.answers.map((opt, i) => `${abcd[i] || ''}. ${opt}`)
  };
  return { valid: true, fixed };
};

const dedupeQuestions = (questions) => {
  const seen = new Set();
  const unique = [];
  questions.forEach(q => {
    const key = normalize(q.text) + '|' + q.options.map(normalize).join('|');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(q);
    }
  });
  return unique;
};

function promptUser(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

// Enforce consistent question ID format (e.g., snake_case)
function normalizeQuestionId(id, sourceFile, idx) {
  if (!id && sourceFile && typeof idx === 'number') {
    // If no id, generate one from sourceFile and index
    return `${sourceFile}_${String(idx + 1).padStart(3, '0')}`;
  }
  if (!id) return id;
  // Convert to lower case, replace spaces and non-alphanumerics with underscores, collapse multiple underscores
  return id.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function toSnakeCase(str) {
  return str
    ? str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
    : str;
}

function isSnakeCase(str) {
  return /^[a-z0-9]+(_[a-z0-9]+)*$/.test(str);
}

function logMessage(msg) {
  fs.appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${msg}\n`);
}

// Collect files with issues for summary
const filesWithIssues = new Set();

function logIssue(type, file, message) {
  filesWithIssues.add(file);
  fs.appendFileSync(LOG_PATH, `[${type}] ${file}: ${message}\n`);
}

function cleanQuestion(q, prettifiedSourceFile, idx, filePath) {
  // Only process objects
  if (typeof q !== 'object' || q === null) {
    throw new Error(`Invalid question entry at index ${idx}: not an object. Value: ${JSON.stringify(q)}`);
  }
  // Remove legacy/unused properties
  delete q.filename;
  delete q.answers;
  delete q.correct;
  // Ensure options is present (copy from answers if needed)
  if (!q.options && Array.isArray(q.answers)) q.options = q.answers;
  // Ensure correctAnswer is a string matching the correct option
  if (typeof q.correct === 'number' && Array.isArray(q.options)) {
    q.correctAnswer = q.options[q.correct];
  }
  if (!q.correctAnswer && typeof q.correct === 'number' && Array.isArray(q.options)) {
    q.correctAnswer = q.options[q.correct];
  }
  if (Array.isArray(q.options)) {
    q.abcd = q.options.map((opt, i) => String.fromCharCode(65 + i) + '. ' + opt);
  }
  // Add/overwrite sourceFile and unit in snake_case
  const snakeSource = toSnakeCase(prettifiedSourceFile);
  q.sourceFile = snakeSource;
  q.unit = snakeSource;
  // Normalize question ID for consistency (sourceFile + number)
  if (q.id) {
    q.id = normalizeQuestionId(q.id, snakeSource, idx);
  } else {
    q.id = normalizeQuestionId(undefined, snakeSource, idx);
  }
  return q;
}

function validateQuestion(q, file, idx) {
  const errors = [];
  const warnings = [];
  if (!q.id) errors.push('Missing id');
  if (!q.question && !q.text) errors.push('Missing question/text');
  if (!Array.isArray(q.options) || q.options.length < 2) errors.push('Missing or invalid options');
  if (typeof q.correctAnswer !== 'string' || !q.options.includes(q.correctAnswer)) errors.push('Missing or invalid correctAnswer');
  if (!Array.isArray(q.abcd) || q.abcd.length !== q.options.length) errors.push('Missing or invalid abcd');
  if (!q.sourceFile) errors.push('Missing sourceFile');
  // Warn if clinical explanation fields are missing (but do not block cleanup)
  if (!q.short_explanation) warnings.push('Missing short_explanation');
  if (!q.long_explanation) warnings.push('Missing long_explanation');
  if (!q.applied_example) warnings.push('Missing applied_example');
  // Warn if unit or sourceFile is not snake_case (should be fixed, but warn for traceability)
  if (!isSnakeCase(q.sourceFile)) warnings.push(`sourceFile not snake_case: ${q.sourceFile}`);
  if (!isSnakeCase(q.unit)) warnings.push(`unit not snake_case: ${q.unit}`);
  return (errors.length > 0 || warnings.length > 0)
    ? { file, idx, id: q.id, errors, warnings }
    : null;
}

// Helper to show a diff between two questions (basic: show all differing fields)
function diffQuestions(q1, q2) {
  const diffs = [];
  const keys = new Set([...Object.keys(q1), ...Object.keys(q2)]);
  for (const key of keys) {
    if (JSON.stringify(q1[key]) !== JSON.stringify(q2[key])) {
      diffs.push({
        field: key,
        a: q1[key],
        b: q2[key]
      });
    }
  }
  return diffs;
}

// Interactive duplicate review
async function reviewDuplicates(filePath, deduped, removed) {
  if (removed.length === 0) return deduped;
  let questions = [...deduped];
  for (const dup of removed) {
    const origIdx = questions.findIndex(q => q.id === dup.id);
    if (origIdx === -1) continue;
    const orig = questions[origIdx];
    const diffs = diffQuestions(orig, dup);
    if (diffs.length === 0) continue;
    console.log(`\nDuplicate found in ${filePath} [id: ${dup.id || 'unknown'}]`);
    for (const d of diffs) {
      console.log(`Field: ${d.field}\n  Keep (A): ${JSON.stringify(d.a)}\n  Keep (B): ${JSON.stringify(d.b)}`);
    }
    const answer = await new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question('Choose: (a) keep original, (b) keep duplicate, (m) merge manually, (s) skip: ', (ans) => {
        rl.close();
        resolve(ans.trim().toLowerCase());
      });
    });
    if (answer === 'b') {
      questions[origIdx] = dup;
      logMessage(`DUPLICATE REPLACED: ${filePath} [id: ${dup.id}]`);
    } else if (answer === 'm') {
      for (const d of diffs) {
        const fieldAns = await new Promise((resolve) => {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          rl.question(`Field '${d.field}': (a) original, (b) duplicate: `, (ans) => {
            rl.close();
            resolve(ans.trim().toLowerCase());
          });
        });
        if (fieldAns === 'b') questions[origIdx][d.field] = d.b;
      }
      logMessage(`DUPLICATE MERGED: ${filePath} [id: ${dup.id}]`);
    } else if (answer === 's') {
      logMessage(`DUPLICATE SKIPPED: ${filePath} [id: ${dup.id}]`);
    } else {
      logMessage(`DUPLICATE KEPT ORIGINAL: ${filePath} [id: ${dup.id}]`);
    }
  }
  return questions;
}

async function processFile(filePath, interactive = false) {
  logMessage(`Processing: ${filePath}`);
  const raw = fs.readFileSync(filePath, 'utf8');
  let questions;
  try {
    questions = JSON.parse(raw);
  } catch (e) {
    logMessage(`ERROR: Failed to parse JSON in ${filePath}: ${e.message}`);
    return null;
  }
  if (!Array.isArray(questions)) {
    logMessage(`ERROR: File is not an array: ${filePath}`);
    return null;
  }
  const before = JSON.parse(JSON.stringify(questions));
  const baseName = path.basename(filePath, '.json');
  // Clean up all questions
  const errors = [];
  questions = questions.map((q, idx) => {
    try {
      return cleanQuestion(q, baseName, idx, filePath);
    } catch (err) {
      errors.push({ file: filePath, idx, error: err.message });
      logMessage(`ERROR: ${filePath} [${idx}]: ${err.message}`);
      return null;
    }
  }).filter(Boolean);
  // Deduplicate by id
  const seen = new Set();
  const deduped = [];
  const removed = [];
  const validationResults = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const vRes = validateQuestion(q, filePath, i);
    if (vRes) {
      if (vRes.errors.length > 0) logMessage(`ERROR: ${filePath} [${i}]: ${vRes.errors.join('; ')}`);
      if (vRes.warnings.length > 0) logMessage(`WARNING: ${filePath} [${i}]: ${vRes.warnings.join('; ')}`);
      validationResults.push(vRes);
    }
    if (!seen.has(q.id)) {
      seen.add(q.id);
      deduped.push(q);
    } else {
      removed.push(q);
    }
  }
  let finalQuestions = questions;
  if (interactive && removed.length > 0) {
    finalQuestions = await reviewDuplicates(filePath, deduped, removed);
    fs.writeFileSync(filePath, JSON.stringify(finalQuestions, null, 2));
  } else {
    fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
    if (removed.length > 0) {
      removed.forEach((dup, idx) => {
        logMessage(`DUPLICATE FOUND: ${filePath} [id: ${dup.id || 'unknown'}] text: ${dup.text ? dup.text.slice(0, 80) : 'N/A'}`);
      });
      // Write duplicates to a .duplicates.json file for easy review
      const dupPath = filePath.replace(/\.json$/, '.duplicates.json');
      fs.writeFileSync(dupPath, JSON.stringify(removed, null, 2));
      logMessage(`DUPLICATES WRITTEN: ${dupPath}`);
    }
  }
  logMessage(`Finished: ${filePath}`);
  return { before, after: finalQuestions, removed, validationResults, errors };
}

async function fixFilesInDirectory(dir, interactive = false) {
  const files = walk(dir);
  const results = [];
  for (const file of files) {
    try {
      const res = await processFile(file, interactive);
      results.push(res);
    } catch (err) {
      logMessage(`CRASH: ${file}: ${err.message}`);
    }
  }
  return results;
}

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const interactive = process.argv.includes('--interactive');
  fixFilesInDirectory('./src/data/questions', interactive)
    .then(() => {
      console.log('Fix and dedupe complete. See fix_and_dedupe_log.txt for details.');
    })
    .catch((err) => {
      console.error('Error during fix and dedupe:', err);
    });
}

// For local testing: fixFilesInDirectory('./path_to_your_directory').then(console.log).catch(console.error);
export { fixFilesInDirectory, processFile, dedupeQuestions, fixQuestion, normalizeQuestionId, toSnakeCase, isSnakeCase };

// At the end, write a summary of files with issues
if (filesWithIssues.size > 0) {
  fs.appendFileSync(LOG_PATH, `\n=== SUMMARY: Files with issues ===\n`);
  for (const file of filesWithIssues) {
    fs.appendFileSync(LOG_PATH, `${file}\n`);
  }
} else {
  fs.appendFileSync(LOG_PATH, '\nNo issues found in any files.\n');
}
