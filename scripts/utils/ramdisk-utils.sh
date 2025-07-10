#!/bin/zsh
# ramdisk-utils.sh: RAM disk and temp directory helpers for sync scripts



setup_ramdisk() {
  if [[ "$(uname)" == "Darwin" ]]; then
    local temp_dir="/tmp/git-sync-ram-$$"
    mkdir -p "$temp_dir"
    if mount | grep -q "$temp_dir"; then
      umount "$temp_dir" 2>/dev/null || true
    fi
    echo "%F{blue}Using fast temporary directory at $temp_dir%f"
    export TMPDIR="$temp_dir"
    export GIT_TMPDIR="$temp_dir"
    trap 'rm -rf "$temp_dir" 2>/dev/null || true' EXIT
  fi
}

# Add more RAM disk/temp helpers here as needed
