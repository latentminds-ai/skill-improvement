# Skill Standards & Governance

Welcome! This folder contains the specifications that govern how skills are designed, packaged, and evolved in the **skill-improvement** system.

## What Is a "Skill"?

A **skill** is a reusable agent instruction package that encodes best practices, workflows, and domain knowledge. Examples from this codebase:

- `verification-before-completion` — Ensures claims of "done" are backed by actual verification
- `systematic-debugging` — Guides agents through root-cause analysis before fixing
- `test-driven-development` — Enforces writing tests before implementation
- `llm-council` — Runs decisions through a multi-perspective AI analysis

Skills are first-class citizens: they have schemas, governance, and can be evaluated, linted, and improved over time.

---

## The Specification Suite

### 1. [Skill Package Schema](skill-package-schema.md) — **What a skill looks like**

Defines the canonical package structure and metadata model:

```
my-skill/
├── SKILL.md              # Agent instructions + YAML frontmatter
├── README.md             # Human documentation
├── references/           # Optional: detailed docs
├── scripts/              # Optional: helper scripts
├── assets/               # Optional: templates, images
└── variants/             # Optional: platform-specific overrides
```

**Key concepts:**
- Required files: `SKILL.md` (agents), `README.md` (humans)
- Governance metadata: `tier`, `owner`, `platforms` (in frontmatter)
- Optional fields: `version`, `scope`, `status`, `reviewed_at`

### 2. [Skill Governance Policy](skill-governance-policy.md) — **How skills are classified and reviewed**

Defines a lightweight three-tier model for organizing skills:

| Tier | Meaning | Review Required |
|------|---------|-----------------|
| `standards` | Enforced org-wide. Skipping is a quality/safety risk. | Peer review |
| `methodology` | Recommended workflows. Teams opt in. | Owner approval |
| `personal` | Individual preferences. No review. | None |

**Lifecycle:** `personal` → `methodology` → `standards` (promotion) or `deprecated` → `archived` (demotion)

### 3. [Cross-Platform Skill Packaging](cross-platform-skill-packaging.md) — **How skills work across Pi, Claude Code, and Codex**

Defines a three-tier variant model for cross-platform compatibility:

- **Tier 1 (70%+):** Zero-variant — single `SKILL.md` works everywhere
- **Tier 2 (~25%):** Platform-notes — inline sections per harness
- **Tier 3 (<5%):** Full variant — complete `SKILL.md` replacement per platform

**Guiding principle:** Maximum compatibility over deep customization. Most skills should work cross-platform from a single file.

### 4. [Evidence-Driven Output-Extraction Loop](output-extraction-loop.md) — **How skills improve over time**

Defines the self-improvement system:

```
Evidence Capture → Pattern Extraction → Candidate Proposal → Human Approval → Apply & Re-evaluate
```

**Key features:**
- Captures evidence from session traces, evaluations, lint results
- Extracts patterns: repeated failures, workarounds, discoveries
- Generates candidates: mutations, new skills, promotions, deprecations
- **Mandatory human approval gate** — no auto-apply, ever
- Records score deltas and feeds into future extraction

---

## How It All Fits Together

```
┌─────────────────────────────────────────────────────────────────┐
│                    SKILL LIFECYCLE                               │
│                                                                 │
│   ┌────────────┐    ┌──────────────┐    ┌──────────────┐       │
│   │   Author   │───▶│  Package     │───▶│  Governance  │       │
│   │  Creates   │    │  Schema      │    │  Policy      │       │
│   └────────────┘    └──────────────┘    └──────┬───────┘       │
│                                                 │               │
│                                                 ▼               │
│   ┌────────────┐    ┌──────────────┐    ┌──────────────┐       │
│   │  Extract   │◀───│  Re-evaluate │◀───│  Apply       │       │
│   │  Evidence  │    │  & Record    │    │  Candidate   │       │
│   └────────────┘    └──────────────┘    └──────────────┘       │
│                                                 ▲               │
│                                                 │               │
│   ┌────────────┐    ┌──────────────┐    ┌──────────────┐       │
│   │  Variant   │◀───│  Human       │◀───│  Candidate   │       │
│   │  Packaging │    │  Approval    │    │  Generation  │       │
│   └────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

**Flow:**
1. **Author** creates a skill following the [package schema](skill-package-schema.md)
2. **Governance policy** classifies it and defines review requirements
3. **Variant packaging** ensures it works across platforms
4. **Evidence extraction** captures real-world usage data
5. **Human approval** gates any changes (mandatory)
6. **Re-evaluation** measures impact and records deltas
7. **Variant re-sync** updates platform-specific files if needed

---

## Quick Reference

| Spec | Purpose | Key Decision |
|------|---------|--------------|
| `skill-package-schema.md` | Package structure & metadata | Use SKILL.md frontmatter, not separate files |
| `skill-governance-policy.md` | Classification & review | Three tiers: standards, methodology, personal |
| `cross-platform-skill-packaging.md` | Multi-harness compatibility | Tiered variant model: zero, platform-notes, full |
| `output-extraction-loop.md` | Self-improvement system | Human approval gate is mandatory |

---

## Related Documentation

- **[README.md](../README.md)** — Overview of the skill-improvement tool
- **[packages/core/src/evaluator/types.ts](../../packages/core/src/evaluator/types.ts)** — Machine-readable check method definitions
- **[examples/skill-evaluation-rubric.json](../../examples/skill-evaluation-rubric.json)** — Example rubric for skill evaluation

---

## Contributing

When adding new specs or modifying existing ones:

1. **Check dependencies** — Many specs reference each other (see "Depends on" sections)
2. **Update downstream** — Changes to schema may require linter updates, rubric updates, etc.
3. **Keep it lightweight** — Governance through ownership, not process
4. **Document the "why"** — Design decisions are as important as the rules themselves

See [skill-governance-policy.md](skill-governance-policy.md) for contribution guidelines.
