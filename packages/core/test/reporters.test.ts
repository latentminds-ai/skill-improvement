import { describe, expect, it } from "vitest";

import { renderScorecard, formatMetrics } from "../src/index.js";
import type { EvaluationResult, LoadedRubric, MetricsInput } from "../src/index.js";

function makeResult(overrides?: Partial<EvaluationResult>): EvaluationResult {
  const rubric: LoadedRubric = {
    name: "Test Rubric",
    version: "1.0.0",
    totalPoints: 4,
    implementedPoints: 4,
    tiers: [
      { id: 0, name: "Basics", points: 2, criteria: [] },
      { id: 1, name: "Advanced", points: 2, criteria: [] },
    ],
    grading: {
      A: { min: 4, max: 4, label: "Perfect" },
      F: { min: 0, max: 1, label: "Failing" },
    },
  };

  return {
    rubric,
    projectPath: "/tmp/test",
    totalScore: 3,
    rubricTotalPoints: 4,
    implementedTotalPoints: 4,
    criteria: [
      { id: "0.1", tierId: 0, name: "Check A", method: "files", pointsPossible: 1, pointsAwarded: 1, status: "pass", evidence: "Found", durationMs: 1 },
      { id: "0.2", tierId: 0, name: "Check B", method: "files", pointsPossible: 1, pointsAwarded: 1, status: "pass", evidence: "Found", durationMs: 1 },
      { id: "1.1", tierId: 1, name: "Check C", method: "exec", pointsPossible: 1, pointsAwarded: 1, status: "pass", evidence: "Passed", durationMs: 5 },
      { id: "1.2", tierId: 1, name: "Check D", method: "exec", pointsPossible: 1, pointsAwarded: 0, status: "fail", evidence: "Failed", suggestedFix: "Fix it", durationMs: 5 },
    ],
    tiers: [
      { id: 0, name: "Basics", score: 2, possiblePoints: 2 },
      { id: 1, name: "Advanced", score: 1, possiblePoints: 2 },
    ],
    ...overrides,
  };
}

describe("renderScorecard", () => {
  it("produces markdown with summary, tiers, passes, and failures", () => {
    const md = renderScorecard(makeResult());

    expect(md).toContain("# Evaluation Scorecard");
    expect(md).toContain("**Score** | **3/4**");
    expect(md).toContain("Basics");
    expect(md).toContain("Advanced");
    expect(md).toContain("✅");
    expect(md).toContain("❌ 1.2 — Check D");
    expect(md).toContain("Fix it");
  });

  it("renders grade from rubric grading bands", () => {
    const md = renderScorecard(makeResult({ totalScore: 4 }));
    expect(md).toContain("A (Perfect)");
  });
});

describe("formatMetrics", () => {
  it("produces METRIC lines for total and tier scores", () => {
    const result = makeResult();
    const input: MetricsInput = {
      rubric: result.rubric,
      totalScore: result.totalScore,
      rubricTotalPoints: result.rubricTotalPoints,
      implementedTotalPoints: result.implementedTotalPoints,
      tierScores: new Map(result.tiers.map((t) => [t.id, t.score])),
    };

    const lines = formatMetrics(input);

    expect(lines).toContain("METRIC total_score=3");
    expect(lines).toContain("METRIC rubric_total_points=4");
    expect(lines).toContain("METRIC implemented_total_points=4");
    expect(lines.some((l) => l.startsWith("METRIC tier0_"))).toBe(true);
    expect(lines.some((l) => l.startsWith("METRIC tier1_"))).toBe(true);
  });
});
