import { resolve } from "node:path";
import { writeFileSync } from "node:fs";

import {
  evaluateProject,
  formatMetrics,
  renderScorecard,
  writeJsonReport,
} from "@latentminds/skill-improvement-core";

export interface EvaluateOptions {
  projectPath: string;
  rubricPath: string;
  scorecardPath: string;
  jsonOutputDir?: string;
}

export async function runEvaluate(options: EvaluateOptions): Promise<void> {
  const { projectPath, rubricPath, scorecardPath, jsonOutputDir } = options;

  let result;
  try {
    result = await evaluateProject({
      projectPath: resolve(projectPath),
      rubricPath: resolve(rubricPath),
    });
  } catch (err) {
    console.error(`Evaluation failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }

  // Human-readable tier summary
  console.log("");
  for (const tier of result.tiers) {
    const status = tier.score === tier.possiblePoints ? "✅" : tier.score > 0 ? "⚠️" : "❌";
    console.log(`  ${status} Tier ${tier.id}: ${tier.name} — ${tier.score}/${tier.possiblePoints}`);
  }

  // Criterion details
  for (const criterion of result.criteria) {
    const icon =
      criterion.status === "pass"
        ? "✅"
        : criterion.status === "fail"
          ? "❌"
          : criterion.status === "skipped"
            ? "⏭️"
            : criterion.status === "unsupported"
              ? "⬜"
              : "⚠️";
    console.log(`  ${icon} ${criterion.id} ${criterion.name}`);
  }

  console.log("");
  console.log("═══════════════════════════════════════");

  // Stable METRIC lines for autoresearch/TUI
  const metrics = formatMetrics({
    rubric: result.rubric,
    totalScore: result.totalScore,
    rubricTotalPoints: result.rubricTotalPoints,
    implementedTotalPoints: result.implementedTotalPoints,
    tierScores: new Map(result.tiers.map((t) => [t.id, t.score])),
  });

  for (const line of metrics) {
    console.log(line);
  }

  console.log("═══════════════════════════════════════");

  // Write JSON report
  if (jsonOutputDir) {
    try {
      writeJsonReport(result, { outputDir: resolve(jsonOutputDir) });
    } catch {
      // Non-fatal — output dir might not exist
    }
  }

  // Write SCORECARD.md
  const scorecard = renderScorecard(result);
  writeFileSync(resolve(scorecardPath), scorecard, "utf8");
  console.log(`\nScorecard written to ${scorecardPath}`);
}
