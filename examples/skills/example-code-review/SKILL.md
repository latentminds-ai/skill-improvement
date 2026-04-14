---
name: example-code-review
description: "Review code changes for correctness, style, and security issues. Use when completing a PR, reviewing a diff, or before merging feature branches."
license: MIT
metadata:
  tier: methodology
  owner: latentminds
  platforms:
    - pi
    - claude-code
    - codex
  version: "1.0.0"
  scope: project
  status: active
  reviewed_at: "2026-04-14"
  author: latentminds
---

# Code Review

Review code changes against a structured checklist before merging.

## When to Use

- Before merging any feature branch
- When asked to review a diff or PR
- After completing implementation, before claiming done

## Process

1. Read the diff: `./scripts/diff-summary.sh`
2. Check against the [review checklist](references/review-checklist.md)
3. Report findings with severity (critical / warning / nit) and suggested fixes
4. If critical issues found, do not approve — explain what needs to change

## Output Format

```
## Review: <branch or PR title>

### Critical
- [ ] <finding with file:line and fix>

### Warnings
- [ ] <finding with file:line and fix>

### Nits
- <suggestion>

### Verdict: APPROVE | REQUEST CHANGES
```

## Error Handling

- If the diff is empty or the branch has no changes, report "No changes to review" and do NOT approve or reject
- If `scripts/diff-summary.sh` fails, fall back to reading files directly
- NEVER approve without reading the full diff
- MUST check every item in the [review checklist](references/review-checklist.md) before issuing a verdict
