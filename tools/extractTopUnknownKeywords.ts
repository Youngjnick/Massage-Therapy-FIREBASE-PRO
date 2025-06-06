// Extracts the top N unknown keywords by count from suggested_unknown.json and outputs them as CSV for review
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = path.join(__dirname, "suggested_unknown.json");
const OUTPUT_PATH = path.join(__dirname, "top_unknown_keywords.csv");
const TOP_N = 100; // Change this number as needed

const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));

// Sort by count descending
const sorted = data.sort((a, b) => b.count - a.count);
const top = sorted.slice(0, TOP_N);

// Write CSV
const csv = ["keyword,count", ...top.map(item => `"${item.keyword.replace(/"/g, "\"\"")}",${item.count}`)].join("\n");
fs.writeFileSync(OUTPUT_PATH, csv);

console.log(`Wrote top ${TOP_N} unknown keywords to ${OUTPUT_PATH}`);
