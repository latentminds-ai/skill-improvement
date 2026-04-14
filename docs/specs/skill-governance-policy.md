# Skill Governance Policy

**Version:** 1.0.0
**Date:** 2026-04-14
**Status:** Active
**Ticket:** LAT-134
**Depends on:** [Skill Package Schema v1.0.1](skill-package-schema.md) (LAT-130)

## Purpose

Define the governance model for classifying and managing skills at different organizational tiers. This is a lightweight model — governance through ownership, not process.

## Classification Rules

| Tier | What it means | Decision test |
|------|---------------|---------------|
| **`standards`** | Enforced baseline. All agents must follow. Skipping this skill is a quality/safety risk. | "Would skipping this cause a bug, a bad commit, or a broken claim?" |
| **`methodology`** | Recommended workflow. Improves quality but teams/individuals opt in. | "Does this make work better but isn't dangerous to skip?" |
| **`personal`** | Individual or domain-specific. No org-wide expectation. | Everything else. |

## Scope Mapping

| Tier | Default scope | Meaning |
|------|--------------|---------|
| `standards` | `global` | Installed for all team members across all projects |
| `methodology` | `global` | Available globally, used when the task matches |
| `personal` | `local` or `project` | Individual user or specific project only |

## Ownership & Review

| Tier | Owner responsibility | Change review | Review cadence |
|------|---------------------|---------------|----------------|
| `standards` | Maintains correctness. Any change reviewed by someone other than the author. | Peer review required | When changed (no fixed schedule) |
| `methodology` | Maintains quality. Self-review is fine. | Owner approves | When changed |
| `personal` | Up to the individual. | None required | None |

The owner (declared in `metadata.owner`) is the authority for the skill. No committees, no fixed cadence. Peer review for standards changes is the only hard rule.

## Lifecycle

```
personal ──promote──▶ methodology ──promote──▶ standards
                                                   │
    ◀──────────demote──────────◀──────demote────────┘
                   │
              deprecate
                   │
               archive
```

### Promotion

- **personal → methodology:** Owner proposes. Demonstrates value (e.g., "this skill caught real issues in 3 projects" or "this workflow saved significant time across multiple uses").
- **methodology → standards:** Owner proposes. At least one other team member endorses. The bar is high — only promote when skipping the skill is a quality/safety risk.

At promotion time, add or update governance metadata: `tier`, `owner`, `platforms`, `reviewed_at`.

### Demotion

Owner can demote a skill at any time. Update `metadata.tier` and note the reason in README.md.

### Deprecation

1. Owner sets `metadata.status: deprecated`
2. Owner adds a note in README.md explaining what to use instead (if anything)
3. Skill stays discoverable but the linter (LAT-132) warns on use
4. Deprecation reason should be clear: superseded, no longer relevant, merged into another skill

### Archival

After a deprecation period (owner's judgment — no fixed timeline):

1. Owner sets `metadata.status: archived`
2. Skill is no longer discoverable by agents
3. Skill remains in the repository for reference

## Approval Expectations

| Action | Standards | Methodology | Personal |
|--------|-----------|-------------|----------|
| Create | Peer review | Owner | None |
| Modify instructions | Peer review | Owner | None |
| Modify metadata | Peer review | Owner | None |
| Promote | Team endorsement | Owner proposes | N/A |
| Deprecate | Peer review | Owner | None |
| Archive | Owner | Owner | Owner |

"Peer review" means someone other than the author reviews and approves the change. Any team member qualifies.

## Initial Skill Audit

Mapping of current Latent Minds skills into the tier model.

### Standards (3 skills)

| Skill | Owner | Rationale |
|-------|-------|-----------|
| `verification-before-completion` | markus | Safety — prevents false "done" claims |
| `systematic-debugging` | markus | Safety — prevents random fixes that mask root causes |
| `test-driven-development` | markus | Quality — ensures tests exist before claiming implementation |

### Methodology (13 skills)

| Skill | Owner | Rationale |
|-------|-------|-----------|
| `brainstorming` | markus | Workflow — design before implementation |
| `writing-plans` | markus | Workflow — plan before coding |
| `executing-plans` | markus | Workflow — structured plan execution |
| `writing-skills` | markus | Workflow — TDD approach to skill authoring |
| `requesting-code-review` | markus | Quality — structured review process |
| `receiving-code-review` | markus | Quality — rigorous response to feedback |
| `subagent-driven-development` | markus | Workflow — subagent dispatch pattern |
| `dispatching-parallel-agents` | markus | Workflow — parallel task execution |
| `using-git-worktrees` | markus | Workflow — isolated feature work |
| `finishing-a-development-branch` | markus | Workflow — branch integration |
| `llm-council` | markus | Decision-making — multi-perspective analysis |
| `using-superpowers` | markus | Meta — skill discovery and usage |
| `release-readiness` | markus | Workflow — release verification |

### Personal (14 skills)

| Skill | Owner | Rationale |
|-------|-------|-----------|
| `find-skills` | markus | Utility — skill discovery helper |
| `shadcn` | markus | Domain — shadcn/ui specific |
| `chrome-cdp` | markus | Domain — Chrome debugging specific |
| `business-model` | markus | Domain — startup copilot |
| `customer-success` | markus | Domain — startup copilot |
| `finance-accounting` | markus | Domain — startup copilot |
| `fundraising` | markus | Domain — startup copilot |
| `go-to-market` | markus | Domain — startup copilot |
| `growth-analytics` | markus | Domain — startup copilot |
| `idea-validation` | markus | Domain — startup copilot |
| `legal-compliance` | markus | Domain — startup copilot |
| `marketing-brand` | markus | Domain — startup copilot |
| `operations` | markus | Domain — startup copilot |
| `product` | markus | Domain — startup copilot |
| `sales` | markus | Domain — startup copilot |

### Audit Summary

| Tier | Count | Percentage |
|------|-------|------------|
| Standards | 3 | 10% |
| Methodology | 13 | 42% |
| Personal | 15 | 48% |
| **Total** | **31** | **100%** |

## Rollout Policy

For new skills entering the system:

1. **Start as `personal`** — author creates and uses the skill
2. **Promote to `methodology`** when it proves value across multiple uses or projects
3. **Promote to `standards`** only when skipping it is a quality/safety risk — this bar should be high
4. **Add governance metadata** at promotion time — `tier`, `owner`, `platforms`, `reviewed_at`

For existing skills (this audit): add metadata incrementally. No big-bang migration. The linter (LAT-132) warns on missing metadata but doesn't block.

## Downstream Dependencies

| Ticket | What it consumes from this policy |
|--------|---------------------------------|
| LAT-132 | Tier-aware lint severity (e.g., missing `reviewed_at` on standards = warning) |
| LAT-135 | Tier-aware extraction rules (self-improvement loop respects governance) |

## Changelog

### 1.0.0 (2026-04-14)

- Initial governance policy
- Three-tier model: standards, methodology, personal
- Lightweight ownership-based review model
- Initial audit of 30 skills: 3 standards, 13 methodology, 14 personal
- Rollout policy: start personal, promote on demonstrated value
