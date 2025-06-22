import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const QUESTIONS_GLOB = 'src/data/questions/**/*.json';
const errors = [];
const changes = [];
const renames = [];

// Helper to normalize filenames: lowercase, remove apostrophes, replace non-alphanum (except _) with _, collapse multiple _
function normalizeFilename(filename) {
  return filename
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const run = async () => {
  const files = await glob(QUESTIONS_GLOB);
  for (const file of files) {
    const dir = path.dirname(file);
    const base = path.basename(file);
    const ext = path.extname(base);
    const baseNoExt = path.basename(base, ext);
    const normalizedBase = normalizeFilename(baseNoExt) + ext;
    let newPath = path.join(dir, normalizedBase);
    // Only rename if the normalized filename is different
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
      const content = fs.readFileSync(newPath, 'utf8');
      data = JSON.parse(content);
    } catch {
      errors.push({ file: newPath, error: 'Invalid JSON or read error' });
      continue;
    }
    if (!Array.isArray(data) || data.length === 0) continue;
    let changed = false;
    // Use normalized filename (without extension) as prefix for ID
    const cleanBase = path.basename(normalizedBase, '.json');
    data.forEach((q, idx) => {
      const newId = `${cleanBase}_${String(idx + 1).padStart(3, '0')}`;
      if (q.id !== newId) {
        changes.push(`${newPath}: ${q.id} => ${newId}`);
        q.id = newId;
        changed = true;
      }
    });
    if (changed) {
      try {
        fs.writeFileSync(newPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
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
