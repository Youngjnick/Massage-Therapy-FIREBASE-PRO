import fs from "fs";
import path from "path";

const QUESTIONS_DIR = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "../src/data/questions"
);

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

function summarizeStats(statsArr) {
  let total = { correct: 0, incorrect: 0, attempts: 0 };
  for (const s of statsArr) {
    total.correct += s.correct || 0;
    total.incorrect += s.incorrect || 0;
    total.attempts += s.attempts || 0;
  }
  return total;
}

function main() {
  const files = getAllJsonFiles(QUESTIONS_DIR);
  let allStats = [];
  let questionCount = 0;
  let questionsNeedingReview = [];
  for (const file of files) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (e) {
      console.error(`Could not parse ${file}`);
      continue;
    }
    const questions = Array.isArray(data) ? data : [data];
    for (const q of questions) {
      questionCount++;
      if (q.stats) {allStats.push(q.stats);}
      // Flag questions with high incorrect/attempts ratio or low attempts
      if (
        q.stats &&
        q.stats.attempts > 0 &&
        q.stats.incorrect / q.stats.attempts > 0.5
      ) {
        questionsNeedingReview.push({
          id: q.id,
          file,
          incorrect: q.stats.incorrect,
          attempts: q.stats.attempts,
        });
      }
    }
  }
  const summary = summarizeStats(allStats);
  console.log("\n=== Question Analytics Summary ===");
  console.log(`Total questions: ${questionCount}`);
  console.log(`Total attempts: ${summary.attempts}`);
  console.log(`Total correct: ${summary.correct}`);
  console.log(`Total incorrect: ${summary.incorrect}`);
  if (summary.attempts > 0) {
    console.log(
      `Overall accuracy: ${((summary.correct / summary.attempts) * 100).toFixed(1)}%`
    );
  }
  console.log("\nQuestions needing review (high incorrect rate):");
  for (const q of questionsNeedingReview) {
    console.log(
      `- ${q.id} (${q.incorrect}/${q.attempts} incorrect) in ${q.file}`
    );
  }
}

main();
