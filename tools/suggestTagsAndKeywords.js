// tools/suggestTagsAndKeywords.js
// Usage: node tools/suggestTagsAndKeywords.js
// Analyzes questions in src/data/questions/ and outputs tools/suggested_new_tags.json

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import natural from "natural";
import nlp from "compromise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIG ---
const DEFAULT_QUESTIONS_PATH = path.join(__dirname, "../src/data/questions");
const stopwords = new Set([
  "the", "and", "of", "to", "a", "in", "is", "for", "on", "with", "as", "by", "an", "at", "from", "that", "this", "it", "be", "are", "or", "which", "was", "can", "has", "have", "not", "but", "will", "if", "their", "they", "what", "who", "when", "where", "how", "why", "do", "does", "did", "so", "such"
]);

const targetPath = process.argv[2] || DEFAULT_QUESTIONS_PATH;

if (!fs.existsSync(targetPath)) {
  console.error(`Target file or folder does not exist: ${targetPath}`);
  process.exit(1);
}

function processFile(filePath, wordCounts, bigramCounts, trigramCounts) {
  let data = fs.readFileSync(filePath, "utf8");
  let questions;
  try {
    questions = JSON.parse(data);
  } catch (e) {
    return;
  }
  if (!Array.isArray(questions)) {return;}

  for (let q of questions) {
    if (q.question) {
      let words = q.question
        .replace(/[^\w\s]/g, "")
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w && !stopwords.has(w));
      for (let word of words) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = words[i] + " " + words[i + 1];
        bigramCounts[bigram] = (bigramCounts[bigram] || 0) + 1;
      }
      for (let i = 0; i < words.length - 2; i++) {
        const trigram = words[i] + " " + words[i + 1] + " " + words[i + 2];
        trigramCounts[trigram] = (trigramCounts[trigram] || 0) + 1;
      }
    }
  }
}

function processFolder(folder, wordCounts, bigramCounts, trigramCounts) {
  const files = fs.readdirSync(folder);
  for (const file of files) {
    const filePath = path.join(folder, file);
    if (fs.statSync(filePath).isDirectory()) {
      processFolder(filePath, wordCounts, bigramCounts, trigramCounts);
    } else if (file.toLowerCase().endsWith(".json")) {
      processFile(filePath, wordCounts, bigramCounts, trigramCounts);
    }
  }
}

function getLemmas(words) {
  return words.map(w => nlp(w).terms().out("lemma"));
}
function getStems(words) {
  const stemmer = natural.PorterStemmer;
  return words.map(w => stemmer.stem(w));
}
function main() {
  let wordCounts = {};
  let bigramCounts = {};
  let trigramCounts = {};
  processFolder(targetPath, wordCounts, bigramCounts, trigramCounts);

  const allWords = Object.keys(wordCounts);
  const lemmas = getLemmas(allWords);
  const stems = getStems(allWords);
  const lemmaMap = {};
  allWords.forEach((w, i) => {
    const lemma = lemmas[i] || w;
    const stem = stems[i] || w;
    lemmaMap[lemma] = (lemmaMap[lemma] || 0) + wordCounts[w];
    lemmaMap[stem] = (lemmaMap[stem] || 0) + wordCounts[w];
  });
  let sortedWords = Object.entries(lemmaMap)
    .filter(([word, count]) => count > 2)
    .sort((a, b) => b[1] - a[1]);

  // Output to file for manual review (with keyword field)
  const suggestedNewTags = sortedWords.map(([word, count]) => ({ keyword: word, count }));
  fs.writeFileSync(
    path.join(__dirname, "suggested_new_tags.json"),
    JSON.stringify(suggestedNewTags, null, 2)
  );
  console.log("Suggested new tags written to tools/suggested_new_tags.json");
}

main();
