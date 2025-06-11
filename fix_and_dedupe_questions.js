/* eslint-env node */
import fs from 'fs';
import path from 'path';

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

const processFile = (filepath) => {
  const raw = fs.readFileSync(filepath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    // If file is empty or invalid, write [] and return
    fs.writeFileSync(filepath.replace('.json', '_fixed.json'), '[]');
    return;
  }
  if (!Array.isArray(data)) {
    // If not an array, replace with []
    fs.writeFileSync(filepath, '[]');
    return { filepath, error: 'Not an array, replaced with []' };
  }
  if (data.length === 0) {
    // If already empty, ensure file is []
    fs.writeFileSync(filepath, '[]');
    return { filepath, fixed: 0, invalid: [] };
  }
  const fixed = [], invalid = [];
  data.forEach(q => {
    const res = fixQuestion(q);
    if (res.valid) fixed.push(res.fixed);
    else invalid.push(res);
  });
  // Dedupe after fixing
  const deduped = dedupeQuestions(fixed);
  // Output fixed file, replacing the original file (no _fixed in name)
  fs.writeFileSync(filepath, JSON.stringify(deduped, null, 2));
  return { filepath, fixed: deduped.length, removed: fixed.length - deduped.length, invalid };
};

const main = () => {
  const base = path.join(__dirname, 'src', 'data', 'questions');
  const files = walk(base);
  const report = [];
  files.forEach(f => {
    const res = processFile(f);
    report.push(res);
  });
  fs.writeFileSync(path.join(__dirname, 'fix_and_dedupe_report.json'), JSON.stringify(report, null, 2));
  console.log('Done. See fix_and_dedupe_report.json for details.');
};

main();
