# Cross-Platform Skill Packaging Specification

**Version:** 1.0.0
**Date:** 2026-04-14
**Status:** Active
**Ticket:** LAT-133
**Depends on:** [Skill Package Schema v1.0.1](skill-package-schema.md) (LAT-130)

## Purpose

Define how one canonical skill package supports Pi, Claude Code CLI, and Codex without maintaining divergent copies. The guiding principle is **maximum compatibility over deep customization** — most skills should work cross-platform from a single SKILL.md.

## Three-Tier Variant Model

Skills fall into one of three tiers based on how much harness-specific adaptation they need:

### Tier 1 — Zero-variant (target: 70%+ of skills)

Single canonical SKILL.md works on all declared platforms. At most a Codex `variants/codex/agents/openai.yaml` sidecar for UI metadata.

```
my-skill/
├── SKILL.md
├── README.md
├── references/
├── scripts/
├── assets/
└── variants/
    └── codex/
        └── agents/
            └── openai.yaml    # optional: Codex UI metadata
```

**Examples:** `systematic-debugging`, `test-driven-development`, `verification-before-completion`, all startup copilot skills.

### Tier 2 — Platform-notes (target: ~25% of skills)

Single canonical SKILL.md with a **Platform Notes** section covering harness differences inline. The agent reads the section relevant to its harness and ignores the rest.

```markdown
## Platform Notes

### Pi
Dispatch reviews via `subagent({ agent: "reviewer", task: "..." })`.

### Claude Code
Use subtask prompting for review dispatch.

### Codex
Use `$skill-name` for explicit invocation.
```

No variant files needed. The canonical SKILL.md is the only copy.

**Examples (intended future state — these skills are currently Pi-only and would be migrated to include platform-notes):** `brainstorming`, `writing-plans`, `requesting-code-review` — skills that reference subagent dispatch but could express the concept per-platform in a few lines.

### Tier 3 — Full variant (target: <5% of skills)

Complete SKILL.md replacement per platform. Only for skills where the instructions are so structurally different that platform-notes would be confusing.

```
my-skill/
├── SKILL.md                    # canonical (default version)
├── README.md
├── references/                 # shared across all variants
├── scripts/                    # shared across all variants
├── assets/                     # shared across all variants
└── variants/
    ├── claude-code/
    │   └── SKILL.md            # complete replacement
    └── codex/
        ├── SKILL.md            # complete replacement
        └── agents/
            └── openai.yaml
```

**Key rule:** `references/`, `scripts/`, and `assets/` are always shared — never duplicated into variant directories. Variants only contain SKILL.md overrides and platform-specific sidecar files.

