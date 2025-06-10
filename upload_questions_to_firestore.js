// upload_questions_to_firestore.js
// Usage: node upload_questions_to_firestore.js

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Recursively walk directory for .json files
function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filelist);
    } else if (file.endsWith('.json')) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

async function uploadQuestions() {
  const baseDir = path.join(__dirname, 'src', 'data', 'questions');
  const files = walk(baseDir);
  let total = 0;
  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    let questions;
    try {
      questions = JSON.parse(raw);
    } catch (e) {
      console.error(`Invalid JSON in ${file}, skipping.`);
      continue;
    }
    if (!Array.isArray(questions)) continue;
    for (const q of questions) {
      if (!q.id) {
        console.warn(`Skipping question with no id in ${file}`);
        continue;
      }
      try {
        console.log(`Uploading: [${q.id}] ${q.text || q.question || ''}`);
        await db.collection('questions').doc(q.id).set(q, { merge: true });
        total++;
      } catch (err) {
        console.error(`Error uploading question ${q.id} from ${file}:`, err);
      }
    }
  }
  console.log(`Upload complete. Total questions uploaded: ${total}`);
  process.exit(0);
}

uploadQuestions();
