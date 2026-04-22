# Evaluation Summary: Karpathy Guidelines

**Source:** [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)  
**Evaluation Date:** 2026-04-21  
**Grade:** B (Good) — 24/30 points

---

## Overview

This skill package encodes Andrej Karpathy's observations on common LLM coding pitfalls into four behavioral principles:

1. **Think Before Coding** — Surface assumptions, don't hide confusion
2. **Simplicity First** — Minimum code, nothing speculative
3. **Surgical Changes** — Touch only what you must
4. **Goal-Driven Execution** — Define success criteria, loop until verified

---

## Evaluation Results

### Summary

| Metric | Value |
|--------|-------|
| **Total Score** | **24/30** |
| **Grade** | **B (Good)** |

### Scores by Tier

| Tier | Score | Status |
|------|-------|--------|
| 0. Basic Structure | 6/6 | ✅ |
| 1. Agent Readiness | 8/8 | ✅ |
| 2. Content Quality | 4/10 | ⚠️ |
| 3. Verification Gates | 6/6 | ✅ |

---

## What Passed

### Basic Structure (6/6)
- ✅ SKILL.md exists
- ✅ README.md exists
- ✅ License defined (MIT)

### Agent Readiness (8/8)
- ✅ Name matches directory (`karpathy-guidelines`)
- ✅ Description is clear (>20 chars)
- ✅ Governance metadata present (`tier`, `owner`, `platforms`)
- ✅ Platform coverage documented (3 platforms: pi, claude-code, codex)

### Verification Gates (6/6)
- ✅ Success criteria defined (patterns found: `verify`, `test`, `check`)
- ✅ Tradeoffs documented (patterns found: `tradeoff`, `caution`, `judgment`)

---

## Areas for Improvement

### ❌ 2.1 — Clear Output Contract (0/3)

**Evidence:** No output format/contract defined in skill body

**Fix:** Add an `## Output` section describing what the skill produces and in what format.

Example:
```markdown
## Output

When using these guidelines, you should produce:
- Explicit assumptions before implementation
- Simple solutions that match the request scope
- Surgical changes with minimal diff
- Verifiable success criteria for each step
```

### ❌ 2.3 — Examples or References (0/3)

**Evidence:** Low composability (0 signal(s), need ≥2)

**Fix:** Add `references/` for on-demand docs, define clear interfaces, or describe how this skill chains with others.

Example:
```markdown
## References

This skill works well with:
- `verification-before-completion` — Ensures changes are verified
- `systematic-debugging` — For root-cause analysis before fixes
- `test-driven-development` — For test-first approaches
```

---

## Why This Skill Is Valuable

This skill addresses a fundamental problem: LLMs tend to overcomplicate code, make hidden assumptions, and touch more code than necessary. By encoding Karpathy's observations into actionable guidelines, it helps agents:

1. **Surface confusion before acting** — Ask questions instead of guessing
2. **Avoid overengineering** — Build simple solutions first
3. **Make surgical changes** — Don't refactor things that aren't broken
4. **Define verifiable success** — Loop until tests pass, not until "it works"

The skill is particularly useful for:
- Code review tasks
- Refactoring requests
- Bug fixes
- Any time you're tempted to overcomplicate

---

## Next Steps

To improve this skill from B to A grade:

1. **Add output contract** — Define what the skill produces
2. **Add references** — Link to related skills and workflows
3. **Add examples** — Include the detailed examples from the original repository

See the original repository for the full examples that could be added to `references/`.
