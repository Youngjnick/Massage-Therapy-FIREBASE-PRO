#!/bin/zsh

# Advanced Playwright Test Runner
# ===============================
#
# This script provides a comprehensive interface for running Playwright tests
# with various options, including coverage analysis, UI mode, and CI-specific
# configurations. It's designed to be robust, user-friendly, and informative.
#
# Features:
# ---------
# - Interactive menu for selecting test run modes.
# - Pre-flight checks for dependencies (jq, fzf).
# - Automatic start/stop of Vite dev server for coverage.
# - Detailed reporting of test results, including failures.
# - Git integration to show changes since the last commit.
# - Options for running in UI mode, headed, or headless.
# - CI mode for running tests in automated environments.
# - Customizable Playwright options via command-line arguments.
#
# Usage:
# ------
# ./scripts/adv_fixing_run_playwright_and_capture_output.sh [options] [playwright_args...]
#
# Options:
# --------
#   [run]             - Run all tests.
#   [cov]             - Run tests with code coverage.
#   [ui]              - Run tests in Playwright UI mode.
#   [headed]          - Run tests in headed mode.
#   [debug]           - Run tests with Playwright debug mode.
#   [ci]              - Run tests in CI mode (non-interactive).
#   [help]            - Show this help message.
#   [-- <args>]       - Pass additional arguments to Playwright.
#
# Examples:
# ---------
#   # Run all tests
#   ./scripts/adv_fixing_run_playwright_and_capture_output.sh
#
#   # Run tests with coverage
#   ./scripts/adv_fixing_run_playwright_and_capture_output.sh cov
#
#   # Run a specific test file in headed mode
#   ./scripts/adv_fixing_run_playwright_and_capture_output.sh -- headed -g "My Test"
#
#   # Run tests with a custom reporter
#   ./scripts/adv_fixing_run_playwright_and_capture_output.sh -- --reporter=json
#
# ------------------------------------------------------------------------------

# --- Configuration ---
# Vite server URL
VITE_URL="http://localhost:5173"
# File to store failed test details
FAILED_TESTS_FILE="test-results/failed_tests.log"
# Vite server PID file
VITE_PID_FILE="vite.pid"
# Playwright report directory
PLAYWRIGHT_REPORT_DIR="playwright-report"

# --- Colors and Styles ---
C_RESET="\033[0m"
C_BOLD="\033[1m"
C_RED="\033[31m"
C_GREEN="\033[32m"
C_YELLOW="\033[33m"
C_BLUE="\033[34m"
C_MAGENTA="\033[35m"
C_CYAN="\033[36m"

# --- Helper Functions ---

# Function to print a styled header
print_header() {
    echo "${C_BOLD}${C_BLUE}===================================================${C_RESET}"
    echo "${C_BOLD}${C_BLUE} $1 ${C_RESET}"
    echo "${C_BOLD}${C_BLUE}===================================================${C_RESET}"
}

# Function to print a success message
print_success() {
    echo "${C_GREEN}✓ $1${C_RESET}"
}

# Function to print an error message
print_error() {
    echo "${C_RED}✗ $1${C_RESET}"
}

# Function to print an info message
print_info() {
    echo "${C_CYAN}ℹ $1${C_RESET}"
}

# Function to print a warning message
print_warning() {
    echo "${C_YELLOW}⚠ $1${C_RESET}"
}

# Dependency check
check_dependencies() {
    print_info "Checking for required dependencies..."
    local missing_deps=0
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install it (e.g., 'brew install jq')."
        missing_deps=1
    else
        print_success "jq is available."
    fi

    if ! command -v fzf &> /dev/null; then
        print_warning "fzf is not installed. Some interactive features will be disabled."
        print_info "To install, see: https://github.com/junegunn/fzf"
    else
        print_success "fzf is available."
    fi

    if [ $missing_deps -ne 0 ]; then
        exit 1
    fi
}

# Function to start the Vite dev server
start_vite_server() {
    print_info "Starting Vite dev server for coverage..."
    npm run dev &
    VITE_PID=$!
    echo $VITE_PID > $VITE_PID_FILE
    if ! wait-on --timeout 60000 $VITE_URL; then
        print_error "Vite server failed to start within 60 seconds."
        kill $VITE_PID
        exit 1
    fi
    print_success "Vite server started successfully."
}

# Function to stop the Vite dev server
stop_vite_server() {
    if [ -f $VITE_PID_FILE ]; then
        VITE_PID=$(cat $VITE_PID_FILE)
        print_info "Stopping Vite dev server (PID: $VITE_PID)..."
        if kill $VITE_PID; then
            print_success "Vite server stopped."
        else
            print_error "Failed to stop Vite server (PID: $VITE_PID)."
        fi
        rm $VITE_PID_FILE
    else
        print_warning "Vite PID file not found. Server may not have been started by this script."
    fi
}

# Function to run Playwright tests
run_playwright() {
    local args=("$@")
    print_header "Running Playwright Tests"
    print_info "Arguments: ${args[*]}"
    
    # Clear previous failed tests log
    rm -f "$FAILED_TESTS_FILE"
    touch "$FAILED_TESTS_FILE"

    # Run tests and capture output
    # Using process substitution and tee to capture output and print to stdout
    exec 5> >(tee /dev/tty)
    npx playwright test "${args[@]}" | tee >(process_playwright_output) >&5
    local test_status=${PIPESTATUS[0]}

    if [ $test_status -ne 0 ]; then
        print_error "Playwright tests failed. See details above."
        report_failed_tests
    else
        print_success "All Playwright tests passed."
    fi
    
    return $test_status
}

