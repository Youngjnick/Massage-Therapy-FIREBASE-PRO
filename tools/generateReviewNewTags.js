// Script to generate a reviewable list of { keyword, tag } pairs for new tag candidates
// Reads tools/suggested_new_tags.json and tools/updateTagsUnitsKeywords.js
// Outputs tools/review_new_tags.json for manual review/editing

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load skip list
const skipListPath = path.join(__dirname, "tag_skip_list.json");
let skipList = [];
if (fs.existsSync(skipListPath)) {
  skipList = JSON.parse(fs.readFileSync(skipListPath, "utf8"));
}

// Load keep list
const keepListPath = path.join(__dirname, "tag_keep_list.json");
let keepList = null;
if (fs.existsSync(keepListPath)) {
  keepList = new Set(JSON.parse(fs.readFileSync(keepListPath, "utf8")));
}

// Load suggested new tags
const suggestedPath = path.join(__dirname, "suggested_new_tags.json");
const suggested = JSON.parse(fs.readFileSync(suggestedPath, "utf8"));

// Load master keywords
const { keywordTags } = await import("./updateTagsUnitsKeywords.js");
const masterKeywords = new Set(keywordTags.map(k => k.keyword.toLowerCase()));

// Filter out skipped, short, or numeric keywords, and those already in master
const curated = suggested.filter(
  (entry) =>
    entry.keyword &&
    !skipList.includes(entry.keyword) &&
    entry.keyword.length > 3 &&
    !/^[0-9]+$/.test(entry.keyword) &&
    !masterKeywords.has(entry.keyword.toLowerCase()) &&
    (!keepList || keepList.has(entry.keyword))
);

// Propose a tag for each new keyword (user should edit these as needed)
const reviewList = curated.map(entry => ({
  keyword: entry.keyword,
  tag: `auto_${entry.keyword.replace(/\s+/g, '_').toLowerCase()}`,
  count: entry.count
}));

const reviewPath = path.join(__dirname, "review_new_tags.json");
fs.writeFileSync(reviewPath, JSON.stringify(reviewList, null, 2));
console.log(`Curated review_new_tags.json created with ${reviewList.length} entries (skipped ${suggested.length - reviewList.length}).`);
console.log(`Edit this file to finalize new tags before adding to updateTagsUnitsKeywords.js`);
