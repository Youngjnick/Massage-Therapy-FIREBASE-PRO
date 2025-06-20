import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing the question JSON files
const questionsDir = path.join(__dirname, '../src/data/questions');

// Recursively process all JSON files in the directory
function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.json')) {
      addFilepathMetadata(fullPath);
    }
  });
}

// Add the filepath metadata to each question object in the JSON file
function addFilepathMetadata(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const questions = JSON.parse(data);

    if (Array.isArray(questions)) {
      const updatedQuestions = questions.map((question) => {
        if (!question.filepath) {
          question.filepath = path.relative(path.join(__dirname, '../src'), filePath);
        }
        return question;
      });

      fs.writeFileSync(filePath, JSON.stringify(updatedQuestions, null, 2), 'utf8');
      console.log(`Updated: ${filePath}`);
    } else {
      console.warn(`Skipped (not an array): ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Start processing
processDirectory(questionsDir);
