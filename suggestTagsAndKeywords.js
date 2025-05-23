import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIG ---
const QUESTIONS_DIR = path.join(__dirname, "questions");
const stopwords = new Set([
  "the", "and", "of", "to", "a", "in", "is", "for", "on", "with", "as", "by", "an", "at", "from", "that", "this", "it", "be", "are", "or", "which", "was", "can", "has", "have", "not", "but", "will", "if", "their", "they", "what", "who", "when", "where", "how", "why", "do", "does", "did", "so", "such"
]);

function processFile(filePath, wordCounts, bigramCounts, trigramCounts) {
  let data = fs.readFileSync(filePath, "utf8");
  let questions;
  try {
    questions = JSON.parse(data);
  } catch (e) {
    return;
  }
  if (!Array.isArray(questions)) return;

  for (let q of questions) {
    if (q.question) {
      // Clean and split
      let words = q.question
        .replace(/[^\w\s]/g, "")
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w && !stopwords.has(w));
      // Single word counts
      for (let word of words) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
      // Bigram counts
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = words[i] + " " + words[i + 1];
        bigramCounts[bigram] = (bigramCounts[bigram] || 0) + 1;
      }
      // Trigram counts
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

function main() {
  let wordCounts = {};
  let bigramCounts = {};
  let trigramCounts = {};
  processFolder(QUESTIONS_DIR, wordCounts, bigramCounts, trigramCounts);

  // Sort by frequency
  let sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([word, count]) => count > 2);

  let sortedBigrams = Object.entries(bigramCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([bigram, count]) => count > 2);

  let sortedTrigrams = Object.entries(trigramCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([trigram, count]) => count > 1); // Only show trigrams that appear more than once

  console.log("Suggested tags (most common words):");
  for (let [word, count] of sortedWords) {
    console.log(`${word}: ${count}`);
  }

  console.log("\nSuggested multi-word tags (bigrams):");
  for (let [bigram, count] of sortedBigrams) {
    console.log(`${bigram}: ${count}`);
  }

  console.log("\nSuggested three-word tags (trigrams):");
  for (let [trigram, count] of sortedTrigrams) {
    console.log(`${trigram}: ${count}`);
  }
}

main();