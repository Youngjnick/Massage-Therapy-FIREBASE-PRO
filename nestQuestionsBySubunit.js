
import fs from "fs";
import path from "path";

// Set your questions directory
const QUESTIONS_DIR = path.join(process.cwd(), "questions");

// Helper to move a file into a subfolder based on underscore
function moveFilesInTopic(topicDir) {
  const files = fs.readdirSync(topicDir);
  for (const file of files) {
    const filePath = path.join(topicDir, file);
    if (fs.statSync(filePath).isFile() && file.endsWith(".json")) {
      // Example: ashiatsu_intro.json -> ashiatsu/intro.json
      const match = file.match(/^([a-z0-9]+)_(.+)\.json$/i);
      if (match) {
        const subunit = match[1];
        const rest = match[2];
        const subunitDir = path.join(topicDir, subunit);
        if (!fs.existsSync(subunitDir)) fs.mkdirSync(subunitDir);
        const newFilePath = path.join(subunitDir, rest + ".json");
        fs.renameSync(filePath, newFilePath);
        console.log(`Moved: ${file} -> ${subunit}/${rest}.json`);
      }
    }
  }
}

// Process each topic folder
const topics = fs.readdirSync(QUESTIONS_DIR);
for (const topic of topics) {
  const topicDir = path.join(QUESTIONS_DIR, topic);
  if (fs.statSync(topicDir).isDirectory()) {
    moveFilesInTopic(topicDir);
  }
}
console.log("Nesting complete!");