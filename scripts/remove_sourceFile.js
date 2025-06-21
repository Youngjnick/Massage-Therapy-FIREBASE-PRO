// scripts/remove_sourceFile.js
// Removes the sourceFile field from all question JSON files

import fs from 'fs';
import { glob } from 'glob';

const QUESTIONS_GLOB = 'src/data/questions/**/*.json';

async function run() {
  const files = await glob(QUESTIONS_GLOB);
  let changed = 0;
  let errors = 0;
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let data = JSON.parse(content);
      if (Array.isArray(data)) {
        let updated = false;
        data = data.map(q => {
          if ('sourceFile' in q) {
            delete q.sourceFile;
            updated = true;
          }
          return q;
        });
        if (updated) {
          fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
          changed++;
        }
      }
    } catch (e) {
      console.error(`Error processing ${file}: ${e.message}`);
      errors++;
    }
  }
  console.log(`Removed sourceFile from ${changed} files.${errors ? ` ${errors} errors encountered.` : ''}`);
}

run();
