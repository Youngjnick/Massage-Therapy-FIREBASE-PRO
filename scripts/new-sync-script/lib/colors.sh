#!/usr/bin/env bash
# colors.sh: Color and style utilities for shell scripts

# Usage: echo -e "$(info 'message')"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}${BOLD}[INFO]${RESET} $*"; }
warn()    { echo -e "${YELLOW}${BOLD}[WARN]${RESET} $*"; }
error()   { echo -e "${RED}${BOLD}[ERROR]${RESET} $*"; }
success() { echo -e "${GREEN}${BOLD}[SUCCESS]${RESET} $*"; }
log()     { echo -e "${BLUE}${BOLD}[LOG]${RESET} $*"; }

# For use in scripts: source this file and call info/warn/error/success/log
