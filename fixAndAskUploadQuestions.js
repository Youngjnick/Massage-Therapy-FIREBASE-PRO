import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8")
);

const QUESTIONS_DIR = path.join(__dirname, "questions");

// --- FIREBASE INIT ---
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "massage-therapy-smart-study"
});
const db = admin.firestore();

// --- EXPLANATIONS MAP (customize as needed) ---
const explanations = {
  // "Anatomy Prefixes 001": "Cardi/o refers to the heart.",
  // ...
};

// --- HELPERS ---
function prettifyName(name) {
  if (!name) return name;
  if (name.trim().toUpperCase() === "SOAP") return "SOAP";
  return name
    .replace(/[_\-]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

// --- FIX LOCAL FILES ---
async function fixLocalFiles() {
  let changedFiles = [];
  async function processFile(filePath, topicFromFolder) {
    let changed = false;
    let data = fs.readFileSync(filePath, "utf8");
    let json;
    try {
      json = JSON.parse(data);
    } catch (e) {
      console.error(`Could not parse JSON in ${filePath}:`, e);
      return;
    }
    function fixQuestion(q, topicFromFolder) {
      let changed = false;
      // Normalize topic to lowercase
      if (q.topic !== topicFromFolder) { q.topic = topicFromFolder; changed = true; }
      if (q.topic !== q.topic.toLowerCase()) { q.topic = q.topic.toLowerCase(); changed = true; }
      // Normalize unit to lowercase
      if (q.unit && q.unit !== q.unit.toLowerCase()) { q.unit = q.unit.toLowerCase(); changed = true; }
      // Normalize tags to lowercase
      if (Array.isArray(q.tags)) {
        const newTags = q.tags.map(tag => tag.toLowerCase());
        if (JSON.stringify(q.tags) !== JSON.stringify(newTags)) { q.tags = newTags; changed = true; }
      }
      // ...existing id/unit/explanation logic...
      if (q.id) {
        const newId = prettifyName(q.id);
        if (q.id !== newId) { q.id = newId; changed = true; }
      }
      if (!q.unit || typeof q.unit !== "string" || !q.unit.trim()) {
        // Get the relative path from the topic folder to the file, minus .json
        const topicFolder = path.basename(path.dirname(path.dirname(filePath)));
        const relativePath = path.relative(path.join(__dirname, "questions", topicFolder), filePath);
        const unitPath = path.dirname(relativePath) !== "."
          ? path.join(path.dirname(relativePath), path.basename(filePath, ".json"))
          : path.basename(filePath, ".json");
        q.unit = unitPath.replace(/\\/g, "/").toLowerCase(); // Normalize for cross-platform and lowercase
        changed = true;
      }
      if (explanations[q.id]) {
        q.explanation = explanations[q.id];
        changed = true;
      }
      return changed;
    }
    if (Array.isArray(json)) {
      json.forEach(q => { if (fixQuestion(q, topicFromFolder)) changed = true; });
    } else if (Array.isArray(json.questions)) {
      json.questions.forEach(q => { if (fixQuestion(q, topicFromFolder)) changed = true; });
    } else {
      if (fixQuestion(json, topicFromFolder)) changed = true;
    }
    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf8");
      changedFiles.push(filePath);
      console.log(`Fixed: ${filePath}`);
    }
  }
  async function processDir(dir, topic) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        await processDir(filePath, topic);
      } else if (file.toLowerCase().endsWith(".json")) {
        await processFile(filePath, topic);
      }
    }
  }
  async function processRoot(dir) {
    const subs = fs.readdirSync(dir);
    for (const sub of subs) {
      const subPath = path.join(dir, sub);
      if (fs.statSync(subPath).isDirectory()) {
        const topic = sub.toLowerCase(); // <-- Use lowercase
        await processDir(subPath, topic);
      }
    }
  }
  await processRoot(QUESTIONS_DIR);
  return changedFiles;
}

// --- UPLOAD TO FIRESTORE ---
async function uploadToFirestore() {
  async function processFile(filePath, topicFromFolder) {
    let data = fs.readFileSync(filePath, "utf8");
    let json;
    try {
      json = JSON.parse(data);
    } catch (e) {
      console.error(`Could not parse JSON in ${filePath}:`, e);
      return;
    }
    async function uploadQuestion(q) {
      const itemsRef = db.collection("questions").doc(topicFromFolder).collection("items");
      await itemsRef.doc(q.id).set(q, { merge: true });
      console.log(`Uploaded: ${topicFromFolder}/items/${q.id}`);
    }
    if (Array.isArray(json)) {
      for (const q of json) await uploadQuestion(q);
    } else if (Array.isArray(json.questions)) {
      for (const q of json.questions) await uploadQuestion(q);
    } else {
      await uploadQuestion(json);
    }
  }
  async function processDir(dir, topic) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        await processDir(filePath, topic);
      } else if (file.toLowerCase().endsWith(".json")) {
        await processFile(filePath, topic);
      }
    }
  }
  async function processRoot(dir) {
    const subs = fs.readdirSync(dir);
    for (const sub of subs) {
      const subPath = path.join(dir, sub);
      if (fs.statSync(subPath).isDirectory()) {
        const topic = sub.toLowerCase(); // <-- Use lowercase
        await processDir(subPath, topic);
      }
    }
  }
  await processRoot(QUESTIONS_DIR);
}

// --- MAIN ---
(async () => {
  const changedFiles = await fixLocalFiles();
  console.log(`\n${changedFiles.length} files fixed locally.`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("Proceed with upload to Firestore? (y/N): ", async answer => {
    rl.close();
    if (answer.trim().toLowerCase() === "y") {
      await uploadToFirestore();
      console.log("Upload complete!");
    } else {
      console.log("Upload cancelled.");
    }
    process.exit(0);
  });
})();
console.log("Loaded questions:", loadedQuestions);