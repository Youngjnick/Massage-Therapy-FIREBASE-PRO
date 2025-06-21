import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const QUESTIONS_GLOB = 'src/data/questions/**/*.json';
const errors = [];
const changes = [];
const renames = [];

const run = async () => {
  const files = await glob(QUESTIONS_GLOB);
  for (const file of files) {
    const dir = path.dirname(file);
    const base = path.basename(file);
    const newBase = base.replace(/'/g, ''); // Remove apostrophes
    if (base !== newBase) {
      const newPath = path.join(dir, newBase);
      try {
        fs.renameSync(file, newPath);
        renames.push(`${file} => ${newPath}`);
      } catch {
        errors.push({ file, error: 'Rename error' });
        continue;
      }
    }
    let data;
    try {
      const content = fs.readFileSync(path.join(dir, newBase), 'utf8');
      data = JSON.parse(content);
    } catch {
      errors.push({ file: path.join(dir, newBase), error: 'Invalid JSON or read error' });
      continue;
    }
    if (!Array.isArray(data) || data.length === 0) continue;
    let changed = false;
    // --- UPDATED: Use cleaned-up filename as prefix for ID ---
    const cleanBase = path.basename(newBase, '.json').replace(/[^a-zA-Z0-9_]/g, '_');
    data.forEach((q, idx) => {
      const newId = `${cleanBase}_${String(idx + 1).padStart(3, '0')}`;
      if (q.id !== newId) {
        changes.push(`${path.join(dir, newBase)}: ${q.id} => ${newId}`);
        q.id = newId;
        changed = true;
      }
    });
    // --- END UPDATED ---
    if (changed) {
      try {
        fs.writeFileSync(path.join(dir, newBase), JSON.stringify(data, null, 2) + '\n', 'utf8');
      } catch {
        errors.push({ file: path.join(dir, newBase), error: 'Write error' });
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
