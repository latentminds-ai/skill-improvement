# skill-improvement

Rubric-driven evaluation for codebases and AI agent skills.

**Evaluate projects** against quality rubrics (testing, security, CI/CD)  
**Improve skills** by checking SKILL.md files against agent-readiness criteria

---

## Quick Start

### Evaluate a Codebase
```bash
# Auto-generates scorecards/<project-name>/scorecard.md
npx tsx packages/cli/src/bin.ts evaluate /path/to/project benchmark-profiles/enterprise-hello-world/rubric.json
```

### Evaluate a Skill
```bash
npx tsx packages/cli/src/bin.ts evaluate /path/to/skill examples/skill-evaluation-rubric.json
```

### Specify Custom Output
```bash
# Custom scorecard path
npx tsx packages/cli/src/bin.ts evaluate \
  /path/to/project \
  benchmark-profiles/enterprise-hello-world/rubric.json \
  my-custom-scorecard.md
```

### Output Directory
```bash
# Auto-organizes into scorecards/<project-name>/
npx tsx packages/cli/src/bin.ts evaluate \
  /path/to/project \
  benchmark-profiles/enterprise-hello-world/rubric.json \
  scorecards/<project-name>/
```

### Create Your Own Rubric
See [Creating Custom Rubrics](#creating-custom-rubrics) below.

---

## Use Cases

### 1. Code Quality Evaluation
Evaluate any project for engineering best practices:
- ✅ Testing coverage, TypeScript strictness
- ✅ Security posture (secrets, headers, CORS)
- ✅ CI/CD pipeline completeness
- ✅ Git hygiene, documentation

**Rubric:** `benchmark-profiles/enterprise-hello-world/rubric.json` (66 points, 9 tiers)

**Example:**
```bash
npx tsx packages/cli/src/bin.ts evaluate \
  /path/to/my/project \
  benchmark-profiles/enterprise-hello-world/rubric.json \
  quality-scorecard.md
```

### 2. AI Agent Skill Improvement
Check if your SKILL.md files are "agent-ready":
- ✅ Clear output contracts
- ✅ Error handling documentation
- ✅ Composability (references, handoffs)
- ✅ Deterministic verification gates

**Rubric:** `examples/skill-evaluation-rubric.json` (30 points, 4 tiers)

**Example:**
```bash
npx tsx packages/cli/src/bin.ts evaluate \
  /path/to/my/skill \
  examples/skill-evaluation-rubric.json \
  skill-scorecard.md
```

### 3. CI/CD Integration
Add automated quality checks to your pipeline:

```yaml
# GitHub Actions example
- name: Evaluate Project Quality
  run: |
    npx tsx packages/cli/src/bin.ts evaluate \
      . \
      benchmark-profiles/enterprise-hello-world/rubric.json \
      scorecards/$(basename $PWD)/scorecard.md

- name: Evaluate Skills
  run: |
    for skill in skills/*/; do
      npx tsx packages/cli/src/bin.ts evaluate \
        "$skill" \
        examples/skill-evaluation-rubric.json \
        scorecards/$(basename "$skill").md
    done
```

### 4. Custom Domain Rubrics
Create domain-specific evaluation criteria:
- ✅ Frontend design patterns
- ✅ API documentation standards
- ✅ Team-specific workflows
- ✅ Compliance requirements

See [Creating Custom Rubrics](#creating-custom-rubrics) for details.

---

## How It Works

### Heuristic-Based Evaluation

The tool uses **regex patterns and file inspection** (not LLMs) to evaluate:

| Check Type | What It Does | Example |
|------------|--------------|---------|
| `files` | Check file existence | `require: ["README.md"]` |
| `fileContains` | Check file content | `.gitignore` contains `node_modules` |
| `glob` | File pattern matching | `tests/**/*.test.ts` |
| `grepPresent` | Find text in files | `process\.env\.` in src/ |
| `grepAbsent` | Ensure text NOT in files | No `TODO` patterns |
| `jsonPath` | JSON property access | `tsconfig.json.compilerOptions.strict` |
| `exec` | Run shell commands | `npm test`, `npx tsc --noEmit` |
| `http` | Make HTTP requests | `GET /health` expecting 200 |
| `httpTiming` | Measure response time | `GET /` with max 50ms P95 |
| `conditional` | Only if condition met | Docker build only if Dockerfile exists |
| `skillFrontmatter` | Validate SKILL.md YAML | Check for `name`, `description` fields |
| `skillContent` | Analyze SKILL.md body | Check for output contracts, error handling |
| `heuristic` | Approximate LLM judgment | Regex patterns for "no hardcoded values" |

### Why Not LLMs?

| Heuristics | LLM |
|------------|-----|
| ✅ Instant results (milliseconds) | ❌ Takes seconds |
| ✅ Works offline | ❌ Needs internet |
| ✅ No API costs | ❌ Costs money per check |
| ✅ Deterministic (same answer) | ❌ Can vary between runs |
| ✅ Transparent rules | ❌ Black box |

The tool is designed for **practical, repeatable evaluation** that can run in CI/CD without external dependencies.

### Example: "No Hardcoded Values"

**LLM prompt approach:**
> "Review the source code for hardcoded magic strings, numbers, ports, URLs that should be in environment variables."

**Heuristic approach (what the tool actually does):**
```typescript
// From packages/core/src/evaluator/checks/heuristic.ts
const bad = /(localhost|127\.0\.0\.1|:[0-9]{4}[^0-9])/.test(src);
```

The regex looks for patterns like `:3000`, `:5000`, `localhost` — simple, fast, and deterministic.

---

## Limitations & Caveats

### Schema vs. Content Validation

This tool validates **packaging structure** and **pattern presence**, not **actual content quality**.

**What it catches reliably**:
- ✅ Missing files (README.md, SKILL.md)
- ✅ Missing metadata fields (tier, owner, platforms)
- ✅ Missing patterns (keywords like "verify", "output", etc.)

**What it can't assess**:
- ❌ Whether content is actually clear or useful
- ❌ Whether the skill works well in practice
- ❌ Whether guidelines are well-written (vs. just present)

### Why This Limitation Exists

The rubric uses **heuristic proxies** for content quality:

| Intended Check | Actual Check | Gap |
|----------------|--------------|-----|
| "Clear output contract" | Contains "output" or "format" keyword? | Skill could have the keyword but be confusing |
| "Good error handling" | Contains "error", "fail", "fallback"? | Could mention errors without proper handling |
| "Composable" | References other skills? | Could reference without clear handoff |

### Impact on Different Skill Types

**Workflow/Action Skills** (e.g., `test-driven-development`, `writing-plans`):
- ✅ Rubric works well — these skills have concrete outputs
- ✅ Output contracts, references, and verification gates make sense

**Guideline/Mindset Skills** (e.g., `karpathy-guidelines`, `brainstorming`):
- ⚠️ Rubric is less applicable — these provide principles, not outputs
- ⚠️ May penalize for "missing output contract" when none is expected
- ⚠️ Score reflects packaging quality, not guideline quality

### Example: Karpathy Guidelines

When evaluated against the default skill rubric:

```
✅ Basic Structure: 6/6
✅ Agent Readiness: 8/8
⚠️ Content Quality: 4/10  ← Penalized for "no output contract"
✅ Verification Gates: 6/6

Total: 24/30 (B grade)
```

The skill is **excellent content-wise** but gets penalized for not having an output contract section — because the rubric assumes all skills produce specific outputs.

### Open Questions for Improvement

1. **Skill-type aware rubrics** — Should guideline skills have different criteria than workflow skills?
2. **Rubric templates** — Should we provide different rubrics for different skill categories?
3. **Manual override** — Should rubric authors be able to disable certain checks for specific skill types?
4. **Content quality proxies** — Are there better heuristics than keyword matching for assessing actual content quality?
5. **Hybrid approach** — Could we use LLMs selectively (e.g., for final quality gate) while keeping heuristics for CI?
6. **Autoresearch evaluation** — Could an autoresearch system compare actual outputs across sessions to assess skill effectiveness empirically?

See the [docs/specs/README.md](docs/specs/README.md) for related specifications on skill governance and evaluation.

---

## Creating Custom Rubrics

### Basic Structure

```json
{
  "name": "My Custom Rubric",
  "version": "1.0.0",
  "totalPoints": 50,
  "tiers": [
    {
      "id": 0,
      "name": "Basic Requirements",
      "points": 10,
      "criteria": [
        {
          "id": "0.1",
          "name": "README.md exists",
          "type": "deterministic",
          "method": "files",
          "require": ["README.md"],
          "points": 2
        },
        {
          "id": "0.2",
          "name": "Tests exist",
          "type": "deterministic",
          "method": "glob",
          "pattern": "tests/**/*.test.{ts,js}",
          "minCount": 1,
          "points": 3
        }
      ]
    },
    {
      "id": 1,
      "name": "Quality Standards",
      "points": 20,
      "criteria": [
        {
          "id": "1.1",
          "name": "TypeScript strict mode",
          "type": "deterministic",
          "method": "jsonPath",
          "file": "tsconfig.json",
          "path": "compilerOptions.strict",
          "expect": true,
          "points": 5
        },
        {
          "id": "1.2",
          "name": "No hardcoded secrets",
          "type": "deterministic",
          "method": "grepAbsent",
          "pattern": "(password|api_key|secret)\\s*=\\s*['\"][^'\"]+['\"]",
          "paths": ["src/"],
          "points": 5
        }
      ]
    }
  ],
  "grading": {
    "A": { "min": 45, "max": 50, "label": "Excellent" },
    "B": { "min": 35, "max": 44, "label": "Good" },
    "C": { "min": 25, "max": 34, "label": "Satisfactory" },
    "D": { "min": 15, "max": 24, "label": "Needs Work" },
    "F": { "min": 0, "max": 14, "label": "Incomplete" }
  }
}
```

### Check Method Reference

See [SUPPORTED_METHODS](packages/core/src/evaluator/types.ts) for all available check types.

#### File Checks
```json
{
  "method": "files",
  "require": ["README.md", "package.json"],
  "requireAny": ["LICENSE", "LICENSE.md", "LICENSE.txt"]
}
```

#### Content Checks
```json
{
  "method": "fileContains",
  "file": ".gitignore",
  "contains": ["node_modules", "dist", ".env"]
}
```

#### Pattern Checks
```json
{
  "method": "grepPresent",
  "pattern": "process\\.env\\.",
  "paths": ["src/"]
}
```

#### Command Checks
```json
{
  "method": "exec",
  "command": "npm test",
  "expectExitCode": 0,
  "timeout": 30000
}
```

#### HTTP Checks
```json
{
  "method": "http",
  "url": "GET /health",
  "expect": { "status": 200, "bodyContains": "ok" }
}
```

#### JSON Path Checks
```json
{
  "method": "jsonPath",
  "file": "package.json",
  "path": "scripts.test",
  "expectExists": true
}
```

### Skill-Specific Checks

For SKILL.md evaluation, use these special methods:

#### `skillFrontmatter`
Validate YAML frontmatter fields:
```json
{
  "method": "skillFrontmatter",
  "require": ["name", "description"],
  "requireValues": {
    "license": ["MIT", "Apache-2.0", "ISC"]
  },
  "checkNameMatch": true
}
```

#### `skillContent`
Check content dimensions (regex-based heuristics):
```json
{
  "method": "skillContent",
  "check": "outputContract",
  "points": 2
}
```

Available checks:
- `outputContract` — Does it define output format? (looks for `## Output`, `output format`, etc.)
- `failureModes` — Does it document error handling? (looks for `error`, `fail`, `fallback`, etc.)
- `composability` — Does it reference other skills? (looks for `references/`, `handoff`, etc.)
- `deterministicGates` — Are there verification commands? (looks for `scripts/`, `verify`, etc.)
- `sectionStructure` — Does it have organized headings? (counts `##` headings)

Example: [examples/skill-evaluation-rubric.json](examples/skill-evaluation-rubric.json)

---

## Output Structure

By default, evaluations are organized into `scorecards/<project-name>/`:

```
scorecards/
├── llm-council/
│   ├── scorecard.md          # Latest markdown scorecard
│   └── history/              # Timestamped JSON history
│       ├── 2026-04-21T14-04-00-000Z.json
│       └── 2026-04-21T15-00-00-000Z.json
└── using-superpowers/
    └── scorecard.md
```

See [scorecards/README.md](scorecards/README.md) for details.

## Output Formats

### Console Output
```
✅ Tier 0: Basic Structure — 6/6
  ✅ 0.1 SKILL.md exists
  ❌ 0.2 License defined

═══════════════════════════════════════
METRIC total_score=20
METRIC rubric_total_points=30
METRIC tier0_basic_structure=6
METRIC tier1_content_quality=8
═══════════════════════════════════════
```

### Markdown Scorecard
```markdown
# Evaluation Scorecard

**Project:** `/path/to/project`
**Rubric:** My Rubric v1.0.0
**Date:** 2026-04-21

## Summary

| Metric | Value |
|--------|-------|
| **Score** | **20/30** |
| Grade | **C (Satisfactory)** |

## Scores by Tier

| Tier | Score | Bar | Status |
|------|-------|-----|--------|
| 0. Basic Structure | 6/6 | ████████ | ✅ |
| 1. Quality Standards | 8/10 | ███████░ | ⚠️ |

## Passes

- ✅ **0.1** README.md exists — All required files present

## Failures & Fixes

### ❌ 0.2 — License defined
- **Evidence:** Frontmatter issues: missing: license
- **Fix:** Fix frontmatter: missing: license

## Top Next Improvements

1. **0.2 License defined:** Fix frontmatter: missing: license
```

### JSON Report
Timestamped JSON with full evaluation history:
```json
{
  "generatedAt": "2026-04-21T14:04:00.000Z",
  "rubricName": "My Rubric",
  "rubricVersion": "1.0.0",
  "projectPath": "/path/to/project",
  "totalScore": 20,
  "rubricTotalPoints": 30,
  "implementedTotalPoints": 30,
  "tiers": [...],
  "criteria": [...]
}
```

History saved to `history/<timestamp>.json` for trend analysis.

---

## Extending the Evaluator

### Adding New Check Types

1. **Add to SUPPORTED_METHODS** in [types.ts](packages/core/src/evaluator/types.ts)
2. **Implement check function** in [packages/core/src/evaluator/checks/](packages/core/src/evaluator/checks/)
3. **Register in dispatcher** in [dispatch.ts](packages/core/src/evaluator/checks/dispatch.ts)

### Example: Custom Check

```typescript
// packages/core/src/evaluator/checks/myCustomCheck.ts
import type { EvaluationContext, CriterionResult, RubricCriterion } from "../types.js";

export function checkMyCustom(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): CriterionResult {
  const start = Date.now();

  // Your logic here
  const found = /* your check logic */;

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: "myCustom",
    pointsPossible: criterion.points,
    pointsAwarded: found ? criterion.points : 0,
    status: found ? "pass" : "fail",
    evidence: found ? "Pattern found in codebase" : "Pattern not found",
    suggestedFix: found ? undefined : "Add the required pattern",
    durationMs: Date.now() - start,
  };
}
```

See [heuristic.ts](packages/core/src/evaluator/checks/heuristic.ts) for a complete example.

---

## Development Workflow

### Setup
```bash
npm install
npm run typecheck
npm test
```

### Run Evaluation (Development)
```bash
npx tsx packages/cli/src/bin.ts evaluate <project-path> <rubric-path> <scorecard-path>
```

### Build for Distribution
```bash
npm run build
npx skill-improvement evaluate ...
```

### Add Tests
```bash
npm test          # Run all tests
npm run test:watch # Watch mode
```

Tests in: [packages/core/test/](packages/core/test/)

---

## Repository Structure

```
skill-improvement/
├── packages/
│   ├── core/           # Evaluator engine, rubric loader, reporters
│   │   ├── src/
│   │   │   ├── evaluator/
│   │   │   │   ├── checks/      # Check implementations
│   │   │   │   ├── reporters/   # JSON and Markdown output
│   │   │   │   ├── context.js   # Evaluation context
│   │   │   │   ├── rubric.js    # Rubric loading/validation
│   │   │   │   └── types.js     # TypeScript definitions
│   │   │   └── linter/        # Skill package linter
│   │   └── test/          # Unit tests
│   ├── cli/              # Command-line entry points
│   │   └── src/
│   │       ├── bin.ts     # CLI entry point
│   │       └── evaluate.ts # Evaluate command
│   └── pi-extension/     # Pi-specific wrapper (stub)
├── benchmark-profiles/
│   └── enterprise-hello-world/
│       └── rubric.json    # 66-point, 9-tier rubric
├── examples/
│   └── skill-evaluation-rubric.json  # 30-point skill rubric
├── scorecards/         # Generated evaluation results
│   ├── README.md       # Output structure documentation
│   ├── llm-council/
│   │   └── scorecard.md
│   └── using-superpowers/
│       └── scorecard.md
├── scorecards/         # Generated evaluation results
│   ├── README.md       # Output structure documentation
│   ├── llm-council/
│   │   └── scorecard.md
│   └── using-superpowers/
│       └── scorecard.md
├── docs/
│   ├── specs/
│   │   ├── cross-platform-skill-packaging.md
│   │   ├── output-extraction-loop.md
│   │   ├── skill-governance-policy.md
│   │   └── skill-package-schema.md
│   └── bootstrap-notes.md
└── README.md
```

---

## CLI Reference

### Evaluate Command

```bash
skill-improvement evaluate <project-path> [rubric-path] [scorecard-path] [output-dir]
```

**Arguments:**
- `project-path` (required) - Path to the project to evaluate
- `rubric-path` (optional) - Path to rubric JSON (default: `rubric.json`)
- `scorecard-path` (optional) - Path for output scorecard (default: auto-generated)
- `output-dir` (optional) - Output directory (default: `scorecards/<project-name>/`)

**Examples:**

```bash
# Auto-generate scorecard path
npx tsx packages/cli/src/bin.ts evaluate /path/to/project rubric.json
# → scorecards/project/scorecard.md

# Custom scorecard path
npx tsx packages/cli/src/bin.ts evaluate /path/to/project rubric.json custom.md
# → custom.md

# Auto-organize with output directory
npx tsx packages/cli/src/bin.ts evaluate /path/to/project rubric.json scorecards/
# → scorecards/project/scorecard.md

# Evaluate all skills
for skill in skills/*/; do
  npx tsx packages/cli/src/bin.ts evaluate "$skill" rubric.json
done
```

### Lint Command

```bash
skill-improvement lint <skill-path> [skill-path...]
```

Validates skill packages against packaging and governance specs.

**Examples:**

```bash
# Lint a single skill
npx tsx packages/cli/src/bin.ts lint /path/to/skill

# Lint multiple skills
npx tsx packages/cli/src/bin.ts lint skill1/ skill2/ skill3/

# Lint all skills in a directory
for skill in skills/*/; do
  npx tsx packages/cli/src/bin.ts lint "$skill"
done
```

## FAQ

### Does this use AI/LLMs?
No. The tool uses **deterministic heuristics** (regex patterns, file inspection) to approximate what an LLM would judge. This makes it:
- Faster (milliseconds vs seconds)
- Cheaper (no API costs)
- More reliable (same result every time)
- Transparent (you can see the patterns)

### Can I use this for non-code projects?
Yes! The `files`, `glob`, and `exec` methods work on any project. Just create a rubric that matches your needs.

### How do I evaluate multiple skills at once?
```bash
for skill in /path/to/skills/*/; do
  npx tsx packages/cli/src/bin.ts evaluate \
    "$skill" \
    examples/skill-evaluation-rubric.json \
    "$skill/scorecard.md"
done
```

### Can I integrate with my CI/CD?
Yes! The METRIC output format is designed for CI parsing:
```
METRIC total_score=20
METRIC rubric_total_points=30
METRIC tier0_basic_structure=6
```

See [output-extraction-loop.md](docs/specs/output-extraction-loop.md) for details.

### Is this compatible with other tools?
The rubric format is designed to be portable across platforms. See [cross-platform-skill-packaging.md](docs/specs/cross-platform-skill-packaging.md).

### What's the difference between this and the workshop repo?
This is the **permanent product home**. The workshop repo (`_ent_hello-world-workshop`) remains:
- The source/reference for the original demo
- An example consumer, not the system boundary

See [bootstrap-notes.md](docs/bootstrap-notes.md) for migration details.

---

## License

MIT

---

## Contributing

Contributions welcome! Areas of interest:
- Adding new check types
- Improving heuristic patterns
- Extending skill-specific checks
- Documentation improvements

See [skill-governance-policy.md](docs/specs/skill-governance-policy.md) for contribution guidelines.
