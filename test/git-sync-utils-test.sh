#!/bin/zsh
# git-sync-utils-test.sh
# Basic tests for git-sync-utils.sh utility functions

source "$(dirname "$0")/../scripts/git-sync-utils.sh"

# Set verbosity for debug logging
test_verbose=1

log_debug() {
    if [[ "$test_verbose" == 1 ]]; then
        echo -e "\033[36m[DEBUG]\033[0m $1"
    fi
}

# Test log functions
log_info "Testing log_info"
log_warning "Testing log_warning"
log_error "Testing log_error"
log_debug "Testing log_debug"

# Test prompt_for_branches (simulate input)
log_info "Testing prompt_for_branches (simulate no branches)"
function git_for_each_ref_empty() { return 1; }

# Test run_pre_sync_tests
log_info "Testing run_pre_sync_tests (should skip)"
run_pre_sync_tests true false
log_info "Testing run_pre_sync_tests (should dry run)"
run_pre_sync_tests false true

# Test handle_stash and pop_stash_if_needed (simulate)
log_info "Testing handle_stash (should dry run)"
handle_stash true true
log_info "Testing pop_stash_if_needed (should do nothing)"
pop_stash_if_needed true

# Test confirm_sync (simulate input)
log_info "Testing confirm_sync (simulate N)"
echo "n" | (confirm_sync false && log_error "confirm_sync should have failed" || log_info "confirm_sync correctly aborted")

log_info "All basic utility tests completed."
