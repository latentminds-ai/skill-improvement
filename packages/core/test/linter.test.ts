import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { lintSkillPackage, formatLintResult } from "../src/index.js";

function makeSkillDir(name: string): string {
  const parent = mkdtempSync(join(tmpdir(), "lint-"));
  const dir = join(parent, name);
  mkdirSync(dir);
  return dir;
}

function writeSkillMd(dir: string, frontmatter: string, body = "# Skill\n\nInstructions."): void {
  writeFileSync(join(dir, "SKILL.md"), `---\n${frontmatter}\n---\n\n${body}`);
}

// ── Structure rules ──────────────────────────────────────────────────

describe("linter: structure rules", () => {
  it("errors on missing SKILL.md", () => {
    const dir = makeSkillDir("no-skill");
    writeFileSync(join(dir, "README.md"), "# Hi");

    const result = lintSkillPackage(dir);
    expect(result.errors).toBeGreaterThan(0);
    expect(result.findings.some((f) => f.rule === "structure/skill-md-required")).toBe(true);
  });

  it("errors on missing README.md", () => {
    const dir = makeSkillDir("no-readme");
    writeSkillMd(dir, 'name: no-readme\ndescription: "Test skill"');

    const result = lintSkillPackage(dir);
    expect(result.findings.some((f) => f.rule === "structure/readme-required")).toBe(true);
  });
});

// ── Frontmatter rules ────────────────────────────────────────────────

describe("linter: frontmatter rules", () => {
  it("errors on invalid YAML frontmatter", () => {
    const dir = makeSkillDir("bad-yaml");
    writeFileSync(join(dir, "SKILL.md"), "No frontmatter here");
    writeFileSync(join(dir, "README.md"), "# Hi");

    const result = lintSkillPackage(dir);
    expect(result.findings.some((f) => f.rule === "frontmatter/valid-yaml")).toBe(true);
  });

  it("warns on name/directory mismatch", () => {
    const dir = makeSkillDir("dir-name");
    writeSkillMd(dir, 'name: different-name\ndescription: "Test skill with trigger. Use when testing."');
    writeFileSync(join(dir, "README.md"), "# Hi");

    const result = lintSkillPackage(dir);
    expect(result.findings.some((f) => f.rule === "frontmatter/name-matches-dir")).toBe(true);
  });

  it("warns on invalid name format", () => {
    const dir = makeSkillDir("BadName");
    writeSkillMd(dir, 'name: BadName\ndescription: "Test skill"');
    writeFileSync(join(dir, "README.md"), "# Hi");

    const result = lintSkillPackage(dir);
    expect(result.findings.some((f) => f.rule === "frontmatter/name-format")).toBe(true);
  });
});

// ── Governance rules ─────────────────────────────────────────────────

describe("linter: governance rules", () => {
  it("warns on missing governance metadata", () => {
    const dir = makeSkillDir("no-gov");
    writeSkillMd(dir, 'name: no-gov\ndescription: "Test skill. Use when testing."');
    writeFileSync(join(dir, "README.md"), "# Hi");

    const result = lintSkillPackage(dir);
    expect(result.findings.some((f) => f.rule === "governance/metadata-block")).toBe(true);
    expect(result.errors).toBe(0); // governance is warning, not error
  });

  it("warns on missing tier/owner/platforms", () => {
    const dir = makeSkillDir("partial-gov");
    writeSkillMd(dir, 'name: partial-gov\ndescription: "Test. Use when testing."\nmetadata:\n  author: me');
    writeFileSync(join(dir, "README.md"), "# Hi");

    const result = lintSkillPackage(dir);
    expect(result.findings.some((f) => f.rule === "governance/tier-required")).toBe(true);
    expect(result.findings.some((f) => f.rule === "governance/owner-required")).toBe(true);
    expect(result.findings.some((f) => f.rule === "governance/platforms-required")).toBe(true);
  });

  it("warns on invalid tier value", () => {
    const dir = makeSkillDir("bad-tier");
    writeSkillMd(dir, 'name: bad-tier\ndescription: "Test. Use when testing."\nmetadata:\n  tier: advanced\n  owner: me\n  platforms:\n    - pi');
    writeFileSync(join(dir, "README.md"), "# Hi");

    const result = lintSkillPackage(dir);
    expect(result.findings.some((f) => f.rule === "governance/tier-valid")).toBe(true);
  });

  it("warns on missing reviewed_at for standards tier", () => {
    const dir = makeSkillDir("standards-no-review");
    writeSkillMd(
      dir,
      'name: standards-no-review\ndescription: "Test. Use when testing."\nmetadata:\n  tier: standards\n  owner: me\n  platforms:\n    - pi'
    );
    writeFileSync(join(dir, "README.md"), "# Hi");

    const result = lintSkillPackage(dir);
    expect(result.findings.some((f) => f.rule === "governance/reviewed-at-expected")).toBe(true);
  });

  it("warns on unknown platform", () => {
    const dir = makeSkillDir("bad-platform");
    writeSkillMd(
      dir,
      'name: bad-platform\ndescription: "Test. Use when testing."\nmetadata:\n  tier: personal\n  owner: me\n  platforms:\n    - pi\n    - gemeni'
    );
    writeFileSync(join(dir, "README.md"), "# Hi");

    const result = lintSkillPackage(dir);
    expect(result.findings.some((f) => f.rule === "governance/platform-known")).toBe(true);
  });

  it("reports info on missing optional fields", () => {
    const dir = makeSkillDir("no-optionals");
    writeSkillMd(
      dir,
      'name: no-optionals\ndescription: "Test. Use when testing."\nmetadata:\n  tier: personal\n  owner: me\n  platforms:\n    - pi'
    );
    writeFileSync(join(dir, "README.md"), "# Hi");

    const result = lintSkillPackage(dir);
    expect(result.findings.some((f) => f.rule === "governance/scope-default" && f.severity === "info")).toBe(true);
    expect(result.findings.some((f) => f.rule === "governance/status-default" && f.severity === "info")).toBe(true);
  });
});

