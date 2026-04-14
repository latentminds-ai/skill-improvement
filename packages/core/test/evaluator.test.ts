import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { evaluateProject } from "../src/index.js";

function createMiniProject(): string {
  const dir = mkdtempSync(join(tmpdir(), "eval-test-"));
  writeFileSync(join(dir, "README.md"), "# Test Project\nThis is a test project for evaluation.");
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name: "test", scripts: { test: "echo ok" } })
  );
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "src", "index.ts"), 'console.log("hello");');
  return dir;
}

function createMiniRubric(dir: string): string {
  const rubricPath = join(dir, "rubric.json");
  writeFileSync(
    rubricPath,
    JSON.stringify({
      name: "Mini Rubric",
      version: "1.0.0",
      tiers: [
        {
          id: 0,
          name: "Basics",
          points: 2,
          criteria: [
            { id: "0.1", name: "README exists", type: "deterministic", method: "files", require: ["README.md"], points: 1 },
            { id: "0.2", name: "Has src/", type: "deterministic", method: "files", require: ["src/"], points: 1 },
          ],
        },
      ],
    })
  );
  return rubricPath;
}

describe("evaluateProject", () => {
  it("evaluates a passing project against a mini rubric", async () => {
    const projectDir = createMiniProject();
    const rubricPath = createMiniRubric(projectDir);

    const result = await evaluateProject({ projectPath: projectDir, rubricPath });

    expect(result.totalScore).toBe(2);
    expect(result.rubricTotalPoints).toBe(2);
    expect(result.tiers).toHaveLength(1);
    expect(result.tiers[0]!.score).toBe(2);
    expect(result.criteria).toHaveLength(2);
    expect(result.criteria.every((c) => c.status === "pass")).toBe(true);
  });

  it("reports failures for missing files", async () => {
    const dir = mkdtempSync(join(tmpdir(), "eval-test-empty-"));
    const rubricPath = join(dir, "rubric.json");
    writeFileSync(
      rubricPath,
      JSON.stringify({
        name: "Missing Files",
        tiers: [
          {
            id: 0,
            name: "Files",
            points: 1,
            criteria: [
              { id: "0.1", name: "Has config", type: "deterministic", method: "files", require: ["config.yml"], points: 1 },
            ],
          },
        ],
      })
    );

    const result = await evaluateProject({ projectPath: dir, rubricPath });

    expect(result.totalScore).toBe(0);
    expect(result.criteria[0]!.status).toBe("fail");
    expect(result.criteria[0]!.evidence).toContain("config.yml");
  });
});
