// src/__tests__/question_required_fields.test.js
const fs = require('fs');
const path = require('path');

describe('All questions have required fields', () => {
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

  const questionsDir = path.join(__dirname, '../data/questions');
  const jsonFiles = findJsonFiles(questionsDir);

  jsonFiles.forEach(file => {
    test(`Validates required fields in ${file}`, () => {
      const content = fs.readFileSync(file, 'utf8');
      let data;
      try {
        data = JSON.parse(content);
      } catch (e) {
        throw new Error(`Invalid JSON in ${file}: ${e.message}`);
      }
      expect(Array.isArray(data)).toBe(true);
      data.forEach(q => {
        expect(q).toHaveProperty('correctAnswer');
        expect(typeof q.correctAnswer).toBe('string');
        expect(q).toHaveProperty('question');
        expect(typeof q.question).toBe('string');
        expect(q).toHaveProperty('options');
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBeGreaterThan(1);
      });
    });
  });
});
