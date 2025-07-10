
#!/bin/zsh
# sync-utils.sh: Branch sync and parallel job helpers for sync scripts

# Function to sync a single branch
sync_branch() {
    local branch_name="$1"
    local tmp_dir="$2"
    local log_file="$3"

    log_info "%F{blue}Starting sync for branch: $branch_name%f"

    # Ensure the temporary directory for the branch exists
    mkdir -p "$tmp_dir"

    # --- BRANCH CREATION & CHECKOUT ---
    # Create and checkout the branch if it doesn't exist
    if ! git rev-parse --verify "$branch_name" >/dev/null 2>&1; then
    log_info "%F{yellow}Branch $branch_name does not exist. Creating it...%f"
        git checkout -b "$branch_name" || {
            log_error "Failed to create and checkout branch $branch_name. Exiting."
            exit 1
        }
    else
        git checkout "$branch_name" || {
            log_error "Failed to checkout branch $branch_name. Exiting."
            exit 1
        }
    fi

    # --- SYNC OPERATION ---
    # Rsync files from the source branch to the target branch
    log_info "%F{blue}Syncing files to branch $branch_name...%f"
    rsync -a --delete --exclude='.git' "$REPO_ROOT/" "$tmp_dir/" || {
        log_error "Rsync to branch $branch_name failed. Exiting."
        exit 1
    }

    # --- GIT COMMIT & PUSH ---
    # Stage all changes
    git add -A

    # Commit changes with a standard message
    git commit -m "Sync: Update files from $CURRENT_BRANCH" || {
        log_warning "No changes to commit for branch $branch_name."
    }

    # Push changes to the remote branch
    git push -u origin "$branch_name" || {
        log_error "Failed to push changes to remote branch $branch_name. Exiting."
        exit 1
    }

    log_info "%F{green}Sync process completed for branch $branch_name.%f"
    log_info "%F{blue}Detailed log for $branch_name available at: $log_file%f"
}

# Function to handle parallel syncing
run_parallel_sync() {
    local current_jobs=0
    local max_jobs=$MAX_PARALLEL
    
    # Increase parallel jobs in fast mode if CPU allows
    if [[ "$FAST_MODE" == true ]]; then
      max_jobs=$((MAX_PARALLEL * 2))
      [[ $max_jobs -gt $AVAILABLE_CORES ]] && max_jobs=$AVAILABLE_CORES
    fi
    
    for remote in "${remotes[@]}"; do
      for branch in "${branches[@]}"; do
        # Wait if we've hit max parallel jobs
        while [[ $current_jobs -ge $max_jobs ]]; do
          for pid in "${!SYNC_JOBS[@]}"; do
            if ! kill -0 $pid 2>/dev/null; then
              local status=$?
              JOB_STATUS[$pid]=$status
              unset SYNC_JOBS[$pid]
              ((current_jobs--))
              
              # Process output of finished job
              if [[ -f "${JOB_OUTPUT[$pid]}" ]]; then
                cat "${JOB_OUTPUT[$pid]}"
                rm "${JOB_OUTPUT[$pid]}"
              fi
            fi
          done
          sleep 0.1
        done
        
        # Start new sync job
        local output_file="$TMPDIR/sync-$remote-$branch-$$"
        (
          sync_branch "$remote" "$branch" > "$output_file" 2>&1
          exit ${PIPESTATUS[0]}
        ) &
        
        local pid=$!
        SYNC_JOBS[$pid]="$remote/$branch"
        JOB_OUTPUT[$pid]="$output_file"
        ((current_jobs++))
      done
    done
    
    # Wait for remaining jobs to complete
    for pid in "${!SYNC_JOBS[@]}"; do
      wait $pid
      local status=$?
      JOB_STATUS[$pid]=$status
    done
    
    # Check job statuses and report
    for pid in "${!SYNC_JOBS[@]}"; do
      if [[ ${JOB_STATUS[$pid]} -ne 0 ]]; then
        echo -e "${RED}Sync job for ${SYNC_JOBS[$pid]} failed.${NC}"
        cat "${JOB_OUTPUT[$pid]}"
      else
        echo -e "${GREEN}Sync job for ${SYNC_JOBS[$pid]} completed successfully.${NC}"
      fi
    done
}

# Cleanup function to terminate background jobs
cleanup_jobs() {
  # Terminate all background sync jobs
  for pid in "${!SYNC_JOBS[@]}"; do
    kill $pid 2>/dev/null || true
  done
  wait
}

# Export functions for use in main script
export -f sync_branch
export -f run_parallel_sync
export -f cleanup_jobs
