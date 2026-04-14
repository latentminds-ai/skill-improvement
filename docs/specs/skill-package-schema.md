# Skill Package Schema Specification

**Version:** 1.0.0
**Date:** 2026-04-14
**Status:** Active
**Ticket:** LAT-130

## Purpose

Define the canonical package shape and metadata model for portable, governed skills used by the skill-improvement system. This spec is the human-readable authority; machine-readable validation rules live in `packages/core`.

## Package Structure

A governed skill package is a directory containing:

```
my-skill/
├── SKILL.md              # Required: YAML frontmatter + agent instructions
├── README.md             # Required: human-facing documentation
├── references/           # Optional: detailed docs loaded on-demand by agents
├── scripts/              # Optional: helper scripts, executables
├── assets/               # Optional: templates, images, data files
└── variants/             # Optional: platform-specific overrides and sidecar files (see LAT-133)
    └── codex/
        └── agents/
            └── openai.yaml   # Codex UI metadata (follows existing Codex convention)
```

### Required Files

| File | Audience | Purpose |
|------|----------|---------|
| `SKILL.md` | Agents | YAML frontmatter for discovery + markdown instructions for execution. Single source of truth for agent behavior and package metadata. |
| `README.md` | Humans | Documentation for GitHub, skill catalogs, onboarding. Not read by agents. |

### Optional Directories

| Directory | Purpose |
|-----------|---------|
| `references/` | Detailed documentation loaded on-demand by agents (progressive disclosure) |
| `scripts/` | Helper scripts and executables the skill invokes |
| `assets/` | Templates, images, data files used by the skill |
| `variants/` | Platform-specific SKILL.md overrides and sidecar files. Internal structure defined by LAT-133. |

## Metadata Model

