// tools/uploadQuestionsNested.js
// Uploads questions to Firestore using nested collections that mirror the folder structure
// Usage: node tools/uploadQuestionsNested.js --folder src/data/questions

import fs from "fs";
import path from "path";
import minimist from "minimist";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { fileURLToPath } from "url";

const argv = minimist(process.argv.slice(2));
const questionsDir = argv.folder || "src/data/questions";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
if (!fs.existsSync(serviceAccountPath)) {
  console.error("serviceAccountKey.json not found in tools/ directory.");
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

function getAllJsonFiles(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      results = results.concat(getAllJsonFiles(filePath));
    } else if (file.endsWith(".json")) {
      results.push(filePath);
    }
  }
  return results;
}

function getPathParts(filePath) {
  // Extract topic/subcollection from file path
  // e.g. src/data/questions/anatomy/movement_groups/foot_flexors.json
  // => ["anatomy", "movement_groups", "foot_flexors"]
  const rel = path.relative(path.resolve(questionsDir), filePath);
  const parts = rel.split(path.sep);
  const last = parts.pop();
  const fileBase = last.replace(/\.json$/, "");
  return [...parts, fileBase];
}

async function uploadQuestionsFromFile(file) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(data)) {
    console.error(`File ${file} is not an array of questions.`);
    return;
  }
  const pathParts = getPathParts(file);
  if (pathParts.length < 2) {
    console.error(`File ${file} does not have enough path parts for topic/subcollection.`);
    return;
  }
  // Remove duplicate consecutive segments
  let cleanParts = [];
  for (let i = 0; i < pathParts.length; i++) {
    if (i === 0 || pathParts[i] !== pathParts[i - 1]) {
      cleanParts.push(pathParts[i]);
    }
  }
  for (const q of data) {
    let docId = q.id ? q.id.replace(/\s+/g, "_").replace(/[\/#.$\[\]]/g, "_") : undefined;
    if (!docId) {
      console.error(`Question missing id in file ${file}`);
      continue;
    }
    let ref = db.collection("questions");
    // Alternate collection/doc for each path part
    for (let i = 0; i < cleanParts.length; i++) {
      if (i % 2 === 0) {
        ref = ref.doc(cleanParts[i]);
      } else {
        ref = ref.collection(cleanParts[i]);
      }
    }
    // If we end on a CollectionReference, add a doc for the unit (use last part)
    if (cleanParts.length % 2 === 0) {
      ref = ref.doc(cleanParts[cleanParts.length - 1]);
    }
    // Now always on a DocumentReference, so we can add 'questions' subcollection
    ref = ref.collection("questions").doc(docId);
    try {
      await ref.set(q);
      console.log(`Uploaded: questions/${cleanParts.join("/")}/questions/${docId}`);
    } catch (e) {
      console.error(`Error uploading questions/${cleanParts.join("/")}/questions/${docId}:`, e);
    }
  }
}

async function uploadAllQuestions() {
  const allFiles = getAllJsonFiles(questionsDir);
  for (const file of allFiles) {
    await uploadQuestionsFromFile(file);
  }
  console.log("Upload complete for all files (nested collections).\n");
}

uploadAllQuestions();
