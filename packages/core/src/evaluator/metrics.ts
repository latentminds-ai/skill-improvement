import { tierMetricName } from "./rubric.js";
import type { MetricsInput } from "./types.js";

export function formatMetrics(input: MetricsInput): string[] {
  const lines = [
    `METRIC total_score=${input.totalScore}`,
    `METRIC rubric_total_points=${input.rubricTotalPoints}`,
    `METRIC implemented_total_points=${input.implementedTotalPoints}`,
  ];

  for (const tier of input.rubric.tiers) {
    lines.push(`METRIC ${tierMetricName(tier)}=${input.tierScores.get(tier.id) ?? 0}`);
  }

  return lines;
}
