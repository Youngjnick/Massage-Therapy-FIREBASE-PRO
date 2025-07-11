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
  echo "[INFO] Running lint..."
  if [[ "$DRY_RUN" == "1" ]]; then echo "[DRY RUN] Would run: npm run lint"; return 0; fi
  npm run lint
}

run_typescript_check() {
  echo "[INFO] Running TypeScript check..."
  if [[ "$DRY_RUN" == "1" ]]; then echo "[DRY RUN] Would run: npm run typecheck"; return 0; fi
  npm run typecheck
}

run_all_tests() {
  echo "[INFO] Running all tests (Jest & Playwright)..."
  if [[ "$DRY_RUN" == "1" ]]; then echo "[DRY RUN] Would run: npm test && npx playwright test"; return 0; fi
  if [[ "$NO_TESTS" == "1" ]]; then
    echo "[INFO] Skipping all tests (--no-tests flag set)"
    return 0
  fi
  npm test || return 1
  if [[ -z "$NO_PLAYWRIGHT" ]]; then
    npx playwright test || return 1
  else
    echo "[INFO] Skipping Playwright tests (--no-playwright flag set)"
  fi
}

generate_commit_message_modular() {
  echo "[INFO] Generating commit message (modular)..."
  if [[ "$DRY_RUN" == "1" ]]; then echo "[DRY RUN] Would generate commit message"; return 0; fi
  generate_commit_message
}

run_pre_push_hook_modular() {
  echo "[INFO] Running pre-push hook..."
  if [[ "$DRY_RUN" == "1" ]]; then echo "[DRY RUN] Would run: .husky/pre-push"; return 0; fi
  if [[ -x .husky/pre-push ]]; then
    ./.husky/pre-push
  else
    echo "[WARN] No pre-push hook found."
  fi
}
