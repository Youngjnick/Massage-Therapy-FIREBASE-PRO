import fs from 'fs';
import { glob } from 'glob';

const QUESTIONS_GLOB = 'src/data/questions/**/*.json';

// Canonical field order and style (sourceFile REMOVED)
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

function getTopicsFromPath(filePath) {
  // Remove src/data/questions/ and .json
  const rel = filePath.replace(/^src\/data\/questions\//, '').replace(/\.json$/, '');
  // Split by / and filter out empty
  return rel.split('/').filter(Boolean);
}

function canonicalizeQuestion(q, topicsFromPath) {
  // Only keep fields in FIELD_ORDER, set missing/empty to null
  const out = {};
  FIELD_ORDER.forEach(field => {
    let v = q[field];
    if (field === 'topics') {
      v = topicsFromPath;
    }
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) v = null;
    out[field] = v;
  });
  return out;
}

function customStringify(data) {
  // Use JSON.stringify with a replacer to compact topics only
  return JSON.stringify(data, (key, value) => {
    if (key === 'topics' && Array.isArray(value)) {
      // Tag with a special marker for post-processing
      return { __compact: true, arr: value };
    }
    return value;
  }, 2).replace(/\{\s*"__compact": true,\s*"arr": \[(.*?)\]\s*\}/gs, (m, arr) => {
    // Remove newlines and extra spaces in the array
    return `[${arr.replace(/\s+/g, ' ').trim()}]`;
  });
}

const run = async () => {
  const files = await glob(QUESTIONS_GLOB);
  let changed = 0;
  let errors = 0;
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let data = JSON.parse(content);
      if (Array.isArray(data)) {
        const topicsFromPath = getTopicsFromPath(file);
        data = data.map(q => canonicalizeQuestion(q, topicsFromPath));
        fs.writeFileSync(file, customStringify(data) + '\n', 'utf8');
        changed++;
      }
    } catch (e) {
      console.error(`Error formatting ${file}: ${e.message}`);
      errors++;
    }
  }
  console.log(`Standardized ${changed} JSON files.${errors ? ` ${errors} errors encountered.` : ''}`);
};

run();
