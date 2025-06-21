const fs = require('fs');
const path = require('path');

describe('Question JSON validation', () => {
  // Recursively find all .json files in a directory
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

  // Helper to get the cleaned base filename (no extension)
  function getCleanBaseName(filePath) {
    return path.basename(filePath, '.json').replace(/[^a-zA-Z0-9_]/g, '');
  }

  const questionsDir = path.join(__dirname, '../data/questions');
  const jsonFiles = findJsonFiles(questionsDir);

  test('All question IDs are unique across all files', () => {
    const idToFiles = {};
    const duplicateIds = [];
    jsonFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(content);
      data.forEach(q => {
        if (!idToFiles[q.id]) {
          idToFiles[q.id] = [];
        }
        idToFiles[q.id].push(file);
      });
    });
    Object.entries(idToFiles).forEach(([id, files]) => {
      if (files.length > 1) {
        duplicateIds.push({ id, files });
      }
    });
    if (duplicateIds.length > 0) {
      console.error('Duplicate IDs found (with files):');
      duplicateIds.forEach(d => {
        console.error(`ID: ${d.id}`);
        d.files.forEach(f => console.error(`  - ${f}`));
      });
    }
    expect(duplicateIds.length).toBe(0);
  });

  test('All question IDs start with their cleaned up filename', () => {
    const badIds = [];
    jsonFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(content);
      const base = getCleanBaseName(file);
      data.forEach(q => {
        if (!q.id.startsWith(base + '_')) {
          badIds.push({ id: q.id, file, expectedPrefix: base + '_' });
        }
      });
    });
    if (badIds.length > 0) {
      console.error('IDs not matching filename prefix:', badIds);
    }
    expect(badIds.length).toBe(0);
  });

  jsonFiles.forEach(file => {
    test(`Validates ${file}`, () => {
      const content = fs.readFileSync(file, 'utf8');
      let data;
      try {
        data = JSON.parse(content);
      } catch (e) {
        throw new Error(`Invalid JSON in ${file}: ${e.message}`);
      }
      expect(Array.isArray(data)).toBe(true);
      data.forEach(q => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('question');
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBeGreaterThan(1);
        expect(q).toHaveProperty('correctAnswer');
      });
      // Ensure the file has at least one question
      expect(data.length).toBeGreaterThan(0);

      // Ensure 2-space indentation and trailing newline
      // const formatted = JSON.stringify(data, null, 2) + '\n';
      // expect(content.endsWith('\n')).toBe(true);
      // expect(content).toBe(formatted);
    });
  });
});
