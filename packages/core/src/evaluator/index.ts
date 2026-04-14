import { createEvaluationContext } from "./context.js";
import { evaluateCriterion } from "./checks/dispatch.js";
import { loadRubricFromFile } from "./rubric.js";
import type { CriterionResult, EvaluateProjectInput, EvaluationResult, TierResult } from "./types.js";

export async function evaluateProject(input: EvaluateProjectInput): Promise<EvaluationResult> {
  const rubric = loadRubricFromFile(input.rubricPath);
  const context = createEvaluationContext(input.projectPath);
  const criteria: CriterionResult[] = [];

  for (const tier of rubric.tiers) {
    for (const criterion of tier.criteria) {
      criteria.push(await evaluateCriterion(criterion, tier.id, context));
    }
  }

  const tiers: TierResult[] = rubric.tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    score: criteria
      .filter((criterion) => criterion.tierId === tier.id)
      .reduce((sum, criterion) => sum + criterion.pointsAwarded, 0),
    possiblePoints: tier.points,
  }));

  const totalScore = criteria.reduce((sum, criterion) => sum + criterion.pointsAwarded, 0);

  return {
    rubric,
    projectPath: context.projectPath,
    totalScore,
    rubricTotalPoints: rubric.totalPoints,
    implementedTotalPoints: rubric.implementedPoints,
    criteria,
    tiers,
  };
}
