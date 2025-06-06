// tools/suggestNewTagsAnd Keywords.js
// Usage: node tools/suggestNewTagsAnd Keywords.js file1.json file2.json ...
// Merges multiple suggested_new_tags.json files, deduplicates by keyword (case-insensitive), sums counts, removes invalid entries.
// Outputs merged_suggested_new_tags.json in the current directory.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadTagsFromFile(filename) {
  try {
    const data = JSON.parse(fs.readFileSync(filename, "utf8"));
    if (!Array.isArray(data)) {throw new Error("Not an array");}
    return data;
  } catch (e) {
    console.error(`Error reading ${filename}:`, e.message);
    return [];
  }
}

function mergeTagArrays(arrays) {
  const merged = {};
  for (const arr of arrays) {
    for (const entry of arr) {
      if (!entry || typeof entry !== "object" || !entry.keyword) {continue;}
      const key = entry.keyword.trim().toLowerCase();
      if (!key) {continue;}
      if (!merged[key]) {
        merged[key] = { keyword: entry.keyword.trim(), count: 0 };
      }
      merged[key].count += Number(entry.count) || 0;
    }
  }
  return Object.values(merged).sort((a, b) => b.count - a.count);
}

function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error("Usage: node tools/suggestNewTagsAnd Keywords.js file1.json file2.json ...");
    process.exit(1);
  }
  const arrays = files.map(loadTagsFromFile);
  const merged = mergeTagArrays(arrays);
  const outputPath = path.join(__dirname, "merged_suggested_new_tags.json");
  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));
  console.log(`Merged ${files.length} files. Output: ${outputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}` || import.meta.url === process.argv[1]) {main();}
