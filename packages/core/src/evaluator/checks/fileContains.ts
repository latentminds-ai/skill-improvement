import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { EvaluationContext } from "../context.js";
import type { CriterionResult, RubricCriterion } from "../types.js";

export function checkFileContains(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): CriterionResult {
  const start = Date.now();
  const file = criterion.file as string;
  const contains = (criterion.contains as string[]) ?? [];
  const fullPath = join(context.projectPath, file);

  if (!existsSync(fullPath)) {
    return {
      id: criterion.id,
      tierId,
      name: criterion.name,
      method: criterion.method,
      pointsPossible: criterion.points,
      pointsAwarded: 0,
      status: "fail",
      evidence: `File not found: ${file}`,
      suggestedFix: `Create ${file}`,
      durationMs: Date.now() - start,
    };
  }

  const content = readFileSync(fullPath, "utf8");
  const missing = contains.filter((needle) => !content.includes(needle));

  const passed = missing.length === 0;
  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: passed ? criterion.points : 0,
    status: passed ? "pass" : "fail",
    evidence: passed
      ? `${file} contains all required strings`
      : `${file} missing: ${missing.join(", ")}`,
    suggestedFix: passed ? undefined : `Add ${missing.join(", ")} to ${file}`,
    durationMs: Date.now() - start,
  };
}
