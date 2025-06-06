// tools/sortSuggestedTags.js
// Sorts suggested_new_tags.json into keep, skip, and unknown using tag_keep_list.json and tag_skip_list.json
// Usage: node tools/sortSuggestedTags.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const suggested = JSON.parse(fs.readFileSync(path.join(__dirname, "suggested_new_tags.json"), "utf8"));
const keepList = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, "tag_keep_list.json"), "utf8")).map(k => k.toLowerCase()));
const skipList = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, "tag_skip_list.json"), "utf8")).map(k => k.toLowerCase()));

const keep = [];
const skip = [];
const unknown = [];

for (const entry of suggested) {
  if (!entry.keyword) {continue;}
  const kw = entry.keyword.toLowerCase();
  if (keepList.has(kw)) {keep.push(entry);}
  else if (skipList.has(kw)) {skip.push(entry);}
  else {unknown.push(entry);}
}

fs.writeFileSync(path.join(__dirname, "suggested_keep.json"), JSON.stringify(keep, null, 2));
fs.writeFileSync(path.join(__dirname, "suggested_skip.json"), JSON.stringify(skip, null, 2));
fs.writeFileSync(path.join(__dirname, "suggested_unknown.json"), JSON.stringify(unknown, null, 2));
console.log(`Done! Kept: ${keep.length}, Skipped: ${skip.length}, Unknown: ${unknown.length}`);