Governance metadata lives in the SKILL.md frontmatter under the `metadata` key, following the [Agent Skills standard](https://agentskills.io/specification). The standard defines `metadata` as an arbitrary key-value bag — governance fields are our governed subset within that bag.

### Full Frontmatter Example

```yaml
---
# ── Agent Skills Standard (required) ────────────────
name: brainstorming
description: "You MUST use this before any creative work..."

# ── Agent Skills Standard (optional) ────────────────
license: MIT
compatibility: "Requires Node.js 22+ for helper scripts"

# ── Governance metadata ─────────────────────────────
metadata:
  # Required governance fields
  tier: methodology          # standards | methodology | personal
  owner: markus              # person or team accountable
  platforms:                 # which harnesses this skill targets
    - pi
    - claude-code
    - codex

  # Optional governance fields
  version: "2.1.0"           # semver, omit if unversioned
  scope: global              # global | project | local (default: project)
  status: active             # draft | active | deprecated | archived (default: active)
  reviewed_at: "2026-04-01"  # ISO date, relevant for standards/methodology tiers

  # Standard metadata (from agentskills.io examples)
  author: latentminds
---
```

### Field Reference

#### Required Governance Fields

| Field | Type | Allowed Values | Description |
|-------|------|----------------|-------------|
| `tier` | string | `standards`, `methodology`, `personal` | Governance classification. Determines review requirements and rollout policy. |
| `owner` | string | identifier | Person or team accountable for the skill's correctness and maintenance. |
| `platforms` | string[] | `pi`, `claude-code`, `codex` | Target agent harnesses. The linter validates compatibility per platform. |

#### Optional Governance Fields

| Field | Type | Allowed Values | Default | Description |
|-------|------|----------------|---------|-------------|
| `version` | string | semver | unversioned | Semantic version. Track when the skill is shared or published. |
| `scope` | string | `global`, `project`, `local` | `project` | Where the skill is intended to be installed. |
| `status` | string | `draft`, `active`, `deprecated`, `archived` | `active` | Lifecycle state. |
| `reviewed_at` | string | ISO 8601 date | — | Date of last governance review. Expected for `standards` and `methodology` tiers. |
| `author` | string | identifier | — | Original creator. Standard metadata field from agentskills.io. |

### Tier Definitions

| Tier | Meaning | Review Required | Example |
|------|---------|-----------------|---------|
| `standards` | Enforced org-wide. All agents must follow. Changes require review. | Yes | `verification-before-completion`, `test-driven-development` |
| `methodology` | Recommended workflows. Teams opt in. | Recommended | `brainstorming`, `writing-plans` |
| `personal` | Individual preferences and experiments. No review required. | No | Custom prompt tweaks |

Full governance policy — including promotion, deprecation, archival, and review cadence — is defined in LAT-134.

### Platform Values

Initial supported values: `pi`, `claude-code`, `codex`.

The list is extensible. New harnesses are added as they gain Agent Skills support. The linter (LAT-132) warns on unrecognized platform values to catch typos.

### Design Decisions

**Why `metadata` frontmatter, not a separate `metadata.json`?**

The Agent Skills standard ([agentskills.io/specification](https://agentskills.io/specification)) defines `metadata` as an arbitrary key-value bag in SKILL.md frontmatter. Governance fields (`tier`, `owner`, `platforms`) are the same kind of package-level information as the standard's own `author` and `version` examples. A separate file would:
- Contradict the standard's existing metadata mechanism
- Introduce drift risk between two metadata sources
- Add a novel pattern with no ecosystem precedent

Every agent harness ignores unknown metadata keys, so governance fields are safe to include.

**Why a separate `README.md`?**

SKILL.md is optimized for agent consumption: trigger descriptions, progressive disclosure, concise instructions. README.md is optimized for human consumption: what the skill does, how to install it, changelog, examples. These are different audiences with different needs.

**Why are governance fields authored, not generated?**

Tooling (the linter) validates metadata but does not write to SKILL.md. Generated output — lint results, eval scores, validation timestamps — belongs in the linter's own output. Keeping SKILL.md human-authored avoids merge conflicts and maintains clear ownership.

## Migration Guidance

### Already-compliant skills (most common)

Skills with valid SKILL.md frontmatter (`name` + `description`) just need:

1. Add the three required governance fields to the `metadata` block
2. Add a `README.md`

Example diff:
```yaml
 ---
 name: brainstorming
 description: "You MUST use this before any creative work..."
+metadata:
+  tier: methodology
+  owner: markus
+  platforms:
+    - pi
 ---
```

### Skills with platform-specific files

Skills like `shadcn` that already have `agents/openai.yaml` — move to `variants/codex/agents/openai.yaml` when LAT-133 lands. The existing location continues to work until then.

### Skills without SKILL.md

Loose `.md` files (Pi supports these in `~/.pi/agent/skills/`) need to be wrapped in a directory with proper SKILL.md frontmatter. These are typically `personal` tier.

### Migration is opt-in

The linter (LAT-132) reports missing governance metadata as **warnings**, not errors. The Agent Skills standard only requires `name` and `description`. Governance fields are our layer on top — existing skills keep working without them.

Missing required files (`SKILL.md`, `README.md`) are **errors** — the package is structurally incomplete. Missing governance metadata fields (`tier`, `owner`, `platforms`) are **warnings** — the skill works but isn't governed. Missing optional fields with defaults (`scope`, `status`) are **info** — not flagged unless explicitly requested. Missing `reviewed_at` on `standards` or `methodology` tier skills is a **warning**.

## Downstream Dependencies

| Ticket | What it consumes from this spec |
|--------|---------------------------------|
| LAT-131 | Metadata fields for agent-readiness evaluation checks |
| LAT-132 | Field definitions and validation rules for the linter |
| LAT-133 | `variants/` directory slot and `platforms` field |
| LAT-134 | `tier`, `owner`, `scope`, `status`, `reviewed_at` for governance policy |
| LAT-135 | Package structure for the self-improvement extraction loop |

## Changelog

### 1.0.2 (2026-04-14)

- Fixed tier examples: `test-driven-development` is `standards` (not `methodology`), per governance policy (LAT-134).

### 1.0.1 (2026-04-14)

- Fixed `variants/` path: `variants/codex/agents/openai.yaml` (platform-namespaced), not `variants/agents/openai.yaml`. Aligned with cross-platform-skill-packaging.md (LAT-133).

### 1.0.0 (2026-04-14)

- Initial specification
- Package structure: SKILL.md + README.md required, references/ scripts/ assets/ variants/ optional
- Metadata model: tier, owner, platforms required; version, scope, status, reviewed_at, author optional
- Migration guidance for existing skills
