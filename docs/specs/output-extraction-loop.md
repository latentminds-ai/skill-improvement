# Evidence-Driven Output-Extraction Loop Specification

**Version:** 1.0.0
**Date:** 2026-04-14
**Status:** Active
**Ticket:** LAT-135
**Depends on:**
- [Skill Package Schema v1.0.2](skill-package-schema.md) (LAT-130)
- [Cross-Platform Skill Packaging v1.0.0](cross-platform-skill-packaging.md) (LAT-133)
- [Skill Governance Policy v1.0.0](skill-governance-policy.md) (LAT-134)
- Agent-readiness evaluator (LAT-131)
- Compatibility linter (LAT-132)

## Purpose

Define the second half of the self-improvement system: extracting candidate skill updates or new skills from real outputs, sessions, and hard-won discoveries. The first half (evaluation and linting) is built. This spec closes the loop.

## Prior Art

This design draws from research documented in `_ent_hello-world-workshop/research/auto-improving-skills-prior-art.md`:

- **Reflexion** (Shinn et al., 2023) — verbal reinforcement from session trajectories
- **SICA** (Robeyns et al., ICLR 2025) — agent modifies its own codebase based on benchmark performance
- **EvoPrompt** (Chen et al., ICLR 2024) — genetic algorithm operators applied to prompts
- **OpenAI Self-Evolving Agents** — LLM-as-Judge + human feedback loops

The workshop used pi-autoresearch as the loop engine with the evaluator as a fitness function. This spec generalizes that architecture for the skill-improvement product.

## Core Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE IMPROVEMENT LOOP                          │
│                                                                 │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐              │
│   │ Evidence  │────▶│ Extract  │────▶│ Candidate│              │
│   │ Capture   │     │ Patterns │     │ Proposal │              │
│   └──────────┘     └──────────┘     └─────┬─────┘              │
│        ▲                                   │                    │
│        │                                   ▼                    │
│   ┌──────────┐                      ┌──────────┐              │
│   │Re-evaluate│◀────────────────────│  Human   │              │
│   │ (score Δ) │     applied         │ Approval │              │
│   └──────────┘                      └──────────┘              │
│                                     MANDATORY GATE              │
└─────────────────────────────────────────────────────────────────┘
```

## 1. Evidence Sources

| Source | What it captures | Format |
|--------|-----------------|--------|
| **Session traces** | Full agent conversation when using a skill — what worked, what failed, where instructions were unclear | Pi session logs, subagent artifacts (`_meta.json`) |
| **Evaluation results** | Agent-readiness scores, per-criterion pass/fail, suggested fixes | JSON from `evaluateProject()` output |
| **Lint results** | Structural and governance findings | JSON from `lintSkillPackage()` output |
| **Manual annotations** | Human observations about skill effectiveness | Freeform markdown |

### Evidence Storage

Evidence is stored per-skill in an `evidence/` directory:

```
my-skill/
├── SKILL.md
├── README.md
├── evidence/
│   ├── sessions/           # session trace summaries
│   │   └── 2026-04-14.md
│   ├── evaluations/        # evaluation JSON snapshots
│   │   └── 2026-04-14.json
│   ├── annotations/        # human notes
│   │   └── 2026-04-14.md
│   └── candidates/         # proposed changes (approved, rejected, deferred)
│       └── 2026-04-14-add-output-format.md
```

The `evidence/` directory is optional and not required by the skill package schema. It is created when the extraction loop is run against a skill.

## 2. Pattern Extraction

An extraction pass scans accumulated evidence and identifies actionable patterns:

| Pattern type | Signal | Example |
|-------------|--------|---------|
| **Repeated failure** | Same criterion fails across multiple evaluations | "Output contract undefined" fails 3 runs in a row |
| **Workaround** | Agent deviates from skill instructions to solve a problem | Session shows agent ignoring step 3 and doing something else that works |
| **Discovery** | Agent finds a better approach not in the skill | Session shows a technique the skill doesn't teach |
| **Regression** | Score dropped after a change | Evaluation delta is negative |
| **Staleness** | Skill references outdated tools/APIs | Lint or session shows tool name mismatches |

Extraction is **LLM-assisted but not LLM-autonomous**. An agent scans evidence and proposes patterns, but patterns are presented to a human for validation, never auto-applied.

## 3. Candidate Generation

From extracted patterns, the system generates **candidates** — proposed changes:

| Candidate type | Description |
|---------------|-------------|
| **Mutation** | Specific edit to an existing skill's SKILL.md (add a section, fix instructions, update a reference) |
| **New skill** | Evidence suggests a capability that no existing skill covers — propose a new `personal` tier skill |
| **Promotion** | Evidence shows a personal skill is used across multiple projects — propose promotion to methodology |
| **Deprecation** | Evidence shows a skill is no longer used or has been superseded — propose deprecation |

### Candidate Format

Each candidate includes:

```markdown
## Candidate: <title>

**Type:** mutation | new-skill | promotion | deprecation
**Skill:** <skill-name>
**Date:** <ISO date>

### What
<The proposed change — diff for mutations, full draft for new skills>

### Why
<The evidence that supports this change — linked session traces, evaluation results>

### Impact
<Expected score delta based on which criteria would change>

### Risk
<What could break — downstream dependencies, format changes, etc.>

