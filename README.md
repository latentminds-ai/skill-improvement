# skill-improvement

Cross-platform skill-improvement tooling for Pi, Claude Code CLI, and Codex.

## Purpose

This repository is the dedicated product home for portable, governed skill-improvement infrastructure.
It is seeded from the reusable evaluator/reporting core in `_ent_hello-world-workshop`, but separates the long-term product from the workshop/demo concerns.

## What's Here

- **Evaluator engine** — rubric-driven project evaluation with 10+ check types (files, exec, http, glob, grep, jsonPath, heuristics, and more)
- **Reporters** — JSON (with timestamped history) and Markdown scorecard output
- **CLI** — `skill-improvement evaluate <project-path> [rubric-path]` for direct execution
- **Pi extension wrapper** — Pi-specific integration (stub, pending follow-on work)
- **Benchmark profiles** — starting with `enterprise-hello-world` (66-point rubric, 9 tiers)

## Repository Layout

```text
packages/
  core/           evaluator engine, rubric loader, reporters, check implementations
  cli/            command-line entry points
  pi-extension/   Pi-specific extension wrapper (stub)
benchmark-profiles/
  enterprise-hello-world/   66-point rubric across 9 tiers
docs/
```

## Quick Start

```bash
npm install
npm run typecheck
npm test
```

## Evaluate a Project

```bash
# Development (tsx)
npx tsx packages/cli/src/bin.ts evaluate /path/to/project benchmark-profiles/enterprise-hello-world/rubric.json

# After building
npm run build
npx skill-improvement evaluate /path/to/project benchmark-profiles/enterprise-hello-world/rubric.json
```

## Relationship to `_ent_hello-world-workshop`

This repo is the permanent product home. The workshop repo remains:
- the source/reference for the original enterprise-hello-world demo
- an example consumer, not the long-term system boundary

See `docs/bootstrap-notes.md` for what has and has not been migrated.
