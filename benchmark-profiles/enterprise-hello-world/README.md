# Enterprise Hello World Benchmark Profile

The first benchmark profile for the skill-improvement system, migrated from `_ent_hello-world-workshop`.

## Rubric

`rubric.json` — 66 points across 9 tiers:

| Tier | Name | Points |
|------|------|--------|
| 0 | Proof of Life | 4 |
| 1 | Engineering Foundations | 8 |
| 2 | Testing Discipline | 8 |
| 3 | Security Posture | 10 |
| 4 | Operational Readiness | 8 |
| 5 | CI/CD Pipeline | 8 |
| 6 | Git Hygiene | 8 |
| 7 | Performance & Resilience | 6 |
| 8 | Documentation & DX | 6 |

## Grading

| Grade | Range | Label |
|-------|-------|-------|
| F | 0–4 | Proof of Life only |
| D | 5–20 | Hobby project |
| C | 21–40 | Professional |
| B | 41–55 | Production-ready |
| A | 56–66 | Enterprise-grade |

## Usage

```bash
# From the repo root, after building:
skill-improvement evaluate /path/to/project benchmark-profiles/enterprise-hello-world/rubric.json

# Or with tsx during development:
npx tsx packages/cli/src/bin.ts evaluate /path/to/project benchmark-profiles/enterprise-hello-world/rubric.json
```

## Source

Migrated from `/Users/mstrazds/devel/code/latentminds/_ent_hello-world-workshop/rubric.json`.
