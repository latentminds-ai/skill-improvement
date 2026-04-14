# Agent Readiness Benchmark Profile

Evaluates skill packages for agent-readiness — whether a skill is safe, reliable, and well-structured when called by agents or chained workflows.

## Rubric

`rubric.json` — 30 points across 6 tiers:

| Tier | Name | Points |
|------|------|--------|
| 0 | Package Structure | 4 |
| 1 | Routing Quality | 6 |
| 2 | Governance Metadata | 5 |
| 3 | Output Contract | 5 |
| 4 | Edge-Case Handling | 5 |
| 5 | Composability | 5 |

## Grading

| Grade | Range | Label |
|-------|-------|-------|
| F | 0–5 | Not agent-ready |
| D | 6–12 | Minimally functional |
| C | 13–19 | Usable |
| B | 20–25 | Well-structured |
| A | 26–30 | Agent-optimized |

## Usage

```bash
# Evaluate a skill package
npx tsx packages/cli/src/bin.ts evaluate /path/to/my-skill benchmark-profiles/agent-readiness/rubric.json

# Example: evaluate the example skill
npx tsx packages/cli/src/bin.ts evaluate examples/skills/example-code-review benchmark-profiles/agent-readiness/rubric.json
```

## What It Checks

- **Package Structure**: SKILL.md and README.md exist, valid frontmatter, name matches directory
- **Routing Quality**: Description is specific, includes trigger keywords, avoids vague language
- **Governance Metadata**: tier, owner, platforms declared in metadata block
- **Output Contract**: Output format defined, organized sections, substantive content
- **Edge-Case Handling**: Failure modes documented, guard rails present
- **Composability**: References/scripts for on-demand loading, deterministic verification gates