### Status
pending | approved | rejected | modified | deferred
```

## 4. Duplicate Detection

Before proposing a candidate, the system checks:

1. **Existing skills**: does another skill already cover this? Search by description similarity and content overlap against the skill inventory.
2. **Prior candidates**: was this already proposed and rejected? Check `evidence/candidates/` history for similar proposals.
3. **Prior mutations**: was a similar change tried and reverted? Check evaluation deltas for regression patterns.

If a duplicate is found, the candidate is **flagged with the prior context** rather than silently dropped. The human may want to reconsider a previously rejected candidate given new evidence.

## 5. Human Approval Gate

**This is mandatory. No exceptions. No auto-apply. No override mechanism.**

### Approval Flow

1. System presents candidate with evidence, diff, impact, and risk
2. Human chooses one of:
   - **Approve**: change is applied, skill is re-evaluated, delta is recorded
   - **Reject**: candidate is logged with rejection reason (feeds into duplicate detection)
   - **Modify**: human edits the proposal, then it's applied as a human-authored change
   - **Defer**: candidate stays in the queue for later review
3. All decisions are recorded in `evidence/candidates/` with timestamp and rationale

### Why No Auto-Apply

Skills are agent instructions. A bad mutation can cause cascading failures across all sessions that use the skill. The cost of a bad edit is high; the cost of a human reviewing a diff is low. This gate is permanent.

## 6. Feedback Loop

After a candidate is applied:

1. **Check variant impact**: if the skill is Tier 3 (full variant), surface the variant SKILL.md files that need manual updating. The approver should be aware of variant re-sync requirements before the change is finalized. This follows the manual-sync-with-linter-assistance model from the cross-platform packaging spec (LAT-133).
2. **Re-evaluate** the skill against the agent-readiness rubric
3. **Re-lint** the skill against packaging and governance specs (this catches variant drift if variants were not updated)
4. **Record the delta**:
   ```json
   {
     "candidate": "add-output-format",
     "before": { "score": 22, "timestamp": "2026-04-14T10:00:00Z" },
     "after": { "score": 27, "timestamp": "2026-04-14T10:05:00Z" },
     "delta": 5,
     "evidence": ["sessions/2026-04-12.md", "evaluations/2026-04-13.json"]
   }
   ```
5. **If regression** (score dropped): alert the human. Do not auto-revert — the human decides whether to revert, adjust, or accept the regression.
6. **Delta history** feeds into future extraction as evidence of what works and what doesn't.

## 7. End-to-End Example

**Scenario**: The `brainstorming` skill scores 18/30 on agent-readiness.

### Step 1: Evidence Capture

Three evaluation runs show criterion 3.1 (output format) failing every time. A session trace from 2026-04-12 shows an agent using the skill but producing inconsistent output formats — the agent improvised a format because the skill didn't specify one.

### Step 2: Pattern Extraction

Agent scans evidence and identifies: "Repeated failure: output format undefined. Sessions show agents producing ad-hoc formats because SKILL.md doesn't define one."

### Step 3: Candidate Generation

```markdown
## Candidate: Add output format to brainstorming

**Type:** mutation
**Skill:** brainstorming
**Date:** 2026-04-14

### What
Add "## Output Format" section to SKILL.md defining the spec document structure:
- Required sections: Purpose, Architecture, Components, Data Flow
- Format: Markdown with H2 headings
- Length: scaled to complexity

### Why
- Criterion 3.1 fails in 3/3 evaluations
- Session 2026-04-12: agent produced unstructured output, had to restart
- Session 2026-04-13: agent produced a different format each time

### Impact
+2 points (criterion 3.1 would pass), score 18 → 20

### Risk
Low — additive change, doesn't alter existing instructions.

### Status
pending
```

### Step 4: Duplicate Detection

No prior candidates for this change. No similar rejected proposals. Passes.

### Step 5: Human Approval

Human reviews the diff, sees it's a clean additive change, approves.

### Step 6: Apply + Re-evaluate

Change is applied to SKILL.md. Re-evaluation scores 20/30. Delta of +2 recorded. Candidate status updated to `approved`. Evidence archived.

## Integration with Existing Infrastructure

| Component | Role in the loop |
|-----------|-----------------|
| `evaluateProject()` (LAT-131) | Produces evaluation evidence; re-evaluates after mutations |
| `lintSkillPackage()` (LAT-132) | Produces lint evidence; re-lints after mutations |
| Agent-readiness rubric | Fitness function for scoring skill quality |
| Governance policy (LAT-134) | Determines approval requirements by tier (peer review for standards) |
| Cross-platform packaging (LAT-133) | Variant-aware extraction (mutations apply to canonical, variants re-synced) |

## Governance Interaction

The extraction loop respects governance tiers:

| Tier | Extraction behavior |
|------|-------------------|
| `standards` | Candidates require peer review even after human approval. Higher evidence bar (3+ sessions or evaluations supporting the change). |
| `methodology` | Owner approves. Moderate evidence bar (2+ sessions or 2+ evaluation failures supporting the change). |
| `personal` | Owner approves. Low evidence bar — even a single session can justify a change. |

## Changelog

### 1.0.0 (2026-04-14)

- Initial specification
- Evidence capture: session traces, evaluations, lint results, manual annotations
- Pattern extraction: repeated failure, workaround, discovery, regression, staleness
- Candidate types: mutation, new skill, promotion, deprecation
- Duplicate detection against existing skills and prior candidates
- Mandatory human approval gate with approve/reject/modify/defer
- Feedback loop: re-evaluate, record delta, alert on regression
- End-to-end example: brainstorming skill output format improvement
