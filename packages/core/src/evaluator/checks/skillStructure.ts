import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

import type { EvaluationContext } from "../context.js";
import type { CriterionResult, RubricCriterion } from "../types.js";

/**
 * Check skill package directory structure.
 * Reuses the same require/requireAny pattern as the files check,
 * but scoped to the skill package schema expectations.
 *
 * Criterion fields:
 * - require: string[] — files/dirs that must exist
 * - requireAny: string[] — at least one must exist
 * - minSize: number — minimum byte size for required files
 * - requireExecutable: string[] — files that must be executable
 */
export function checkSkillStructure(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): CriterionResult {
  const start = Date.now();
  const require = (criterion.require as string[] | undefined) ?? [];
  const requireAny = (criterion.requireAny as string[] | undefined) ?? [];
  const minSize = (criterion.minSize as number | undefined) ?? 0;
  const requireExecutable = (criterion.requireExecutable as string[] | undefined) ?? [];

  const issues: string[] = [];

  // Check required files/dirs
  for (const file of require) {
    const full = join(context.projectPath, file);
    if (!existsSync(full)) {
      issues.push(`missing: ${file}`);
    } else if (minSize > 0 && statSync(full).isFile() && statSync(full).size < minSize) {
      issues.push(`${file} too small (need ≥${minSize} bytes)`);
    }
  }

  // Check requireAny
  if (requireAny.length > 0) {
    const anyFound = requireAny.some((f) => existsSync(join(context.projectPath, f)));
    if (!anyFound) {
      issues.push(`none found: ${requireAny.join(" | ")}`);
    }
  }

  // Check executable permissions
  for (const file of requireExecutable) {
    const full = join(context.projectPath, file);
    if (existsSync(full)) {
      try {
        const mode = statSync(full).mode;
        const isExecutable = (mode & 0o111) !== 0;
        if (!isExecutable) {
          issues.push(`${file} is not executable`);
        }
      } catch {
        issues.push(`${file} cannot be stat'd`);
      }
    }
    // Don't flag missing files here — that's handled by require/requireAny
  }

  const passed = issues.length === 0;
  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: passed ? criterion.points : 0,
    status: passed ? "pass" : "fail",
    evidence: passed
      ? "Skill package structure valid"
      : `Structure issues: ${issues.join("; ")}`,
    suggestedFix: passed ? undefined : `Fix: ${issues.join("; ")}`,
    durationMs: Date.now() - start,
  };
}
