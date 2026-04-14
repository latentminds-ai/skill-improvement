export const SUPPORTED_METHODS = [
  "files",
  "fileContains",
  "glob",
  "grepPresent",
  "grepAbsent",
  "jsonPath",
  "exec",
  "http",
  "httpTiming",
  "conditional",
  "llm-judge",
  "skillFrontmatter",
  "skillDescriptionQuality",
  "skillStructure",
  "skillContent",
] as const;

export type SupportedMethod = (typeof SUPPORTED_METHODS)[number];

export type CriterionType = "deterministic" | "llm-judge" | "conditional";

export interface RubricCriterion {
  id: string;
  name: string;
  type: CriterionType;
  method: string;
  points: number;
  [key: string]: unknown;
}

export interface RubricTier {
  id: number;
  name: string;
  points: number;
  criteria: RubricCriterion[];
}

export interface RubricGradingBand {
  min: number;
  max: number;
  label: string;
}

export interface RubricDefinition {
  name: string;
  version?: string;
  totalPoints?: number;
  tiers: RubricTier[];
  grading?: Record<string, RubricGradingBand>;
}

export interface LoadedRubric extends RubricDefinition {
  totalPoints: number;
  implementedPoints: number;
}

export interface MetricsInput {
  rubric: LoadedRubric;
  totalScore: number;
  rubricTotalPoints: number;
  implementedTotalPoints: number;
  tierScores: Map<number, number>;
}

export type CriterionStatus = "pass" | "fail" | "unsupported" | "skipped" | "error";

export interface CriterionResult {
  id: string;
  tierId: number;
  name: string;
  method: string;
  pointsPossible: number;
  pointsAwarded: number;
  status: CriterionStatus;
  evidence: string;
  suggestedFix?: string;
  durationMs: number;
}

export interface TierResult {
  id: number;
  name: string;
  score: number;
  possiblePoints: number;
}

export interface EvaluationResult {
  rubric: LoadedRubric;
  projectPath: string;
  totalScore: number;
  rubricTotalPoints: number;
  implementedTotalPoints: number;
  criteria: CriterionResult[];
  tiers: TierResult[];
}

export interface EvaluateProjectInput {
  projectPath: string;
  rubricPath: string;
}
