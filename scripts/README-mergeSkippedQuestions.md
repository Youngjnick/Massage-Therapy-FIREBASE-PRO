# Merge Skipped Questions Script

This script merges all eligible questions from `skipped_questions.json` into their destination files, preserving all metadata. It also:
- Creates a backup of each destination file in `src/data/backups/` before modifying it.
- Prevents duplicate questions (by question text) in the destination file.
- Logs actions and summarizes the merge in a `merge_report.txt` file in the `scripts/` directory.

## Usage

```sh
node scripts/mergeSkippedQuestions.js
```

After running, check `merge_report.txt` for a summary and `src/data/backups/` for backups.