// ── Description rules ────────────────────────────────────────────────

describe("linter: description rules", () => {
  it("warns on short description", () => {
    const dir = makeSkillDir("short-desc");
    writeSkillMd(dir, 'name: short-desc\ndescription: "Short"');
    writeFileSync(join(dir, "README.md"), "# Hi");

    const result = lintSkillPackage(dir);
    expect(result.findings.some((f) => f.rule === "description/too-short")).toBe(true);
  });

  it("warns on vague description start", () => {
    const dir = makeSkillDir("vague-desc");
    writeSkillMd(dir, 'name: vague-desc\ndescription: "Helps with various things in the project"');
    writeFileSync(join(dir, "README.md"), "# Hi");

    const result = lintSkillPackage(dir);
    expect(result.findings.some((f) => f.rule === "description/vague-start")).toBe(true);
  });
});

// ── Variants rules ───────────────────────────────────────────────────

describe("linter: variants rules", () => {
  it("errors on variant name mismatch", () => {
    const dir = makeSkillDir("my-skill");
    writeSkillMd(dir, 'name: my-skill\ndescription: "Test. Use when testing."');
    writeFileSync(join(dir, "README.md"), "# Hi");

    mkdirSync(join(dir, "variants", "codex"), { recursive: true });
    writeFileSync(
      join(dir, "variants", "codex", "SKILL.md"),
      '---\nname: wrong-name\ndescription: "Test"\n---\n\n# Body'
    );

    const result = lintSkillPackage(dir);
    expect(result.findings.some((f) => f.rule === "variants/name-mismatch")).toBe(true);
    expect(result.passed).toBe(false);
  });

  it("errors on duplicated shared resource in variant", () => {
    const dir = makeSkillDir("dup-shared");
    writeSkillMd(dir, 'name: dup-shared\ndescription: "Test. Use when testing."');
    writeFileSync(join(dir, "README.md"), "# Hi");

    mkdirSync(join(dir, "variants", "codex", "references"), { recursive: true });
    writeFileSync(join(dir, "variants", "codex", "references", "thing.md"), "# Thing");

    const result = lintSkillPackage(dir);
    expect(result.findings.some((f) => f.rule === "variants/duplicated-shared-resource")).toBe(true);
    expect(result.passed).toBe(false);
  });
});

// ── Full pass / formatLintResult ─────────────────────────────────────

describe("linter: well-formed skill", () => {
  it("passes with zero errors on a complete skill", () => {
    const dir = makeSkillDir("good-skill");
    writeSkillMd(
      dir,
      'name: good-skill\ndescription: "Review code for correctness and style issues. Use when completing a PR or reviewing changes."\nmetadata:\n  tier: methodology\n  owner: latentminds\n  platforms:\n    - pi\n    - claude-code\n  version: "1.0.0"\n  scope: global\n  status: active\n  reviewed_at: "2026-04-14"'
    );
    writeFileSync(join(dir, "README.md"), "# good-skill\n\nA well-formed skill package.");

    const result = lintSkillPackage(dir);
    expect(result.passed).toBe(true);
    expect(result.errors).toBe(0);
    expect(result.warnings).toBe(0);
  });

  it("formatLintResult produces readable output", () => {
    const dir = makeSkillDir("format-test");
    writeSkillMd(dir, 'name: format-test\ndescription: "Short"');

    const result = lintSkillPackage(dir);
    const output = formatLintResult(result);
    expect(output).toContain("format-test");
    expect(output).toContain("❌"); // has errors (missing README)
  });
});
