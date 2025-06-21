import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const QUESTIONS_GLOB = 'src/data/questions/**/*.json';
const errors = [];
const changes = [];

const run = async () => {
  const files = await glob(QUESTIONS_GLOB);
  for (const file of files) {
    let data;
    try {
      const content = fs.readFileSync(file, 'utf8');
      data = JSON.parse(content);
    } catch {
      errors.push({ file, error: 'Invalid JSON or read error' });
      continue;
    }
    if (!Array.isArray(data) || data.length === 0) continue;
    const base = path.basename(file, '.json');
    let changed = false;
    data.forEach((q, idx) => {
      const newId = `${base}_${String(idx + 1).padStart(3, '0')}`;
      if (q.id !== newId) {
        changes.push(`${file}: ${q.id} => ${newId}`);
        q.id = newId;
        changed = true;
      }
    });
    if (changed) {
      try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
      } catch {
        errors.push({ file, error: 'Write error' });
      }
    }
  }
  // Log changes
  if (changes.length) {
    console.log('ID changes:');
    changes.forEach((c) => console.log(c));
  } else {
    console.log('No ID changes made.');
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
