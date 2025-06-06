// Script to expand anatomy lists in updateTagsUnitsKeywords.js using anatomy.csv
import fs from "fs";
import path from "path";

const anatomyCsv = path.join(__dirname, "anatomy.csv");
// Remove unused variable to clear lint warning
// const updateTagsPath = path.join(__dirname, "updateTagsUnitsKeywords.js");

const csv = fs.readFileSync(anatomyCsv, "utf8").split(/\r?\n/).filter(Boolean);
// const header = csv[0].split(",");
const rows = csv.slice(1).map(line => line.split(","));

const categories = { Muscle: [], Joint: [], Nerve: [], Bone: [], Artery: [], Ligament: [], Organ: [] };
for (const row of rows) {
  const type = row[0].trim();
  const name = row[1].trim();
  if (categories[type]) {categories[type].push(name);}
}

console.log("Muscles:", categories.Muscle);
console.log("Bones:", categories.Bone);
console.log("Organs:", categories.Organ);
// You can add more logging for other types as needed

// Optionally, you could automate updating updateTagsUnitsKeywords.js here
// For now, just print the lists for manual copy-paste or review
