import { globSync } from "tinyglobby";

import type { EvaluationContext } from "../context.js";
import type { CriterionResult, RubricCriterion } from "../types.js";

export function checkGlob(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): CriterionResult {
  const start = Date.now();
  const pattern = criterion.pattern as string;
  const minCount = (criterion.minCount as number) ?? 1;

  const matches = globSync(pattern, { cwd: context.projectPath });
  const passed = matches.length >= minCount;

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: passed ? criterion.points : 0,
    status: passed ? "pass" : "fail",
    evidence: passed
      ? `Found ${matches.length} files matching ${pattern}`
      : `Found ${matches.length} files matching ${pattern} (need ≥${minCount})`,
    suggestedFix: passed ? undefined : `Add files matching ${pattern}`,
    durationMs: Date.now() - start,
  };
}
