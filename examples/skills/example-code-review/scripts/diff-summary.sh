#!/usr/bin/env bash
set -euo pipefail

# Summarize the current git diff for code review.
# Usage: ./scripts/diff-summary.sh [base-branch]

BASE="${1:-main}"

echo "## Diff Summary: HEAD vs ${BASE}"
echo ""

# Files changed
echo "### Files Changed"
git diff --name-status "${BASE}"...HEAD
echo ""

# Stat summary
echo "### Stats"
git diff --stat "${BASE}"...HEAD
