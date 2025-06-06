const fs = require("fs");
const parse = require("csv-parse/sync");

function importAnatomyByType(filename, type) {
  const csv = fs.readFileSync(filename, "utf8");
  const records = parse.parse(csv, { columns: true });
  return records
    .filter(row => row.Type?.toLowerCase() === type.toLowerCase())
    .map(row => ({
      name: row["Name"]?.toLowerCase(),
      spanish: row["Spanish"]?.toLowerCase(),
      french: row["French"]?.toLowerCase(),
      image: row["ImageURL"] || null,
      notes: row["Notes"] || null,
      synonyms: row["Synonyms"] ? row["Synonyms"].toLowerCase().split(",").map(s => s.trim()) : [],
      pronunciation: row["Pronunciation"] || null,
      audio: row["AudioURL"] || null,
      video: row["VideoURL"] || null,
      imageAlt: row["ImageAlt"] || null,
      category: row["Category"] || null,
      subcategory: row["Subcategory"] || null,
      icdCode: row["ICDCode"] || null,
      cptCode: row["CPTCode"] || null,
      reference: row["Reference"] || null,
      quizQuestion: row["QuizQuestion"] || null,
      related: row["Related"] ? row["Related"].toLowerCase().split(",").map(s => s.trim()) : [],
      updateDate: row["UpdateDate"] || null,
      approvalStatus: row["ApprovalStatus"] || null,
      usageExample: row["UsageExample"] || null,
      color: row["Color"] || null,
      difficulty: row["Difficulty"]?.toLowerCase(),
      tags: row["Tags"] ? row["Tags"].toLowerCase().split(",").map(t => t.trim()) : [],
      searchTags: row["SearchTags"] ? row["SearchTags"].toLowerCase().split(",").map(t => t.trim()) : [],
      visible: row["Visible"] ? row["Visible"].toLowerCase() === "true" : true,
      parent: row["Parent"] || null,
      children: row["Children"] ? row["Children"].split(",").map(s => s.trim()) : [],
      latinName: row["LatinName"] || null,
    }));
}

// Usage:
const muscles = importAnatomyByType("anatomy.csv", "Muscle");
const organs = importAnatomyByType("anatomy.csv", "Organ");
const bones = importAnatomyByType("anatomy.csv", "Bone");

console.log(muscles, organs, bones);