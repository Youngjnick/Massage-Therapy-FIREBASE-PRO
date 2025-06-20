import fs from 'fs';
import path from 'path';

const skippedPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../skipped_questions.json');
const backupDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../src/data/backups');
const reportPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), './merge_report.txt');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

let skipped = [];
try {
  skipped = JSON.parse(fs.readFileSync(skippedPath, 'utf8'));
} catch (e) {
  console.error('Could not read skipped_questions.json:', e);
  process.exit(1);
}

let remaining = [];
let movedCount = 0;
let fileStats = {};
let duplicateCount = 0;
let logLines = [];

skipped.forEach(q => {
  if (q.answer_options && q.correctAnswer && q.filepath) {
    const destPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../', q.filepath);
    // Ensure destination directory exists
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    // Backup destination file if it exists
    if (fs.existsSync(destPath)) {
      const fileName = path.basename(destPath, '.json');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `${fileName}.${timestamp}.bak.json`);
      fs.copyFileSync(destPath, backupPath);
    }
    let dest = [];
    if (fs.existsSync(destPath)) {
      try {
        dest = JSON.parse(fs.readFileSync(destPath, 'utf8'));
      } catch (e) {
        logLines.push(`ERROR: Could not parse ${destPath}: ${e}`);
        dest = [];
      }
    }
    // Prevent duplicates by question text
    if (!dest.some(existing => existing.question === q.question)) {
      dest.push(q);
      movedCount++;
      fileStats[q.filepath] = (fileStats[q.filepath] || 0) + 1;
      logLines.push(`Added question to ${q.filepath}`);
    } else {
      duplicateCount++;
      logLines.push(`Duplicate found, skipping: ${q.question}`);
    }
    fs.writeFileSync(destPath, JSON.stringify(dest, null, 2));
  } else {
    remaining.push(q);
  }
});

fs.writeFileSync(skippedPath, JSON.stringify(remaining, null, 2));

// Write report
let report = `Merge Report - ${new Date().toLocaleString()}`;
report += `\n\nTotal questions moved: ${movedCount}`;
report += `\nTotal duplicates skipped: ${duplicateCount}`;
report += `\nQuestions remaining in skipped_questions.json: ${remaining.length}`;
report += `\n\nBreakdown by file:`;
for (const [file, count] of Object.entries(fileStats)) {
  report += `\n  ${file}: ${count}`;
}
report += `\n\nLog:`;
report += `\n${logLines.join('\n')}`;

fs.writeFileSync(reportPath, report);
console.log(report);
