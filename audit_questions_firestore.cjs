// audit_questions_firestore.js
// Audits local question JSON files vs Firestore and reports missing uploads

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Path to your service account key
const serviceAccount = require('./serviceAccountKey.json');

// Firestore collection name (update if needed)
const COLLECTION_NAME = 'questions';
// Directory containing local question files
const QUESTIONS_DIR = path.join(__dirname, 'src', 'data', 'questions');
// Output file for missing question IDs
const OUTPUT_FILE = path.join(__dirname, 'missing_questions_audit.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// Recursively get all JSON files under a directory
function getAllJsonFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllJsonFiles(filePath));
    } else if (file.endsWith('.json')) {
      results.push(filePath);
    }
  });
  return results;
}

// Extract question IDs from a JSON file
function extractQuestionIds(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (Array.isArray(data)) {
      return data.map(q => q.id).filter(Boolean);
    } else if (data && typeof data === 'object' && data.id) {
      return [data.id];
    }
  } catch (e) {
    // Ignore invalid files
  }
  return [];
}

async function getAllLocalQuestionIds() {
  const files = getAllJsonFiles(QUESTIONS_DIR);
  const ids = new Set();
  files.forEach(file => {
    extractQuestionIds(file).forEach(id => ids.add(id));
  });
  return Array.from(ids);
}

async function getAllFirestoreQuestionIds() {
  const snapshot = await db.collection(COLLECTION_NAME).get();
  return snapshot.docs.map(doc => doc.id);
}

async function main() {
  console.log('Collecting local question IDs...');
  const localIds = await getAllLocalQuestionIds();
  console.log(`Found ${localIds.length} local question IDs.`);

  console.log('Fetching Firestore question IDs...');
  const firestoreIds = await getAllFirestoreQuestionIds();
  console.log(`Found ${firestoreIds.length} Firestore question IDs.`);

  const missing = localIds.filter(id => !firestoreIds.includes(id));
  console.log(`\nQuestions present locally but missing from Firestore: ${missing.length}`);
  if (missing.length) {
    console.log(missing);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(missing, null, 2));
    console.log(`\nMissing question IDs written to: ${OUTPUT_FILE}`);
  } else {
    console.log('No missing questions! All local questions are present in Firestore.');
  }
  process.exit(0);
}

main().catch(err => {
  console.error('Error during audit:', err);
  process.exit(1);
});
