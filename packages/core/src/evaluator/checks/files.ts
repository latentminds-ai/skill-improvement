import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

import type { EvaluationContext } from "../context.js";
import type { CriterionResult, RubricCriterion } from "../types.js";

export function checkFiles(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): CriterionResult {
  const start = Date.now();
  const require = (criterion.require as string[] | undefined) ?? [];
  const requireAny = (criterion.requireAny as string[] | undefined) ?? [];
  const minSize = (criterion.minSize as number | undefined) ?? 0;

  const missing: string[] = [];
  for (const file of require) {
    const full = join(context.projectPath, file);
    if (!existsSync(full)) {
      missing.push(file);
    } else if (minSize > 0 && statSync(full).size < minSize) {
      missing.push(`${file} (too small, need ≥${minSize} bytes)`);
    }
  }

  let anyFound = requireAny.length === 0;
  for (const file of requireAny) {
    if (existsSync(join(context.projectPath, file))) {
      anyFound = true;
      break;
    }
  }

  const passed = missing.length === 0 && anyFound;

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: passed ? criterion.points : 0,
    status: passed ? "pass" : "fail",
    evidence: passed
      ? "All required files present"
      : missing.length > 0
        ? `Missing: ${missing.join(", ")}`
        : `None of required files found: ${requireAny.join(", ")}`,
    suggestedFix: passed ? undefined : "Create the missing files",
    durationMs: Date.now() - start,
  };
}
