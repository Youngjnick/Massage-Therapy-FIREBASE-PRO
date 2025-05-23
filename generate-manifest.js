import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalize(str) {
  return str.toLowerCase().replace(/ /g, "_").replace(/\.json$/, "");
}

function getSubcollections(dir, prefix = "") {
  let subs = new Set();
  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith(".")) continue; // Skip hidden/system files
    const entryPath = path.join(dir, entry);
    const normalizedEntry = normalize(entry);
    const fullPath = prefix ? `${prefix}/${normalizedEntry}` : normalizedEntry;
    if (fs.statSync(entryPath).isDirectory()) {
      subs.add(fullPath);
      // Go deeper for nested subfolders
      for (const nested of getSubcollections(entryPath, fullPath)) {
        subs.add(nested);
      }
    } else if (entry.endsWith(".json")) {
      subs.add(fullPath.replace(/\.json$/, ""));
    }
  }
  return Array.from(subs).sort();
}

function getManifest(dir) {
  const manifest = {};
  for (const topic of fs.readdirSync(dir)) {
    if (topic.startsWith(".")) continue;
    const topicPath = path.join(dir, topic);
    if (fs.statSync(topicPath).isDirectory()) {
      manifest[normalize(topic)] = getSubcollections(topicPath);
    }
  }
  return manifest;
}

const questionsDir = path.join(__dirname, "questions");
const manifestObj = getManifest(questionsDir);
const manifestArr = Object.entries(manifestObj).map(([topic, subcollections]) => ({
  topic,
  subcollections
}));
fs.writeFileSync(
  path.join(__dirname, "manifestquestions.json"),
  JSON.stringify(manifestArr, null, 2)
);
console.log("Manifest updated!");