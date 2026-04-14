// ── Public API ───────────────────────────────────────────────────────────

// Evaluator engine
export { evaluateProject } from "./evaluator/index.js";

// Rubric loading & validation
export { loadRubricFromFile, validateRubric, tierMetricName } from "./evaluator/rubric.js";

// Evaluation context
export { createEvaluationContext } from "./evaluator/context.js";
export type { EvaluationContext } from "./evaluator/context.js";

// Metrics formatting
export { formatMetrics } from "./evaluator/metrics.js";

// Reporters
export { renderScorecard } from "./evaluator/reporters/markdown.js";
export { writeJsonReport } from "./evaluator/reporters/json.js";
export type { JsonReportOptions } from "./evaluator/reporters/json.js";

// Types
export type {
  CriterionResult,
  CriterionStatus,
  CriterionType,
  EvaluateProjectInput,
  EvaluationResult,
  LoadedRubric,
  MetricsInput,
  RubricCriterion,
  RubricDefinition,
  RubricGradingBand,
  RubricTier,
  SupportedMethod,
  TierResult,
} from "./evaluator/types.js";

export { SUPPORTED_METHODS } from "./evaluator/types.js";

// Skill analysis utilities
export { parseSkillFrontmatter, extractSkillBody } from "./evaluator/checks/skillFrontmatter.js";
export type { ParsedFrontmatter } from "./evaluator/checks/skillFrontmatter.js";

// Linter
export { lintSkillPackage, formatLintResult } from "./linter/index.js";
export type { LintFinding, LintResult, LintSeverity } from "./linter/types.js";
