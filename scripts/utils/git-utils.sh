
#!/bin/zsh
# git-utils.sh: Git-related utility functions for sync scripts

# Ensure zsh color support
autoload -Uz colors && colors

# Ensures the script is running inside a valid git repository, or initializes one if not present.
ensure_git_repo() {
  if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    print -P "%B%F{yellow}Not a git repository. Initializing a new git repository...%f%b"
    git init
    if [[ ! -f .gitignore ]]; then
      cat > .gitignore <<EOL
node_modules/
*.log
.DS_Store
/dist
/coverage
.env
.env.local
EOL
    fi
    git add .gitignore
    git commit -m "Initial commit: Add .gitignore" || true
    git checkout -b main 2>/dev/null || true
    git add .
    git commit -m "Initial commit: Project files" || true
    if ! git remote | grep -q '^origin$'; then
      print -n "Enter GitHub repository URL (or press Enter to skip): "
      read -r repo_url
      if [[ -n "$repo_url" ]]; then
        git remote add origin "$repo_url"
        git push -u origin main || true
      fi
    fi
    print -P "%B%F{green}Repository initialized successfully.%f%b"
  fi
  if ! git show-ref --verify --quiet refs/heads/main; then
    git checkout -b main
  else
    git checkout main
  fi
}


safe_git() {
  # Optionally: cd "$REPO_ROOT" || exit 1
  local max_retries=3
  local retry_count=0
  local cmd_output
  while (( retry_count < max_retries )); do
    if cmd_output=$(command git "$@" 2>&1); then
      print -- "$cmd_output"
      return 0
    else
      local exit_code=$?
      ((retry_count++))
      if (( retry_count < max_retries )); then
        print -P "%B%F{yellow}Git command failed, retrying ($retry_count/$max_retries): git $*%f%b"
        sleep 1
      else
        print -P "%B%F{red}Git command failed after $max_retries attempts: git $*%f%b"
        print -P "%B%F{red}Error: $cmd_output%f%b"
        return $exit_code
      fi
    fi
  done
}

setup_git_config() {
  if ! git config user.name > /dev/null 2>&1; then
    git config user.name "Sync Script"
  fi
  if ! git config user.email > /dev/null 2>&1; then
    git config user.email "sync@example.com"
  fi
  git config --local core.preloadindex true
  git config --local core.fscache true
  git config --local gc.auto 0
  if [[ "$FAST_MODE" == "true" ]]; then
    git config --local core.compression 0
    git config --local pack.compression 0
  fi
}

# Validate branches and prompt to create if missing
validate_branches() {
  # Optionally: cd "$REPO_ROOT" || exit 1
  typeset -a valid_branches
  local has_valid_branches=false

  # If branches were provided as arguments
  if [[ ${#branches[@]} -gt 0 ]]; then
    for branch in "${branches[@]}"; do
      if safe_git rev-parse --verify "$branch" >/dev/null 2>&1 || \
         safe_git rev-parse --verify "origin/$branch" >/dev/null 2>&1; then
        valid_branches+=("$branch")
        has_valid_branches=true
      else
        print -P "%B%F{yellow}Branch '$branch' not found. Create it? [y/N]%f%b"
        read -r create_branch
        if [[ "$create_branch" =~ ^[Yy]$ ]]; then
          safe_git checkout -b "$branch"
          safe_git checkout -
          valid_branches+=("$branch")
          has_valid_branches=true
        fi
      fi
    done
  fi

  # If no valid branches, show available ones and prompt
  if [[ "$has_valid_branches" = false ]]; then
    print -P "\n%B%F{blue}Available branches:%f%b"
    print -P "%B%F{green}Local branches:%f%b"
    safe_git branch --list | sed 's/^../  /'
    if safe_git remote | grep -q .; then
      print -P "\n%B%F{green}Remote branches:%f%b"
      safe_git branch -r | grep -v '\->' | sed 's/^../  /'
    fi
    print -P "\n%B%F{yellow}Enter branches to sync (space-separated or one per line):%f%b"
    print "When done, press Enter twice."
    valid_branches=()
    while IFS= read -r line; do
      [[ -z "$line" ]] && break
      for branch in ${(s:,:)${line// /,}}; do
        branch="${branch##[[:space:]]}"
        branch="${branch%%[[:space:]]}"
        if [[ -n "$branch" ]]; then
          valid_branches+=("$branch")
        fi
      done
    done
  fi

  if [[ ${#valid_branches[@]} -eq 0 ]]; then
    print -P "%B%F{red}Error: No valid branches specified.%f%b"
    exit 1
  fi
  branches=("${valid_branches[@]}")
  print -P "\n%B%F{green}Will sync to the following branches:%f%b"
  for b in "${branches[@]}"; do
    print "  $b"
  done
}

# Add more git-related helpers here as needed
