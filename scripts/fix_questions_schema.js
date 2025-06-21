// fix_questions_schema.js
// Script to fix field order, required fields, types, formatting, and preserve extra metadata in question JSON files.
// Usage: node scripts/fix_questions_schema.js

const fs = require('fs');
const path = require('path');

const QUESTIONS_ROOT = path.join(__dirname, '../src/data/questions');
const REQUIRED_FIELDS = ['id', 'question', 'options', 'correctAnswer'];

let allIds = new Set();
let duplicateIds = new Set();

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

function fixQuestionObject(obj, filePath) {
  // Collect extra fields
  const extraFields = Object.keys(obj).filter(
    k => !REQUIRED_FIELDS.includes(k)
  );
  // Merge options from answer_options or answers if needed
  let options = Array.isArray(obj.options) ? obj.options.slice() : [];
  if ((options.length === 0 || !Array.isArray(obj.options)) && Array.isArray(obj.answer_options)) {
    options = obj.answer_options.slice();
  }
  // Merge 'answers' field into options if present
  if (Array.isArray(obj.answers) && obj.answers.length > 0) {
    options = obj.answers.slice();
    // Remove 'answers' field after merging
    delete obj.answers;
  }
  // Ensure options is exactly 4 choices
  if (options.length < 4) {
    while (options.length < 4) options.push("");
  } else if (options.length > 4) {
    options = options.slice(0, 4);
  }
  // Remove duplicate options (keep order)
  options = options.filter((v, i, a) => a.findIndex(t => t.trim().toLowerCase() === v.trim().toLowerCase()) === i);
  // Pad again if deduplication made < 4
  while (options.length < 4) options.push("");
  // Build new object in required order
  const newObj = {};
  for (const field of REQUIRED_FIELDS) {
    if (field === 'options') newObj.options = options.map(opt => typeof opt === 'string' ? opt.trim() : '');
    else if (obj[field] === undefined) newObj[field] = '';
    else newObj[field] = obj[field];
  }
  // Merge 'correct' field into correctAnswer if present and valid
  if (typeof obj.correct === 'string' && obj.correct.trim() !== '') {
    newObj.correctAnswer = obj.correct;
    // Remove 'correct' field after merging
    delete obj.correct;
  } else if (Object.prototype.hasOwnProperty.call(obj, 'correct')) {
    // Remove 'correct' field if present but not valid
    delete obj.correct;
  }
  // Correct correctAnswer if not in options
  let found = newObj.options.includes(newObj.correctAnswer);
  if (!found && typeof newObj.correctAnswer === 'string') {
    // Try case-insensitive match
    const idx = newObj.options.findIndex(opt => opt.trim().toLowerCase() === newObj.correctAnswer.trim().toLowerCase());
    if (idx !== -1) {
      newObj.correctAnswer = newObj.options[idx];
      found = true;
    }
  }
  if (!found) {
    // If not found, set to empty string and add a searchable comment
    const oldAnswer = newObj.correctAnswer;
    newObj.correctAnswer = '';
    newObj.FIXME_CORRECT_ANSWER = `Could not find correct answer ('${oldAnswer}') in options for id: ${newObj.id}`;
  }
  // Merge topic, maintopic, topics into topics array
  let topics = [];
  if (Array.isArray(obj.topics)) topics = topics.concat(obj.topics.map(String));
  if (typeof obj.topics === 'string') topics.push(obj.topics);
  if (typeof obj.topic === 'string') topics.push(obj.topic);
  if (Array.isArray(obj.topic)) topics = topics.concat(obj.topic.map(String));
  if (typeof obj.maintopic === 'string') topics.push(obj.maintopic);
  if (Array.isArray(obj.maintopic)) topics = topics.concat(obj.maintopic.map(String));
  // Standardize: split on slashes, capitalize, deduplicate
  topics = topics.flatMap(t => t.split('/')).map(s => capitalize(s.trim())).filter(Boolean);
  topics = Array.from(new Set(topics));
  // Merge subtopic, subtopics, etc. into subtopics array
  let subtopics = [];
  if (Array.isArray(obj.subtopics)) subtopics = subtopics.concat(obj.subtopics.map(String));
  if (typeof obj.subtopics === 'string') subtopics.push(obj.subtopics);
  if (typeof obj.subtopic === 'string') subtopics.push(obj.subtopic);
  if (Array.isArray(obj.subtopic)) subtopics = subtopics.concat(obj.subtopic.map(String));
  // Standardize: split on slashes, capitalize, deduplicate
  subtopics = subtopics.flatMap(t => t.split('/')).map(s => capitalize(s.trim())).filter(Boolean);
  subtopics = Array.from(new Set(subtopics));
  // Auto-fill topics/subtopics from file path if empty
  if (filePath) {
    const relPath = path.relative(QUESTIONS_ROOT, filePath);
    const parts = relPath.split(path.sep);
    if (topics.length === 0 && parts.length > 0) {
      topics = [capitalize(parts[0])];
    }
    if (subtopics.length === 0 && parts.length > 1) {
      subtopics = [capitalize(parts[1])];
    }
  }
  newObj.topics = topics;
  newObj.subtopics = subtopics;
  // Add extra fields at the end, skipping only truly forbidden fields
  const ALWAYS_KEEP_FIELDS = [
    'synonyms',
    'short_explanation',
    'long_explanation',
    'applied_example',
    'clinical_application',
    'tags',
    'keywords',
    'category',
    'subcategory',
    'difficulty',
    'difficulty_rating',
    'question_type',
    'mblex_category',
    'source_reference',
    'main_topic',
    'unit',
    'sourceFile',
    'filepath',
    // add more as needed
  ];
  const FORBIDDEN_FIELDS = [
    'topics', 'topic', 'maintopic', 'subtopics', 'subtopic',
    'answer_options', 'abcd', 'text', 'answers', 'correct'
  ];
  for (const field of extraFields) {
    if (field === 'filename') {
      // skip filename field
      continue;
    }
    if (ALWAYS_KEEP_FIELDS.includes(field)) {
      newObj[field] = obj[field];
    } else if (!FORBIDDEN_FIELDS.includes(field)) {
      newObj[field] = obj[field];
      // Optionally, log a warning if a new/unknown field is encountered
      // console.warn(`Preserved extra field: ${field}`);
    } else {
      // Optionally, log a warning if a forbidden field is dropped
      // console.warn(`Dropped forbidden field: ${field}`);
    }
  }
  // Type checks
  if (!Array.isArray(newObj.options)) newObj.options = [];
  if (typeof newObj.id !== 'string') newObj.id = String(newObj.id || '');
  if (typeof newObj.question !== 'string') newObj.question = String(newObj.question || '');
  if (typeof newObj.correctAnswer !== 'string') newObj.correctAnswer = String(newObj.correctAnswer || '');
  // Remove empty/placeholder values for required fields
  for (const field of REQUIRED_FIELDS) {
    if (newObj[field] === '' || (Array.isArray(newObj[field]) && newObj[field].length === 0)) {
      // Optionally log or handle missing data
    }
  }
  // Track IDs for uniqueness
  if (allIds.has(newObj.id)) {
    duplicateIds.add(newObj.id);
  } else {
    allIds.add(newObj.id);
  }
  return newObj;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function processFile(filePath) {
  let changed = false;
  let data = fs.readFileSync(filePath, 'utf8');
  let json;
  try {
    json = JSON.parse(data);
  } catch {
    console.error('Invalid JSON:', filePath);
    return;
  }
  // If file is an array of questions
  if (Array.isArray(json)) {
    const newArr = json.map(q => fixQuestionObject(q, filePath));
    data = JSON.stringify(newArr, null, 2) + '\n';
    changed = true;
  } else if (typeof json === 'object') {
    const newObj = fixQuestionObject(json, filePath);
    data = JSON.stringify(newObj, null, 2) + '\n';
    changed = true;
  }
  // Write back if changed
  if (changed) {
    fs.writeFileSync(filePath, data, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function main() {
  const files = walk(QUESTIONS_ROOT);
  files.forEach(processFile);
  if (duplicateIds.size > 0) {
    console.warn('Duplicate IDs found:', Array.from(duplicateIds));
  }
}

main();
