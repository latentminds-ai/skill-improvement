import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { evaluateProject, parseSkillFrontmatter, extractSkillBody, loadRubricFromFile } from "../src/index.js";
import { resolve } from "node:path";

const RUBRIC_PATH = resolve(__dirname, "../../../benchmark-profiles/agent-readiness/rubric.json");

function writeSkill(dir: string, frontmatter: string, body: string): void {
  writeFileSync(join(dir, "SKILL.md"), `---\n${frontmatter}\n---\n\n${body}`);
}

// ── parseSkillFrontmatter ────────────────────────────────────────────

describe("parseSkillFrontmatter", () => {
  it("parses valid frontmatter", () => {
    const dir = mkdtempSync(join(tmpdir(), "skill-fm-"));
    writeSkill(dir, 'name: test-skill\ndescription: "A test skill"', "# Body");
    const fm = parseSkillFrontmatter(join(dir, "SKILL.md"));
    expect(fm?.name).toBe("test-skill");
    expect(fm?.description).toBe("A test skill");
  });

  it("parses nested metadata", () => {
    const dir = mkdtempSync(join(tmpdir(), "skill-fm-"));
    writeSkill(
      dir,
      'name: test-skill\ndescription: "desc"\nmetadata:\n  tier: methodology\n  owner: markus\n  platforms:\n    - pi\n    - codex',
      "# Body"
    );
    const fm = parseSkillFrontmatter(join(dir, "SKILL.md"));
    expect(fm?.metadata?.tier).toBe("methodology");
    expect(fm?.metadata?.owner).toBe("markus");
    expect(fm?.metadata?.platforms).toEqual(["pi", "codex"]);
  });

  it("returns null for missing file", () => {
    expect(parseSkillFrontmatter("/nonexistent/SKILL.md")).toBeNull();
  });

  it("returns null for file without frontmatter", () => {
    const dir = mkdtempSync(join(tmpdir(), "skill-fm-"));
    writeFileSync(join(dir, "SKILL.md"), "# Just a heading\nNo frontmatter here.");
    expect(parseSkillFrontmatter(join(dir, "SKILL.md"))).toBeNull();
  });
});

// ── extractSkillBody ─────────────────────────────────────────────────

describe("extractSkillBody", () => {
  it("extracts body after frontmatter", () => {
    const dir = mkdtempSync(join(tmpdir(), "skill-body-"));
    writeSkill(dir, "name: test", "# My Skill\n\nSome instructions.");
    const body = extractSkillBody(join(dir, "SKILL.md"));
    expect(body).toContain("# My Skill");
    expect(body).toContain("Some instructions.");
    expect(body).not.toContain("name: test");
  });
});

// ── Agent-readiness rubric loads ─────────────────────────────────────

describe("agent-readiness rubric", () => {
  it("loads and validates the rubric", () => {
    const rubric = loadRubricFromFile(RUBRIC_PATH);
    expect(rubric.name).toBe("Agent Readiness");
    expect(rubric.totalPoints).toBe(30);
    expect(rubric.tiers).toHaveLength(6);
  });

  it("all criteria use supported methods", () => {
    const rubric = loadRubricFromFile(RUBRIC_PATH);
    expect(rubric.implementedPoints).toBe(rubric.totalPoints);
  });
});

// ── Full evaluation against agent-readiness rubric ───────────────────

describe("evaluateProject with agent-readiness rubric", () => {
  it("scores a well-formed skill package", () => {
    const dir = mkdtempSync(join(tmpdir(), "skill-eval-"));
    // Name the dir to match skill name
    const skillDir = join(dir, "example-code-review");
    mkdirSync(skillDir);
    mkdirSync(join(skillDir, "references"));
    mkdirSync(join(skillDir, "scripts"));

    writeFileSync(
      join(skillDir, "SKILL.md"),
      `---
name: example-code-review
description: "Review code changes for correctness, style, and security issues. Use when completing a PR, reviewing a diff, or before merging feature branches."
metadata:
  tier: methodology
  owner: latentminds
  platforms:
    - pi
    - claude-code
    - codex
  version: "1.0.0"
---

# Code Review

## When to Use
Before merging any feature branch or when asked to review changes.

## Process
1. Read the diff via scripts/diff-summary.sh
2. Check against the [review checklist](references/review-checklist.md)
3. Report findings with severity and suggested fixes

## Output Format

\`\`\`
## Review: <branch>
### Critical
- [ ] <finding>
### Verdict: APPROVE | REQUEST CHANGES
\`\`\`

## Error Handling
- If the diff is empty, report "No changes to review" and do NOT approve
- If scripts fail, fall back to manual diff reading
- NEVER approve without reading the full diff
- MUST check all items in the checklist before approving
`
    );
    writeFileSync(join(skillDir, "README.md"), "# example-code-review\nA code review skill.\n".repeat(10));
    writeFileSync(join(skillDir, "references", "checklist.md"), "# Checklist\n- Check 1\n- Check 2");
    writeFileSync(join(skillDir, "scripts", "diff-summary.sh"), "#!/bin/bash\ngit diff --stat");

    return evaluateProject({ projectPath: skillDir, rubricPath: RUBRIC_PATH }).then((result) => {
      // Should score well on most tiers
      expect(result.totalScore).toBeGreaterThanOrEqual(20);
      expect(result.rubricTotalPoints).toBe(30);

      // Tier 0: Package Structure — all should pass
      const tier0 = result.criteria.filter((c) => c.tierId === 0);
      expect(tier0.every((c) => c.status === "pass")).toBe(true);

      // Tier 1: Routing Quality — should score well
      const tier1Score = result.criteria
        .filter((c) => c.tierId === 1)
        .reduce((sum, c) => sum + c.pointsAwarded, 0);
      expect(tier1Score).toBeGreaterThanOrEqual(4);
    });
  });

  it("scores a minimal/bare skill package low", () => {
    const dir = mkdtempSync(join(tmpdir(), "skill-eval-bare-"));
    const skillDir = join(dir, "bare-skill");
    mkdirSync(skillDir);

    writeFileSync(
      join(skillDir, "SKILL.md"),
      `---
name: bare-skill
description: "Helps with stuff."
---

Does things.
`
    );

    return evaluateProject({ projectPath: skillDir, rubricPath: RUBRIC_PATH }).then((result) => {
      // Should score low — missing README, metadata, structure
      expect(result.totalScore).toBeLessThan(10);

      // Should have failures
      const failures = result.criteria.filter((c) => c.status === "fail");
      expect(failures.length).toBeGreaterThan(5);
    });
  });
});
