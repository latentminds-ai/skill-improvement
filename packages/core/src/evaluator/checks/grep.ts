import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import type { EvaluationContext } from "../context.js";
import type { CriterionResult, RubricCriterion } from "../types.js";

export function checkGrepPresent(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): CriterionResult {
  return grepCheck(criterion, tierId, context, true);
}

export function checkGrepAbsent(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): CriterionResult {
  return grepCheck(criterion, tierId, context, false);
}

function grepCheck(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext,
  expectPresent: boolean
): CriterionResult {
  const start = Date.now();
  const pattern = criterion.pattern as string;
  const paths = (criterion.paths as string[]) ?? [];
  const regex = new RegExp(pattern);

  let found = false;
  let matchFile = "";

  for (const searchPath of paths) {
    const full = join(context.projectPath, searchPath);
    if (!existsSync(full)) continue;

    const files = collectFiles(full);
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      if (regex.test(content)) {
        found = true;
        matchFile = file.replace(context.projectPath + "/", "");
        break;
      }
    }
    if (found) break;
  }

  const passed = expectPresent ? found : !found;

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: passed ? criterion.points : 0,
    status: passed ? "pass" : "fail",
    evidence: expectPresent
      ? found
        ? `Pattern found in ${matchFile}`
        : `Pattern /${pattern}/ not found in ${paths.join(", ")}`
      : found
        ? `Unwanted pattern found in ${matchFile}`
        : `Pattern /${pattern}/ absent from ${paths.join(", ")}`,
    suggestedFix: passed
      ? undefined
      : expectPresent
        ? `Add code matching /${pattern}/ in ${paths.join(", ")}`
        : `Remove code matching /${pattern}/ from ${matchFile}`,
    durationMs: Date.now() - start,
  };
}

function collectFiles(dirOrFile: string): string[] {
  if (!existsSync(dirOrFile)) return [];
  const stat = statSync(dirOrFile);
  if (stat.isFile()) return [dirOrFile];
  if (!stat.isDirectory()) return [];

  const result: string[] = [];
  for (const entry of readdirSync(dirOrFile, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = join(dirOrFile, entry.name);
    if (entry.isFile()) result.push(full);
    else if (entry.isDirectory()) result.push(...collectFiles(full));
  }
  return result;
}
