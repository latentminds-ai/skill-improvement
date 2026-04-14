import type { EvaluationContext } from "../context.js";
import type { CriterionResult, RubricCriterion } from "../types.js";

import { checkConditional } from "./conditional.js";
import { checkExec } from "./exec.js";
import { checkFiles } from "./files.js";
import { checkFileContains } from "./fileContains.js";
import { checkGlob } from "./glob.js";
import { checkGrepPresent, checkGrepAbsent } from "./grep.js";
import { checkHeuristic } from "./heuristic.js";
import { checkHttp, checkHttpTiming } from "./http.js";
import { checkJsonPath } from "./jsonPath.js";
import { checkSkillFrontmatter } from "./skillFrontmatter.js";
import { checkSkillDescriptionQuality } from "./skillDescriptionQuality.js";
import { checkSkillStructure } from "./skillStructure.js";
import { checkSkillContent } from "./skillContent.js";

type CheckFn = (
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
) => CriterionResult | Promise<CriterionResult>;

const METHOD_MAP: Record<string, CheckFn> = {
  files: checkFiles,
  fileContains: checkFileContains,
  glob: checkGlob,
  grepPresent: checkGrepPresent,
  grepAbsent: checkGrepAbsent,
  jsonPath: checkJsonPath,
  exec: checkExec,
  conditional: checkConditional,
  http: checkHttp,
  httpTiming: checkHttpTiming,
  skillFrontmatter: checkSkillFrontmatter,
  skillDescriptionQuality: checkSkillDescriptionQuality,
  skillStructure: checkSkillStructure,
  skillContent: checkSkillContent,
};

export async function evaluateCriterion(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): Promise<CriterionResult> {
  // For llm-judge criteria, try heuristic checks first
  if (criterion.type === "llm-judge" || criterion.method === "llm-judge") {
    const heuristicResult = checkHeuristic(criterion, tierId, context);
    if (heuristicResult) return heuristicResult;
  }

  // Conditional type: route through conditional handler regardless of inner method
  if (criterion.type === "conditional") {
    return checkConditional(criterion, tierId, context);
  }

  const handler = METHOD_MAP[criterion.method];

  if (!handler) {
    return {
      id: criterion.id,
      tierId,
      name: criterion.name,
      method: criterion.method,
      pointsPossible: criterion.points,
      pointsAwarded: 0,
      status: "unsupported",
      evidence: `Method "${criterion.method}" is not implemented yet`,
      suggestedFix: `Implement support for method "${criterion.method}"`,
      durationMs: 0,
    };
  }

  try {
    return await handler(criterion, tierId, context);
  } catch (err) {
    return {
      id: criterion.id,
      tierId,
      name: criterion.name,
      method: criterion.method,
      pointsPossible: criterion.points,
      pointsAwarded: 0,
      status: "error",
      evidence: `Check crashed: ${err instanceof Error ? err.message : String(err)}`,
      suggestedFix: "Fix check implementation or project structure",
      durationMs: 0,
    };
  }
}
