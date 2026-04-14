import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  type LoadedRubric,
  type RubricCriterion,
  type RubricDefinition,
  type RubricTier,
  SUPPORTED_METHODS,
} from "./types.js";

const SUPPORTED_METHOD_SET = new Set<string>(SUPPORTED_METHODS);

export function loadRubricFromFile(path: string): LoadedRubric {
  const fullPath = resolve(path);
  const parsed = JSON.parse(readFileSync(fullPath, "utf8")) as unknown;
  return validateRubric(parsed);
}

export function validateRubric(input: unknown): LoadedRubric {
  if (!isRecord(input)) {
    throw new Error("Invalid rubric: top-level value must be an object");
  }

  const name = input.name;
  const version = input.version;
  const tiers = input.tiers;
  const grading = input.grading;

  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("Invalid rubric: name is required");
  }

  if (version !== undefined && typeof version !== "string") {
    throw new Error("Invalid rubric: version must be a string when present");
  }

  if (!Array.isArray(tiers) || tiers.length === 0) {
    throw new Error("Invalid rubric: tiers must be a non-empty array");
  }

  const normalizedTiers = tiers.map(validateTier);
  const tierIds = new Set<number>();
  const criterionIds = new Set<string>();

  for (const tier of normalizedTiers) {
    if (tierIds.has(tier.id)) {
      throw new Error(`Invalid rubric: duplicate tier id ${tier.id}`);
    }
    tierIds.add(tier.id);

    for (const criterion of tier.criteria) {
      if (criterionIds.has(criterion.id)) {
        throw new Error(`Invalid rubric: duplicate criterion id ${criterion.id}`);
      }
      criterionIds.add(criterion.id);
    }
  }

  if (grading !== undefined) {
    validateGrading(grading);
  }

  const totalPoints = normalizedTiers.reduce((sum, tier) => sum + tier.points, 0);
  const implementedPoints = normalizedTiers.reduce(
    (sum, tier) =>
      sum +
      tier.criteria.reduce(
        (criterionSum, criterion) =>
          criterionSum + (SUPPORTED_METHOD_SET.has(criterion.method) ? criterion.points : 0),
        0
      ),
    0
  );

  return {
    name,
    version,
    grading: grading as LoadedRubric["grading"],
    tiers: normalizedTiers,
    totalPoints,
    implementedPoints,
  };
}

export function tierMetricName(tier: Pick<RubricTier, "id" | "name">): string {
  return `tier${tier.id}_${slugify(tier.name)}`;
}

function validateTier(input: unknown): RubricTier {
  if (!isRecord(input)) {
    throw new Error("Invalid rubric: tier must be an object");
  }

  if (typeof input.id !== "number" || Number.isNaN(input.id)) {
    throw new Error("Invalid rubric: tier id must be a number");
  }

  if (typeof input.name !== "string" || input.name.trim() === "") {
    throw new Error("Invalid rubric: tier name is required");
  }

  if (typeof input.points !== "number" || input.points < 0) {
    throw new Error(`Invalid rubric: tier ${input.name} must define non-negative points`);
  }

  if (!Array.isArray(input.criteria)) {
    throw new Error(`Invalid rubric: tier ${input.name} must define criteria[]`);
  }

  const criteria = input.criteria.map(validateCriterion);
  const criteriaPoints = criteria.reduce((sum, criterion) => sum + criterion.points, 0);

  if (criteriaPoints !== input.points) {
    throw new Error(
      `Invalid rubric: tier ${input.name} points (${input.points}) must equal criteria sum (${criteriaPoints})`
    );
  }

  return {
    id: input.id,
    name: input.name,
    points: input.points,
    criteria,
  };
}

function validateCriterion(input: unknown): RubricCriterion {
  if (!isRecord(input)) {
    throw new Error("Invalid rubric: criterion must be an object");
  }

  if (typeof input.id !== "string" || input.id.trim() === "") {
    throw new Error("Invalid rubric: criterion id is required");
  }

  if (typeof input.name !== "string" || input.name.trim() === "") {
    throw new Error(`Invalid rubric: criterion ${input.id} name is required`);
  }

  if (
    input.type !== "deterministic" &&
    input.type !== "llm-judge" &&
    input.type !== "conditional"
  ) {
    throw new Error(`Invalid rubric: criterion ${input.id} has unsupported type`);
  }

  // llm-judge criteria use prompt instead of method
  if (input.type === "llm-judge") {
    if (typeof input.method !== "string" || input.method.trim() === "") {
      // Normalize: set method to "llm-judge" so dispatcher can route it
      (input as Record<string, unknown>).method = "llm-judge";
    }
  } else if (typeof input.method !== "string" || input.method.trim() === "") {
    throw new Error(`Invalid rubric: criterion ${input.id} method is required`);
  }

  if (typeof input.points !== "number" || input.points < 0) {
    throw new Error(`Invalid rubric: criterion ${input.id} must define non-negative points`);
  }

  return input as RubricCriterion;
}

function validateGrading(input: unknown): void {
  if (!isRecord(input)) {
    throw new Error("Invalid rubric: grading must be an object");
  }

  for (const [grade, value] of Object.entries(input)) {
    if (!isRecord(value)) {
      throw new Error(`Invalid rubric: grading band ${grade} must be an object`);
    }

    if (typeof value.min !== "number" || typeof value.max !== "number") {
      throw new Error(`Invalid rubric: grading band ${grade} must define numeric min/max`);
    }

    if (typeof value.label !== "string" || value.label.trim() === "") {
      throw new Error(`Invalid rubric: grading band ${grade} must define a label`);
    }
  }
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
