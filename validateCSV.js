const fs = require("fs");
const parse = require("csv-parse/sync");

function validateCSV(filename, column) {
  const csv = fs.readFileSync(filename, "utf8");
  const records = parse.parse(csv, { columns: true });
  const seen = new Set();
  let hasDuplicates = false;
  for (const row of records) {
    const value = row[column]?.toLowerCase();
    if (!value) {
      console.log("Missing value in row:", row);
    } else if (seen.has(value)) {
      console.log(`Duplicate found: ${value}`);
      hasDuplicates = true;
    } else {
      seen.add(value);
    }
  }
  if (!hasDuplicates) console.log("No duplicates found.");
}

// Example usage:
validateCSV("anatomy.csv", "Name");