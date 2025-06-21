// scripts/remove_subtopics.js
// Removes the subtopics field from all question JSON files and ensures topics is an array of strings.

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
          // Remove subtopics
          if ('subtopics' in q) {
            delete q.subtopics;
            updated = true;
          }
          // Ensure topics is an array of strings (if not null)
          if (q.topics === null || q.topics === undefined) {
            q.topics = null;
          } else if (Array.isArray(q.topics)) {
            q.topics = q.topics.map(t => typeof t === 'string' ? t : String(t));
            updated = true;
          } else if (typeof q.topics === 'string') {
            q.topics = [q.topics];
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
  console.log(`Updated ${changed} files.${errors ? ` ${errors} errors encountered.` : ''}`);
}

run();
