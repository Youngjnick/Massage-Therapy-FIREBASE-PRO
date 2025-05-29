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

// Update to correct questions directory
const QUESTIONS_DIR = path.join(__dirname, "../src/data/questions");

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
  if (!name) {return name;}
  if (name.trim().toUpperCase() === "SOAP") {return "SOAP";}
  return name
    .replace(/[_\-]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

function inferCategory(filePath, topic) {
  // Try to infer from folder name (e.g., .../questions/anatomy/...)
  const match = filePath.match(/questions\/(\w+)/i);
  if (match && match[1]) {
    return match[1].replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
  // Fallback to topic if available
  if (topic && typeof topic === "string") {
    return topic.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
  return "Uncategorized";
}

function fixQuestion(q, topicFromFolder, filePath) {
  let changed = false;
  const now = new Date().toISOString();
  // --- Ensure all required analytics/metadata fields ---
  if (!q.id || typeof q.id !== "string") { q.id = (q.question || "").slice(0, 32) + Math.random().toString(36).slice(2, 8); changed = true; }
  if (!q.question) { q.question = ""; changed = true; }
  if (!Array.isArray(q.answers)) { q.answers = []; changed = true; }
  if (typeof q.correct !== "number") { q.correct = 0; changed = true; }
  if (!Array.isArray(q.incorrect)) { q.incorrect = []; changed = true; }
  if (!Array.isArray(q.keywords)) { q.keywords = []; changed = true; }
  if (!Array.isArray(q.tags)) { q.tags = []; changed = true; }
  if (!q.topic) { q.topic = topicFromFolder; changed = true; }
  // --- Auto-fix category ---
  if (!q.category || typeof q.category !== "string" || !q.category.trim()) {
    const inferred = inferCategory(filePath, q.topic || topicFromFolder);
    q.category = inferred;
    changed = true;
    validationIssues.push({
      file: filePath,
      id: q.id,
      issues: [`Auto-filled category as '${inferred}'`]
    });
  }
  if (!q.difficulty) { q.difficulty = ""; changed = true; }
  if (!("last_answered_at" in q)) { q.last_answered_at = null; changed = true; }
  if (!("difficulty_adjustment" in q)) { q.difficulty_adjustment = 0; changed = true; }
  if (!("created_at" in q)) { q.created_at = now; changed = true; }
  q.updated_at = now;
  // --- FORCE stats, last_answered_at, difficulty_adjustment ---
  q.stats = {
    correct: typeof q.stats?.correct === "number" ? q.stats.correct : 0,
    incorrect: typeof q.stats?.incorrect === "number" ? q.stats.incorrect : 0,
    attempts: typeof q.stats?.attempts === "number" ? q.stats.attempts : 0
  };
  q.last_answered_at = q.last_answered_at ?? null;
  q.difficulty_adjustment = typeof q.difficulty_adjustment === "number" ? q.difficulty_adjustment : 0;
  changed = true;
  // --- RENAME 'incorrect' TO 'distractors' ---
  if (Array.isArray(q.incorrect)) {
    q.distractors = q.incorrect;
    delete q.incorrect;
    changed = true;
  }
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
  return q;
}

// --- KEY ORDER FOR QUESTIONS ---
const QUESTION_KEY_ORDER = [
  "id",
  "question",
  "answers",
  "correct",
  "distractors",
  "short_explanation",
  "long_explanation",
  "clinical_application",
  "difficulty",
  "difficulty_rating",
  "question_type",
  "topic",
  "category",
  "subcategory",
  "tags",
  "keywords",
  "mblex_category",
  "source_reference",
  "stats",
  "last_answered_at",
  "difficulty_adjustment",
  "created_at",
  "updated_at",
  "unit",
  "variant"
];

function sortQuestionKeys(q) {
  const sorted = {};
  for (const key of QUESTION_KEY_ORDER) {
    if (key in q) {sorted[key] = q[key];}
  }
  // Add any extra keys not in the order list
  for (const key of Object.keys(q)) {
    if (!(key in sorted)) {sorted[key] = q[key];}
  }
  return sorted;
}

// --- VALIDATION REPORT ---
let validationIssues = [];

function validateQuestion(q, filePath) {
  const issues = [];
  function check(cond, msg) { if (!cond) {issues.push(msg);} }
  check(q.id && typeof q.id === "string", "Missing or invalid id");
  check(q.question && typeof q.question === "string", "Missing or invalid question");
  check(Array.isArray(q.answers) && q.answers.length > 0, "Missing or invalid answers");
  check(typeof q.correct === "number" && q.correct >= 0, "Missing or invalid correct index");
  check(Array.isArray(q.distractors), "Missing or invalid distractors");
  check(Array.isArray(q.keywords), "Missing or invalid keywords");
  check(Array.isArray(q.tags), "Missing or invalid tags");
  check(q.topic && typeof q.topic === "string", "Missing or invalid topic");
  check(q.category && typeof q.category === "string", "Missing or invalid category");
  check(q.difficulty && typeof q.difficulty === "string", "Missing or invalid difficulty");
  check(q.stats && typeof q.stats.correct === "number" && typeof q.stats.incorrect === "number" && typeof q.stats.attempts === "number", "Missing or invalid stats");
  check("last_answered_at" in q, "Missing last_answered_at");
  check("difficulty_adjustment" in q, "Missing difficulty_adjustment");
  check("created_at" in q, "Missing created_at");
  check("updated_at" in q, "Missing updated_at");
  check("unit" in q, "Missing unit");
  if (issues.length > 0) {
    validationIssues.push({ file: filePath, id: q.id, issues });
  }
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
    let original = JSON.stringify(json);
    // --- Fix each question, validate, and sort keys ---
    if (Array.isArray(json)) {
      json = json.map(q => {
        const fixed = sortQuestionKeys(fixQuestion(q, topicFromFolder, filePath));
        validateQuestion(fixed, filePath);
        return fixed;
      });
    } else {
      json = sortQuestionKeys(fixQuestion(json, topicFromFolder, filePath));
      validateQuestion(json, filePath);
    }
    let fixed = JSON.stringify(json);
    if (fixed !== original) {changed = true;}
    if (changed) {
      // Pretty-print JSON with 2-space indentation
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n");
      changedFiles.push(filePath);
      console.log(`Updated: ${filePath}`);
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
  // After all files processed, output validation report
  if (validationIssues.length > 0) {
    const reportLines = [
      `Validation Report (${new Date().toISOString()})`,
      "========================================",
      ...validationIssues.map(v => `File: ${v.file}\n  Question ID: ${v.id}\n  Issues: ${v.issues.join("; ")}`)
    ];
    const report = reportLines.join("\n");
    console.log("\n" + report + "\n");
    fs.writeFileSync(path.join(__dirname, "validation_report.txt"), report + "\n");
    console.log("Validation report saved to tools/validation_report.txt");
  } else {
    console.log("\nAll questions passed validation.\n");
  }
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
      for (const q of json) {await uploadQuestion(q);}
    } else if (Array.isArray(json.questions)) {
      for (const q of json.questions) {await uploadQuestion(q);}
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