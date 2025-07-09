#!/bin/bash

# Set strict error handling
set -euo pipefail

# Configuration
BACKUP_DIR="sync_tmp_backups"
MAX_AGE_DAYS=7  # Keep files newer than this many days

echo "🧹 Starting cleanup of old sync-tmp files..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Function to check if a branch exists (locally or remotely)
branch_exists() {
    local branch_name="$1"
    # Check if branch exists locally or remotely
    git rev-parse --verify "$branch_name" >/dev/null 2>&1 || \
    git rev-parse --verify "origin/$branch_name" >/dev/null 2>&1
}

# Function to extract branch name from sync-tmp filename
get_branch_from_tmp() {
    local tmp_file="$1"
    # Extract just the branch name without the random suffix
    basename "$tmp_file" | sed 's/^\.sync-tmp-//' | sed 's/-[0-9]\+\(-backup\)*$//'
}

# Move any stray .sync-tmp files and folders to the backup dir
echo "📦 Moving any stray .sync-tmp files to backup directory..."
# First move files from .sync-tmp folder if it exists
if [[ -d ".sync-tmp" ]]; then
  mv .sync-tmp/* "$BACKUP_DIR/" 2>/dev/null || true
  rmdir .sync-tmp 2>/dev/null || true
fi
# Then move any loose .sync-tmp files
find . -maxdepth 1 -name ".sync-tmp-*" -exec mv {} "$BACKUP_DIR/" \;

# Count files before cleanup
initial_count=$(find "$BACKUP_DIR" -name ".sync-tmp-*" | wc -l)
echo "📊 Found $initial_count sync-tmp files before cleanup"

# Clean up old sync-tmp files
echo "🔍 Analyzing sync-tmp files..."

find "$BACKUP_DIR" -name ".sync-tmp-*" | while read -r tmp_file; do
    branch_name=$(get_branch_from_tmp "$tmp_file")
    
    # Check file age
    file_age_days=$((($(date +%s) - $(stat -f %m "$tmp_file")) / 86400))
    
    # Get the lock file path for this tmp file
    lock_file="${tmp_file}.lock"
    
    if [ -f "$lock_file" ]; then
        echo "⏳ Skipping $tmp_file - active sync operation in progress"
        continue
    fi
    
    if ! branch_exists "$branch_name"; then
        echo "🗑️  Removing $tmp_file - branch no longer exists"
        rm -rf "$tmp_file"
    elif [ "$file_age_days" -gt "$MAX_AGE_DAYS" ]; then
        echo "🗑️  Removing $tmp_file - older than $MAX_AGE_DAYS days"
        rm -rf "$tmp_file"
    else
        echo "✅ Keeping $tmp_file - active and recently used"
    fi
done

# Count remaining files
final_count=$(find "$BACKUP_DIR" -name ".sync-tmp-*" | wc -l)
removed_count=$((initial_count - final_count))

echo "✨ Cleanup complete!"
echo "📊 Summary:"
echo "   - Initial sync-tmp files: $initial_count"
echo "   - Files removed: $removed_count"
echo "   - Files remaining: $final_count"
