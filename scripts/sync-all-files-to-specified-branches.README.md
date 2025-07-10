# sync-all-files-to-specified-branches.sh

A robust Zsh script for syncing files and changes across multiple git branches, with interactive prompts, error handling, and automation options.

## Features
- **Drag-and-drop/quoted path support:** Handles Zsh drag-and-drop invocation and quoted script paths.
- **Auto-commit option:** Use `--auto-commit` to automatically stage and commit all unstaged changes before syncing, with interactive confirmation and custom commit message prompt.
- **Push current branch with summary:** Use `--push-current-with-summary` to auto-commit and push the current branch with a detailed commit message summarizing changed files and diffs.
- **Interactive branch selection:** If no target branches are specified, prompts the user to select branches for syncing.
- **Ensures current branch is included:** Automatically includes the current branch in the sync list if not already present.
- **Parallel sync:** Syncs to multiple branches in parallel, with configurable concurrency.
- **Worktree-based sync:** Uses git worktrees and rsync for safe, isolated branch updates.
- **Pre-sync test hook:** Optionally runs pre-sync tests and aborts if they fail.
- **Stash handling:** Optionally stashes and restores changes as needed.
- **Post-sync diff summary:** Optionally shows a summary diff between the source and each target branch after syncing.
- **Robust error handling:** Aborts on errors, not in a git repo, or if no branches are selected.

## Usage
```zsh
zsh scripts/sync-all-files-to-specified-branches.sh [options]
```

### Options
- `--auto-commit`  
  Prompt to auto-stage and commit all unstaged changes before syncing.
- `--push-current-with-summary`  
  Auto-commit and push the current branch with a detailed summary, then exit.
- `--dry-run`  
  Show what would be done, but make no changes.
- `--skip-tests`  
  Skip pre-sync test hook.
- `--fast`  
  Enable fast mode (implementation dependent).
- `--max-parallel N`  
  Set the maximum number of parallel sync jobs.
- `--stash`  
  Stash changes before syncing and restore after.

## How it works
1. **Invocation:** Handles drag-and-drop and quoted script paths for Zsh compatibility.
2. **Argument parsing:** Parses options and target branches. If none provided, prompts interactively.
3. **Auto-commit:** If `--auto-commit` is set and there are unstaged changes, prompts to commit them.
4. **Current branch:** Ensures the current branch is included in the sync list. If syncing, auto-commits and pushes it first.
5. **Pre-sync tests:** Runs pre-sync tests unless skipped.
6. **Sync process:**
   - Exports the current branch to a temp directory.
   - For each target branch, uses a worktree and rsync to update files.
   - Commits and pushes changes to each target branch.
   - Cleans up worktrees and temp files.
7. **Post-sync:** Optionally shows a summary diff for each target branch.

## Safety and Prompts
- Aborts if not run in a git repo.
- Aborts if no branches are selected.
- Prompts before auto-committing or syncing.
- Handles errors and cleans up on failure.

## Requirements
- Zsh
- Git
- rsync

## Example
```zsh
zsh scripts/sync-all-files-to-specified-branches.sh --auto-commit --max-parallel 2
```

This will prompt to auto-commit any unstaged changes, then sync the current branch to selected target branches in parallel (up to 2 at a time).

---

**Note:** For advanced usage, see comments in the script and utility files it sources.
