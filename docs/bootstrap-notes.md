# Bootstrap Notes

## Intent

This repository is the clean product boundary for the skill-improvement system.

## Seed Source

Migrated from:
- `/Users/mstrazds/devel/code/latentminds/_ent_hello-world-workshop`

## What Was Migrated

- **Evaluator engine** (`src/evaluator/`) → `packages/core/src/evaluator/`
  - Types, context, rubric loader/validator, metrics formatter
  - All check implementations: files, fileContains, glob, grepPresent, grepAbsent, jsonPath, exec, http, httpTiming, conditional, heuristic
  - Dispatch/routing logic
  - Reporters: JSON (with history), Markdown scorecard
- **CLI evaluate command** (`src/cli/evaluate.ts`) → `packages/cli/src/`
  - Adapted to import from `@latentminds/skill-improvement-core`
  - Restructured as `bin.ts` entry point + `evaluate.ts` command module
- **Rubric** (`rubric.json`) → `benchmark-profiles/enterprise-hello-world/rubric.json`
  - 66 points, 9 tiers, full grading bands

## Intentionally Not Migrated

- **Stale inline extension evaluator** (`.pi/extensions/skill-evaluator/index.ts`)
  — no longer matches the current evaluator engine; do not use as baseline
- **Workshop welcome UX** (`.pi/extensions/workshop-welcome/`)
  — demo/workshop-specific, not a product concern
- **Project generator** (`src/generator/`, `src/cli/generate.ts`, `.pi/extensions/project-generator/`)
  — tightly coupled to the workshop scaffold flow
- **Autoresearch tooling** (`autoresearch.*`, `evaluate.sh`)
  — workshop development tooling, not the product
- **Research docs** (`research/`)
  — reference material, stays in workshop repo
- **Skills reference copies** (`skills-reference/`)
  — reference copies of third-party skills, not the product
- **Self-improving mutation/extraction loop**
  — not in scope for this bootstrap (see LAT-135)
- **Cross-platform variant generation**
  — not in scope for this bootstrap (see LAT-133)
- **Governance metadata schema**
  — not in scope for this bootstrap (see LAT-130)
- **Compatibility linter**
  — not in scope for this bootstrap (see LAT-132)

## Follow-On Work

1. LAT-130 — Define canonical skill package schema and metadata model
2. LAT-133 — Design shared-core plus thin-variant packaging across Pi, Claude Code, and Codex
3. LAT-134 — Define governance for standards, methodology, and personal skills
4. LAT-131 — Extend evaluator with agent-readiness checks
5. LAT-132 — Build cross-platform skill compatibility linter
6. LAT-135 — Design evidence-driven output-extraction loop for self-improving skills
