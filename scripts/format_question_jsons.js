import fs from 'fs';
import { glob } from 'glob';

const QUESTIONS_GLOB = 'src/data/questions/**/*.json';

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
  'sourceFile',
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
  // Merge applied_example into clinical_application if needed
  if (
    Object.prototype.hasOwnProperty.call(q, 'applied_example') &&
    (!Object.prototype.hasOwnProperty.call(q, 'clinical_application') || q['clinical_application'] == null || q['clinical_application'] === '')
  ) {
    q['clinical_application'] = q['applied_example'];
  }
  // Lowercase all topics if present
  if (Array.isArray(q.topics)) {
    q.topics = q.topics.map(t => typeof t === 'string' ? t.toLowerCase() : t);
  }
  // Only keep fields in FIELD_ORDER, set missing/empty to null
  const out = {};
  FIELD_ORDER.forEach(field => {
    let v = q[field];
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
        data = data.map(canonicalizeQuestion);
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
