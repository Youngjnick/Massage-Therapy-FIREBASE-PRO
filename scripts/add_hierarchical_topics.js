// scripts/add_hierarchical_topics.js
// For each question, set topics to reflect the folder/file structure (relative to src/data/questions)

import fs from 'fs';
import { glob } from 'glob';

const QUESTIONS_GLOB = 'src/data/questions/**/*.json';

function getTopicsFromPath(filePath) {
  // Remove src/data/questions/ and .json
  const rel = filePath.replace(/^src\/data\/questions\//, '').replace(/\.json$/, '');
  // Split by / and filter out empty
  return rel.split('/').filter(Boolean);
}

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
        const topics = getTopicsFromPath(file);
        data = data.map(q => {
          if (!Array.isArray(q.topics) || q.topics.join('/') !== topics.join('/')) {
            q.topics = topics;
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