# Process Playwright output to find failed tests
process_playwright_output() {
    local failure_summary_started=false
    while IFS= read -r line; do
        # Check for the start of the failure summary
        if [[ "$line" == *"Failures:"* ]]; then
            failure_summary_started=true
        fi

        # If in the failure summary, capture lines with file paths
        if $failure_summary_started && [[ "$line" =~ \[.*\] › (.*):([0-9]+):([0-9]+) ]]; then
            local file_path="${BASH_REMATCH[1]}"
            local line_num="${BASH_REMATCH[2]}"
            echo "${file_path}:${line_num}" >> "$FAILED_TESTS_FILE"
        fi
    done
}

# Report failed tests
report_failed_tests() {
    if [ -s "$FAILED_TESTS_FILE" ]; then
        print_header "Failed Test Summary"
        # Use awk to remove duplicates
        awk '!seen[$0]++' "$FAILED_TESTS_FILE" | while IFS= read -r line; do
            echo "${C_RED}- $line${C_RESET}"
        done
        print_info "Failed test locations stored in: $FAILED_TESTS_FILE"
    else
        print_warning "No specific failed test locations were captured."
    fi
}

# Function to show git changes
show_git_changes() {
    print_header "Git Status"
    if git diff --quiet && git diff --staged --quiet; then
        print_success "No uncommitted changes."
    else
        print_info "Uncommitted changes detected:"
        git status --short
    fi
}

# Function to display help message
show_help() {
    print_header "Advanced Playwright Test Runner - Help"
    echo "Usage: ./scripts/adv_fixing_run_playwright_and_capture_output.sh [command] [options]"
    echo ""
    echo "${C_BOLD}Commands:${C_RESET}"
    echo "  ${C_GREEN}run${C_RESET}        Run all Playwright tests."
    echo "  ${C_GREEN}cov${C_RESET}        Run tests with code coverage analysis."
    echo "  ${C_GREEN}ui${C_RESET}         Run tests in Playwright's interactive UI mode."
    echo "  ${C_GREEN}headed${C_RESET}     Run tests in headed (non-headless) mode."
    echo "  ${C_GREEN}debug${C_RESET}      Run tests with Playwright's debug mode."
    echo "  ${C_GREEN}ci${C_RESET}         Run tests in CI mode (non-interactive, exits on first failure)."
    echo "  ${C_GREEN}help${C_RESET}       Display this help message."
    echo ""
    echo "${C_BOLD}Options:${C_RESET}"
    echo "  -- <args>  Pass additional arguments directly to Playwright."
    echo "              Example: ./script.sh run -- --reporter=dot"
    echo ""
    show_git_changes
}

# --- Main Logic ---

# Check dependencies first
check_dependencies

# Default command
COMMAND="run"
PLAYWRIGHT_ARGS=()

# Parse command-line arguments
if [ $# -gt 0 ]; then
    # Check if the first argument is a valid command
    case "$1" in
        run|cov|ui|headed|debug|ci|help)
            COMMAND=$1
            shift
            ;;
        --) # End of script options
            shift
            ;;
    esac
    PLAYWRIGHT_ARGS=("$@")
fi

# Handle interactive mode if no command is given
if [ $# -eq 0 ] && [ -z "$CI" ]; then
    print_header "Playwright Test Runner Menu"
    echo "Select an option:"
    options=("run: Run all tests" "cov: Run with coverage" "ui: Open Playwright UI" "headed: Run in headed mode" "debug: Run with debug inspector" "help: Show help" "exit: Exit")
    
    # Use fzf for a better menu if available
    if command -v fzf &> /dev/null; then
        selected_option=$(printf "%s\n" "${options[@]}" | fzf --prompt="Choose action> ")
        COMMAND=$(echo "$selected_option" | cut -d':' -f1)
    else
        select opt in "${options[@]}"; do
            COMMAND=$(echo "$opt" | cut -d':' -f1)
            break
        done
    fi
fi


# Execute command
case "$COMMAND" in
    run)
        run_playwright "${PLAYWRIGHT_ARGS[@]}"
        ;;
    cov)
        trap stop_vite_server EXIT
        start_vite_server
        # Run coverage tests
        # Note: This assumes you have a specific playwright config for coverage
        # or you pass arguments to enable it.
        # For example: npx playwright test --config=playwright.config.coverage.ts
        run_playwright --config=e2e/playwright.config.coverage.ts "${PLAYWRIGHT_ARGS[@]}"
        # After tests, generate coverage report
        print_info "Generating coverage report..."
        npx nyc report --reporter=lcov --reporter=text
        ;;
    ui)
        print_info "Starting Playwright in UI mode..."
        npx playwright test --ui "${PLAYWRIGHT_ARGS[@]}"
        ;;
    headed)
        print_info "Running tests in headed mode..."
        run_playwright --headed "${PLAYWRIGHT_ARGS[@]}"
        ;;
    debug)
        print_info "Running tests in debug mode..."
        PWDEBUG=1 npx playwright test "${PLAYWRIGHT_ARGS[@]}"
        ;;
    ci)
        print_header "Running in CI mode"
        # CI mode might imply different configurations, e.g., stricter checks
        # or specific reporters.
        run_playwright --forbid-only --retries=2 "${PLAYWRIGHT_ARGS[@]}"
        ;;
    help)
        show_help
        ;;
    exit)
        print_info "Exiting."
        exit 0
        ;;
    *)
        print_error "Invalid command: $COMMAND"
        show_help
        exit 1
        ;;
esac

# Final summary
show_git_changes