**Examples:** `subagent-driven-development` (63 subagent references — structurally built around Pi's subagent model).

## What May Vary Per Harness

| Concern | Pi | Claude Code | Codex | Where it lives |
|---------|-----|-------------|-------|----------------|
| Install path | `~/.pi/agent/skills/`, `~/.agents/skills/` | `~/.claude/skills/` | `~/.agents/skills/` | README.md (human docs) |
| Explicit invocation | `/skill:name` | `/skill:name` | `$skill-name` | Platform Notes section |
| Subagent dispatch | `subagent({ agent, task })` | Subtask prompting | Not available | Platform Notes or full variant |
| UI metadata | N/A | N/A | `agents/openai.yaml` | `variants/codex/agents/openai.yaml` |
| Frontmatter extensions | `user-invocable`, `disable-model-invocation` | N/A | N/A | Canonical SKILL.md frontmatter (ignored by others) |
| Tool names | `Read`, `Write`, `Edit`, `Bash`, `mcp` | `Read`, `Write`, `Edit`, `Bash` | Similar | Avoid referencing — use natural language |
| MCP tools | Full MCP gateway | Limited | N/A | Platform Notes or full variant |

### Guideline for Skill Authors

Write instructions in natural language. Say "read the file" not "use the Read tool". Say "run `./scripts/check.sh`" not "use Bash to run...". This makes most skills Tier 1 (zero-variant) by default.

## Variant Resolution

When a harness loads a skill, it resolves the variant at load time:

1. Does `variants/<harness>/SKILL.md` exist? → use it
2. Otherwise → use the canonical `SKILL.md`

This means:
- **Skill authors reference skills by name**, not by variant path
- `skill: "brainstorming"` works on any harness — the harness picks the right version
- The canonical package is the single governed source of truth
- Variant resolution is a deployment concern, not an authoring concern

Codex additionally loads `variants/codex/agents/openai.yaml` if present, regardless of whether a variant SKILL.md exists. The sidecar is independent of instruction variants.

### Subagent Skill Passing

In Pi, skills can be injected into subagents:

```typescript
subagent({ agent: "worker", task: "...", skill: "my-skill" })
```

The harness resolves variants before injection. The skill reference is always by name. This pattern extends to any harness with subagent-like capabilities.

## Sync Workflow

### Tier 1 & 2 (no variant SKILL.md)

Nothing to sync. The canonical file IS the only file. Platform-notes sections are maintained inline. Codex `agents/openai.yaml` sidecars are independent metadata.

### Tier 3 (full variant SKILL.md)

Manual sync with linter assistance:

1. **Author edits the canonical SKILL.md** — this is where changes start
2. **Author updates variant SKILL.md files** — manually, because instructions are structurally different
3. **Linter checks for drift** — see drift detection below
4. **README.md documents which platforms have variants** — so humans know what to update

### Why Not Auto-Generate Variants?

Templating or auto-generation breaks down because:
- The reason a skill needs a full variant is that instructions are structurally different
- Structural differences can't be expressed as template variables without making the canonical file unreadable
- Manual authoring with linter-enforced drift detection is more reliable than fragile code generation

### Drift Detection (LAT-132)

| Check | Severity | Description |
|-------|----------|-------------|
| Variant `name` ≠ canonical `name` | **error** | Skill identity must match |
| Variant governance metadata ≠ canonical | **warning** | Tier, owner, platforms should be consistent |
| Canonical modified after variant (git) | **warning** | Variant may be stale |
| Variant references files outside shared dirs | **error** | Variants must use shared resources |
| Platform declared but no variant and canonical is heavily harness-specific | **warning** | Compatibility gap |

## Example: Tier 2 Skill (Platform-Notes)

A skill like `writing-plans` that dispatches subagents but can express this per-platform:

```yaml
---
name: writing-plans
description: "Use when you have a spec or requirements for a multi-step task, before touching code"
metadata:
  tier: methodology
  owner: markus
  platforms:
    - pi
    - claude-code
    - codex
  version: "1.0.0"
  scope: global
  status: active
  reviewed_at: "2026-04-14"
  author: latentminds
---

# Writing Plans

Create detailed implementation plans from specs...

## Review Loop

After writing the plan, dispatch a reviewer:

### Platform Notes

#### Pi
Dispatch the plan-document-reviewer subagent:
`subagent({ agent: "worker", task: "<review prompt>" })`

#### Claude Code
Create a subtask with the review prompt and plan file path.

#### Codex
Invoke `$plan-reviewer` or include review instructions inline.
```

## Example: Tier 3 Skill (Full Variant)

A skill like `subagent-driven-development` where the canonical is Pi-specific:

```
subagent-driven-development/
├── SKILL.md                         # canonical (Pi version, 63 subagent refs)
├── README.md                        # documents variant availability
├── references/
│   └── review-patterns.md           # shared: review methodology
├── variants/
│   ├── claude-code/
│   │   └── SKILL.md                 # rewritten for Claude Code's task model
│   └── codex/
│       ├── SKILL.md                 # rewritten for Codex's execution model
│       └── agents/
│           └── openai.yaml          # Codex UI metadata
```

The variant SKILL.md files share the same `name`, `description`, and governance metadata. The instructions are structurally different but reference the same `references/review-patterns.md`.

## Downstream Dependencies

| Ticket | What it consumes from this spec |
|--------|---------------------------------|
| LAT-132 | Drift detection rules, variant structure validation, platform coverage checks |
| LAT-134 | Variant awareness in governance review process |
| LAT-135 | Variant-aware extraction loop |

## Changelog

### 1.0.0 (2026-04-14)

- Initial specification
- Three-tier variant model: zero-variant, platform-notes, full-variant
- Variant resolution at load time by harness
- Manual sync with linter drift detection for Tier 3
- Shared resources rule: references/, scripts/, assets/ never duplicated
