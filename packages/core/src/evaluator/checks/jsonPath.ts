import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { EvaluationContext } from "../context.js";
import type { CriterionResult, RubricCriterion } from "../types.js";

export function checkJsonPath(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): CriterionResult {
  const start = Date.now();
  const file = criterion.file as string;
  const dotPath = criterion.path as string | undefined;
  const pathContains = criterion.pathContains as string | undefined;
  const expect = criterion.expect;
  const expectExists = criterion.expectExists as boolean | undefined;
  const matchPattern = criterion.matchPattern as string | undefined;
  const fullPath = join(context.projectPath, file);

  if (!existsSync(fullPath)) {
    return fail(criterion, tierId, start, `File not found: ${file}`, `Create ${file}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(fullPath, "utf8"));
  } catch {
    return fail(criterion, tierId, start, `Invalid JSON: ${file}`, `Fix JSON syntax in ${file}`);
  }

  // pathContains: check if stringified JSON contains the substring
  if (pathContains !== undefined) {
    const json = JSON.stringify(parsed);
    if (json.includes(pathContains)) {
      return pass(criterion, tierId, start, `${file} contains "${pathContains}"`);
    }
    return fail(
      criterion,
      tierId,
      start,
      `${file} does not contain "${pathContains}"`,
      `Add "${pathContains}" to ${file}`
    );
  }

  // dotPath: resolve a.b.c style path
  if (dotPath !== undefined) {
    const value = resolveDotPath(parsed, dotPath);

    if (expectExists) {
      if (value !== undefined) {
        return pass(criterion, tierId, start, `${file}: ${dotPath} exists`);
      }
      return fail(
        criterion,
        tierId,
        start,
        `${file}: ${dotPath} not found`,
        `Add ${dotPath} to ${file}`
      );
    }

    if (matchPattern !== undefined) {
      const str = String(value ?? "");
      if (new RegExp(matchPattern).test(str)) {
        return pass(criterion, tierId, start, `${file}: ${dotPath} = "${str}" matches /${matchPattern}/`);
      }
      return fail(
        criterion,
        tierId,
        start,
        `${file}: ${dotPath} = "${str}" does not match /${matchPattern}/`,
        `Set ${dotPath} to match /${matchPattern}/ in ${file}`
      );
    }

    if (expect !== undefined) {
      if (value === expect) {
        return pass(criterion, tierId, start, `${file}: ${dotPath} = ${JSON.stringify(value)}`);
      }
      return fail(
        criterion,
        tierId,
        start,
        `${file}: ${dotPath} = ${JSON.stringify(value)}, expected ${JSON.stringify(expect)}`,
        `Set ${dotPath} to ${JSON.stringify(expect)} in ${file}`
      );
    }

    // No assertion specified — just check existence
    if (value !== undefined) {
      return pass(criterion, tierId, start, `${file}: ${dotPath} = ${JSON.stringify(value)}`);
    }
    return fail(
      criterion,
      tierId,
      start,
      `${file}: ${dotPath} not found`,
      `Add ${dotPath} to ${file}`
    );
  }

  return fail(criterion, tierId, start, "jsonPath check: no path or pathContains specified", "Fix rubric criterion");
}

function resolveDotPath(obj: unknown, path: string): unknown {
  let current = obj;
  for (const key of path.split(".")) {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function pass(
  criterion: RubricCriterion,
  tierId: number,
  start: number,
  evidence: string
): CriterionResult {
  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: criterion.points,
    status: "pass",
    evidence,
    durationMs: Date.now() - start,
  };
}

function fail(
  criterion: RubricCriterion,
  tierId: number,
  start: number,
  evidence: string,
  suggestedFix: string
): CriterionResult {
  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: 0,
    status: "fail",
    evidence,
    suggestedFix,
    durationMs: Date.now() - start,
  };
}
