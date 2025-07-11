#!/usr/bin/env bash
# hooks.sh: Modular hooks and test/lint/commit helpers

# Custom hooks utility for sync-branches-simple.sh
run_hook() {
  local hook_name="$1"
  local config_file="$CONFIG_FILE"
  [[ -z "$config_file" ]] && config_file=".sync-branches.conf"
  if [[ -f "$config_file" ]]; then
    local hook_cmd=$(grep "^$hook_name=" "$config_file" | cut -d'=' -f2-)
    if [[ -n "$hook_cmd" ]]; then
      info "Running $hook_name hook: $hook_cmd"
      eval "$hook_cmd"
    fi
  fi
}

run_lint() {
  if command -v npm >/dev/null 2>&1; then
    npm run lint || return 1
  elif command -v yarn >/dev/null 2>&1; then
    yarn lint || return 1
  else
    echo "No lint command found" >&2; return 1
  fi
}

run_typescript_check() {
  if command -v npm >/dev/null 2>&1; then
    npm run typecheck || return 1
  elif command -v yarn >/dev/null 2>&1; then
    yarn typecheck || return 1
  else
    echo "No typecheck command found" >&2; return 1
  fi
}

run_all_tests() {
  if command -v npm >/dev/null 2>&1; then
    npm test || return 1
  elif command -v yarn >/dev/null 2>&1; then
    yarn test || return 1
  else
    echo "No test command found" >&2; return 1
  fi
}

generate_commit_message_modular() {
  # Generate a commit message, enforce GitHub limits, preview, allow edit
  local branch type title body msg
  branch=$(git rev-parse --abbrev-ref HEAD)
  type="feat"
  case "$branch" in
    *fix*|*bug*) type="fix" ;;
    *chore*) type="chore" ;;
  esac
  title="${type}: $(git status --short | head -n 1 | awk '{print $2}')"
  body="Auto-generated commit for branch $branch."
  msg="$title\n\n$body"
  # Truncate to 72 chars for title, 400 for body
  title="${title:0:72}"
  body="${body:0:400}"
  msg="$title\n\n$body"
  echo -e "$msg" > .GIT_COMMIT_MSG_PREVIEW
  ${EDITOR:-vi} .GIT_COMMIT_MSG_PREVIEW
  msg=$(cat .GIT_COMMIT_MSG_PREVIEW)
  rm .GIT_COMMIT_MSG_PREVIEW
  echo -e "Commit message preview:\n$msg"
  echo -n 'Proceed with commit? [y/N]: '
  read yn
  [[ $yn =~ ^[Yy]$ ]] || return 1
  git commit -am "$title" -m "$body"
}

run_pre_push_hook_modular() {
  if [[ -x .git/hooks/pre-push ]]; then
    .git/hooks/pre-push || return 1
  fi
  return 0
}
