# example-code-review

Example skill demonstrating the canonical skill package schema defined in the [Skill Package Schema Specification](../../../docs/specs/skill-package-schema.md).

**This is a reference implementation — not a production code review skill.**

## What This Demonstrates

- Required files: `SKILL.md` with governed metadata, `README.md`
- Optional directories: `references/`, `scripts/`
- Governance metadata in the `metadata` frontmatter block
- Relative path references from SKILL.md to bundled resources

## Package Contents

```
example-code-review/
├── SKILL.md                  # Agent instructions + governance metadata
├── README.md                 # This file (human-facing docs)
├── references/
│   └── review-checklist.md   # Detailed checklist loaded on-demand
└── scripts/
    └── diff-summary.sh       # Helper script for reading diffs
```

## Metadata

| Field | Value |
|-------|-------|
| Tier | methodology |
| Owner | latentminds |
| Platforms | pi, claude-code, codex |
| Version | 1.0.0 |
| Scope | project |
| Status | active |
| Reviewed | 2026-04-14 |
| Author | latentminds |
