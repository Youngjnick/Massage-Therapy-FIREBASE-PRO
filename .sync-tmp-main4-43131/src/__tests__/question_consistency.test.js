const fs = require('fs');
const path = require('path');

describe('Question JSON Consistency', () => {
  // Recursively find all JSON files in the questions directory
  function findJsonFiles(dir) {
    let results = [];
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(findJsonFiles(filePath));
      } else if (file.endsWith('.json')) {
        results.push(filePath);
      }
    });
    return results;
  }

  // Use the correct path for your project structure
  const questionsDir = path.join(__dirname, '../data/questions');
  const jsonFiles = findJsonFiles(questionsDir);

  function forEachQuestion(json, cb) {
    if (Array.isArray(json)) {
      json.forEach(cb);
    } else if (json && typeof json === 'object') {
      cb(json);
    }
  }

  test('All question JSONs have matching lowercase IDs and filenames', () => {
    jsonFiles.forEach(filePath => {
      const fileName = path.basename(filePath, '.json');
      const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      forEachQuestion(json, q => {
        if (typeof q.id === 'undefined') {
          console.error(`Missing id in: ${filePath}`);
        }
        expect(q.id).toBeDefined();
        expect(typeof q.id).toBe('string');
        // Optionally, check that id starts with the filename prefix
        expect(q.id.startsWith(fileName)).toBe(true);
        expect(q.id).toBe(q.id.toLowerCase());
      });
    });
  });

  test('All question JSONs use only allowed fields', () => {
    const allowedFields = [
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
    let hasExtraFields = false;
    jsonFiles.forEach(filePath => {
      const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      forEachQuestion(json, q => {
        Object.keys(q).forEach(key => {
          if (!allowedFields.includes(key)) {
            hasExtraFields = true;
            console.error(`Extra field '${key}' in: ${filePath}`);
          }
          expect(allowedFields.includes(key)).toBe(true);
        });
      });
    });
    if (hasExtraFields) {
      throw new Error('Some question JSONs have extra fields. See console for details.');
    }
  });

  test('No duplicate IDs across all question JSONs', () => {
    const ids = {};
    jsonFiles.forEach(filePath => {
      const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      forEachQuestion(json, q => {
        expect(ids[q.id]).toBeUndefined();
        ids[q.id] = filePath;
      });
    });
  });
});
