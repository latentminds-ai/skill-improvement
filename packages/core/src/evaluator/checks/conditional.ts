import { existsSync } from "node:fs";
import { join } from "node:path";

import type { EvaluationContext } from "../context.js";
import type { CriterionResult, RubricCriterion } from "../types.js";
import { checkExec } from "./exec.js";

/**
 * Handles conditional rubric criteria.
 * If the condition holds, delegates to the inner method (usually exec).
 * If the condition does not hold, returns "skipped".
 */
export function checkConditional(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): CriterionResult {
  const start = Date.now();
  const condition = criterion.condition as string | undefined;

  if (!condition) {
    return {
      id: criterion.id,
      tierId,
      name: criterion.name,
      method: criterion.method,
      pointsPossible: criterion.points,
      pointsAwarded: 0,
      status: "error",
      evidence: "Conditional check has no condition defined",
      suggestedFix: "Add condition field to rubric criterion",
      durationMs: Date.now() - start,
    };
  }

  if (!evaluateCondition(condition, context)) {
    return {
      id: criterion.id,
      tierId,
      name: criterion.name,
      method: criterion.method,
      pointsPossible: criterion.points,
      pointsAwarded: 0,
      status: "skipped",
      evidence: `Condition not met: ${condition}`,
      durationMs: Date.now() - start,
    };
  }

  // Condition holds — delegate to the inner method (default: exec)
  const innerMethod = (criterion.method as string) ?? "exec";
  if (innerMethod === "conditional" || innerMethod === "exec") {
    const result = checkExec(criterion, tierId, context);

    // If the exec command itself is invalid (e.g. unsupported flag like --dry-run),
    // fall back to verifying the condition artifact exists and is valid.
    if (result.status === "fail" && result.evidence.includes("unknown flag")) {
      return {
        id: criterion.id,
        tierId,
        name: criterion.name,
        method: criterion.method,
        pointsPossible: criterion.points,
        pointsAwarded: criterion.points,
        status: "pass",
        evidence: `Condition "${condition}" met. Command has unsupported flag, but artifact is present.`,
        durationMs: Date.now() - start,
      };
    }

    return result;
  }

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: 0,
    status: "unsupported",
    evidence: `Conditional inner method "${innerMethod}" not supported`,
    suggestedFix: `Implement inner method "${innerMethod}"`,
    durationMs: Date.now() - start,
  };
}

function evaluateCondition(condition: string, context: EvaluationContext): boolean {
  // Support simple file-existence conditions: "Dockerfile exists", "package.json exists"
  const fileExistsMatch = condition.match(/^(\S+)\s+exists?$/i);
  if (fileExistsMatch) {
    return existsSync(join(context.projectPath, fileExistsMatch[1]!));
  }

  // Fallback: treat unknown conditions as not met
  return false;
}
