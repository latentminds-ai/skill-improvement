# Examples

Example skill packages and rubrics for the skill-improvement system.

## Structure

```
examples/
├── rubrics/
│   └── skill-evaluation-rubric.json
└── skills/
    ├── example-code-review/
    └── karpathy-guidelines/
```

## Usage

Evaluate a skill:

```bash
npx tsx packages/cli/src/bin.ts evaluate \
  examples/skills/karpathy-guidelines \
  examples/rubrics/skill-evaluation-rubric.json
```

See individual skill READMEs for details.

## Skill Package Template

```skill-name/
├── SKILL.md              # Agent instructions + metadata
├── README.md             # Human documentation
├── EVALUATION.md         # Evaluation results (optional)
├── rubric.json           # Skill-specific rubric (optional)
├── references/           # Detailed docs (optional)
└── scripts/              # Helper tools (optional)
```

## Notes

- `SKILL.md` must have YAML frontmatter with `name`, `description`, `metadata`
- `EVALUATION.md` shows test results and improvement suggestions
- Use `examples/rubrics/skill-evaluation-rubric.json` for general evaluation
