// scripts/format_and_organize_questions.js
// Merged script: normalizes filenames, IDs, topics, and field order for all question JSONs
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const QUESTIONS_GLOB = 'src/data/questions/**/*.json';
const FIELD_ORDER = [
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

// Helper to normalize filenames: lowercase, remove apostrophes, replace non-alphanum (except _) with _, collapse multiple _
function normalizeFilename(filename) {
  return filename
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getTopicsFromPath(filePath) {
  const rel = filePath.replace(/^src\/data\/questions\//, '').replace(/\.json$/, '');
  return rel.split('/').filter(Boolean);
}

function canonicalizeQuestion(q, topicsFromPath) {
  const out = {};
  FIELD_ORDER.forEach(field => {
    let v = q[field];
    if (field === 'topics') v = topicsFromPath;
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) v = null;
    out[field] = v;
  });
  // Remove any legacy 'topic' field
  if ('topic' in q) delete q.topic;
  return out;
}

function customStringify(data) {
  return JSON.stringify(data, (key, value) => {
    if (key === 'topics' && Array.isArray(value)) {
      return { __compact: true, arr: value };
    }
    return value;
  }, 2).replace(/\{\s*"__compact": true,\s*"arr": \[(.*?)\]\s*\}/gs, (m, arr) => {
    return `[${arr.replace(/\s+/g, ' ').trim()}]`;
  });
}

// Build regex for invisible/control characters (excluding tab, newline, carriage return)
const INVISIBLE_CHAR_REGEX = new RegExp('[\u200B\uFEFF' +
  '\u0000-\u0008' +
  '\u000B' +
  '\u000C' +
  '\u000E-\u001F' +
  '\u007F' +
']', 'g');
function stripBOMandInvisible(str) {
  // Remove BOM if present and invisible chars
  return str.replace(/^\uFEFF/, '').replace(INVISIBLE_CHAR_REGEX, '');
}

const errors = [];
const changes = [];
const renames = [];

const run = async () => {
  const files = await glob(QUESTIONS_GLOB);
  for (const file of files) {
    const dir = path.dirname(file);
    const base = path.basename(file);
    const ext = path.extname(base);
    const baseNoExt = path.basename(base, ext);
    const normalizedBase = normalizeFilename(baseNoExt) + ext;
    let newPath = path.join(dir, normalizedBase);
    // Rename file if needed
    if (base !== normalizedBase) {
      try {
        fs.renameSync(file, newPath);
        renames.push(`${file} => ${newPath}`);
      } catch {
        errors.push({ file, error: 'Rename error' });
        continue;
      }
    } else {
      newPath = file;
    }
    let data;
    try {
      let content = fs.readFileSync(newPath, 'utf8');
      const originalContent = content;
      content = stripBOMandInvisible(content);
      if (content !== originalContent) {
        console.log(`Stripped BOM/invisible chars from: ${newPath}`);
      }
      data = JSON.parse(content);
    } catch {
      errors.push({ file: newPath, error: 'Invalid JSON or read error' });
      continue;
    }
    if (!Array.isArray(data) || data.length === 0) continue;
    let changed = false;
    const topicsFromPath = getTopicsFromPath(newPath);
    const cleanBase = path.basename(normalizedBase, '.json');
    data.forEach((q, idx) => {
      // Normalize ID
      const newId = `${cleanBase}_${String(idx + 1).padStart(3, '0')}`;
      if (q.id !== newId) {
        changes.push(`${newPath}: ${q.id} => ${newId}`);
        q.id = newId;
        changed = true;
      }
      // Set topics from path
      if (!Array.isArray(q.topics) || q.topics.join('/') !== topicsFromPath.join('/')) {
        q.topics = topicsFromPath;
        changed = true;
      }
    });
    // Canonicalize field order and fill missing fields
    const canonical = data.map(q => canonicalizeQuestion(q, topicsFromPath));
    // Only write if changed or canonicalization differs
    if (changed || JSON.stringify(data) !== JSON.stringify(canonical)) {
      try {
        fs.writeFileSync(newPath, customStringify(canonical) + '\n', 'utf8');
      } catch {
        errors.push({ file: newPath, error: 'Write error' });
      }
    }
  }
  // Log renames
  if (renames.length) {
    console.log('File renames:');
    renames.forEach((r) => console.log(r));
  } else {
    console.log('No file renames made.');
  }
  // Log ID changes
  if (changes.length) {
    console.log('ID/topic changes:');
    changes.forEach((c) => console.log(c));
  } else {
    console.log('No ID/topic changes made.');
  }
  // Log errors
  if (errors.length) {
    console.error('\nErrors:');
    errors.forEach((e) => console.error(`${e.file}: ${e.error}`));
  } else {
    console.log('No errors encountered.');
  }
};

run();
