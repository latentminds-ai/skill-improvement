# Evaluation Scorecard

**Project:** `/Users/mstrazds/.pi/agent/skills/llm-council`
**Rubric:** AI Agent Skill Evaluator v1.0.0
**Date:** 2026-04-21

## Summary

| Metric | Value |
|--------|-------|
| **Score** | **20/30** |
| Implemented checks | 30/30 points |
| Grade | **C (Good)** |

## Scores by Tier

| Tier | Score | Bar | Status |
|------|-------|-----|--------|
| 0. Basic Structure | 6/6 | ████████ | ✅ |
| 1. Content Quality | 8/8 | ████████ | ✅ |
| 2. Operational Readiness | 0/8 | ░░░░░░░░ | ❌ |
| 3. Advanced Features | 6/8 | ██████░░ | ⚠️ |

## Passes

- ✅ **0.1** SKILL.md exists — All required files present
- ✅ **0.2** YAML frontmatter — Frontmatter valid: name, description present
- ✅ **0.3** Name matches directory — Frontmatter valid:  present
- ✅ **1.1** Output contract defined — Output contract defined (1 signal(s) found)
- ✅ **1.2** Failure modes documented — Failure handling documented (2 signal(s))
- ✅ **1.3** Composability signals — Composability signals found (2): references, handoffs, or clear interfaces
- ✅ **1.4** Section structure — 17 section heading(s) (need ≥3)
- ✅ **3.1** Examples provided — Output contract defined (1 signal(s) found)
- ✅ **3.2** When to Use section — 17 section heading(s) (need ≥1)
- ✅ **3.3** References section — Composability signals found (2): references, handoffs, or clear interfaces

## Failures & Fixes

### ❌ 2.1 — Deterministic gates
- **Evidence:** No deterministic gates — critical checks rely on prose only
- **Fix:** Add scripts/ with verification commands, or include bash blocks for critical checks

### ❌ 2.2 — README.md present
- **Evidence:** Missing: README.md
- **Fix:** Create the missing files

### ❌ 2.3 — License defined
- **Evidence:** Frontmatter issues: missing: license
- **Fix:** Fix frontmatter: missing: license

### ❌ 2.4 — Compatibility defined
- **Evidence:** Frontmatter issues: missing: compatibility
- **Fix:** Fix frontmatter: missing: compatibility

### ❌ 3.4 — Scripts for verification
- **Evidence:** None of required files found: scripts/, check.sh, verify.sh
- **Fix:** Create the missing files

## Top Next Improvements

1. **2.1 Deterministic gates**: Add scripts/ with verification commands, or include bash blocks for critical checks
1. **2.2 README.md present**: Create the missing files
1. **2.3 License defined**: Fix frontmatter: missing: license
1. **2.4 Compatibility defined**: Fix frontmatter: missing: compatibility
1. **3.4 Scripts for verification**: Create the missing files
