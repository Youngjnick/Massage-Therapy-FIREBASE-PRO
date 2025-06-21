// src/__tests__/question_consistency.test.js
const fs = require('fs');
const path = require('path');

describe('Question options/answers consistency and uniqueness', () => {
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
    test(`Options/answers consistency and uniqueness in ${file}`, () => {
      const content = fs.readFileSync(file, 'utf8');
      let data;
      try {
        data = JSON.parse(content);
      } catch (e) {
        throw new Error(`Invalid JSON in ${file}: ${e.message}`);
      }
      expect(Array.isArray(data)).toBe(true);
      data.forEach(q => {
        // Only check for Multiple Choice or similar
        if (
          q.question_type &&
          /multiple\s*choice|mcq|single\s*answer/i.test(q.question_type)
        ) {
          // Options must be a non-empty array
          expect(Array.isArray(q.options)).toBe(true);
          expect(q.options.length).toBeGreaterThan(1);
          // correctAnswer must be present in options
          expect(q.options).toContain(q.correctAnswer);
          // Options must be unique
          const uniqueOptions = new Set(q.options);
          expect(uniqueOptions.size).toBe(q.options.length);
        }
        // No nulls in required fields
        ['id', 'question', 'correctAnswer', 'options'].forEach(field => {
          expect(q[field]).not.toBe(null);
          if (typeof q[field] === 'string') {
            expect(q[field].trim().length).toBeGreaterThan(0);
          }
        });
        // Check that topics and subtopics are null or arrays of lowercase strings
        ['topics', 'subtopics'].forEach(field => {
          if (q[field] !== null && q[field] !== undefined) {
            expect(Array.isArray(q[field])).toBe(true);
            q[field].forEach(item => {
              expect(typeof item).toBe('string');
              expect(item).toBe(item.toLowerCase());
            });
          }
        });
      });
    });
  });
});

// Additional tests for JSON validity and error-free content

describe('Additional JSON validity checks', () => {
  const questionsDir = path.join(__dirname, '../data/questions');
  const jsonFiles = fs.readdirSync(questionsDir).length === 0 ? [] : (function findJsonFiles(dir) {
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
  })(questionsDir);

  // 1. No trailing commas
  jsonFiles.forEach(file => {
    test(`No trailing commas in ${file}`, () => {
      const content = fs.readFileSync(file, 'utf8');
      // Trailing comma before ] or }
      expect(/,\s*[\]}]/.test(content)).toBe(false);
    });
  });

  // 2. No unescaped special characters in strings
  function hasUnescapedControlChars(str) {
    // Control chars except tab, newline, carriage return (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F)
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if ((code >= 0x00 && code <= 0x08) || code === 0x0B || code === 0x0C || (code >= 0x0E && code <= 0x1F)) {
        return true;
      }
    }
    return false;
  }
  jsonFiles.forEach(file => {
    test(`No unescaped control characters in ${file}`, () => {
      const content = fs.readFileSync(file, 'utf8');
      let data;
      try { data = JSON.parse(content); } catch { return; }
      function checkStrings(obj) {
        if (typeof obj === 'string') {
          expect(hasUnescapedControlChars(obj)).toBe(false);
        } else if (Array.isArray(obj)) {
          obj.forEach(checkStrings);
        } else if (obj && typeof obj === 'object') {
          Object.values(obj).forEach(checkStrings);
        }
      }
      checkStrings(data);
    });
  });

  // 3. Consistent option formatting
  jsonFiles.forEach(file => {
    test(`Options are strings and trimmed in ${file}`, () => {
      const content = fs.readFileSync(file, 'utf8');
      let data;
      try { data = JSON.parse(content); } catch { return; }
      data.forEach(q => {
        if (Array.isArray(q.options)) {
          q.options.forEach(opt => {
            expect(typeof opt).toBe('string');
            expect(opt).toBe(opt.trim());
          });
        }
      });
    });
  });

  // 4. No duplicate files (identical content)
  test('No duplicate question files (identical content)', () => {
    const hashes = {};
    const crypto = require('crypto');
    jsonFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8').replace(/\s+/g, '');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      if (hashes[hash]) {
        throw new Error(`Duplicate file content: ${file} and ${hashes[hash]}`);
      }
      hashes[hash] = file;
    });
  });
});
