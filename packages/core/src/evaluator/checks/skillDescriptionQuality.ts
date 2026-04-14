import { join } from "node:path";

import type { EvaluationContext } from "../context.js";
import type { CriterionResult, RubricCriterion } from "../types.js";
import { parseSkillFrontmatter } from "./skillFrontmatter.js";

/**
 * Evaluate the quality of a skill's description for agent routing.
 *
 * Criterion fields:
 * - check: string — which quality dimension to evaluate:
 *   - "length" — description is within bounds (minLength, maxLength)
 *   - "triggerKeywords" — includes "Use when...", "Use for...", or similar
 *   - "specificity" — avoids vague language, includes concrete terms
 *   - "noVague" — no vague-only descriptions ("Helps with...", "Does stuff")
 */
export function checkSkillDescriptionQuality(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): CriterionResult {
  const start = Date.now();
  const skillMdPath = join(context.projectPath, "SKILL.md");
  const frontmatter = parseSkillFrontmatter(skillMdPath);

  if (!frontmatter?.description) {
    return {
      id: criterion.id,
      tierId,
      name: criterion.name,
      method: criterion.method,
      pointsPossible: criterion.points,
      pointsAwarded: 0,
      status: "fail",
      evidence: "No description found in SKILL.md frontmatter",
      suggestedFix: "Add a description field to SKILL.md frontmatter",
      durationMs: Date.now() - start,
    };
  }

  const description = frontmatter.description;
  const check = criterion.check as string;

  switch (check) {
    case "length":
      return checkLength(criterion, tierId, description, start);
    case "triggerKeywords":
      return checkTriggerKeywords(criterion, tierId, description, start);
    case "specificity":
      return checkSpecificity(criterion, tierId, description, start);
    case "noVague":
      return checkNoVague(criterion, tierId, description, start);
    default:
      return {
        id: criterion.id,
        tierId,
        name: criterion.name,
        method: criterion.method,
        pointsPossible: criterion.points,
        pointsAwarded: 0,
        status: "unsupported",
        evidence: `Unknown description quality check: "${check}"`,
        suggestedFix: `Use one of: length, triggerKeywords, specificity, noVague`,
        durationMs: Date.now() - start,
      };
  }
}

function checkLength(
  criterion: RubricCriterion,
  tierId: number,
  description: string,
  start: number
): CriterionResult {
  const minLength = (criterion.minLength as number | undefined) ?? 20;
  const maxLength = (criterion.maxLength as number | undefined) ?? 1024;
  const len = description.length;
  const passed = len >= minLength && len <= maxLength;

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: passed ? criterion.points : 0,
    status: passed ? "pass" : "fail",
    evidence: `Description length: ${len} chars (range: ${minLength}-${maxLength})`,
    suggestedFix: passed
      ? undefined
      : len < minLength
        ? `Expand description to at least ${minLength} characters — be specific about when to use this skill`
        : `Shorten description to at most ${maxLength} characters`,
    durationMs: Date.now() - start,
  };
}

function checkTriggerKeywords(
  criterion: RubricCriterion,
  tierId: number,
  description: string,
  start: number
): CriterionResult {
  const triggerPatterns = [
    /\buse when\b/i,
    /\buse for\b/i,
    /\buse if\b/i,
    /\btrigger[s]? when\b/i,
    /\bapplies when\b/i,
    /\bactivate when\b/i,
    /\binvoke when\b/i,
  ];

  const found = triggerPatterns.some((p) => p.test(description));

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: found ? criterion.points : 0,
    status: found ? "pass" : "fail",
    evidence: found
      ? "Description includes trigger keywords for agent routing"
      : "Description lacks trigger keywords (e.g., 'Use when...', 'Use for...')",
    suggestedFix: found
      ? undefined
      : "Add 'Use when...' or similar trigger phrase so agents know when to load this skill",
    durationMs: Date.now() - start,
  };
}

function checkSpecificity(
  criterion: RubricCriterion,
  tierId: number,
  description: string,
  start: number
): CriterionResult {
  // Look for concrete, specific terms rather than generic language.
  // Specificity signals: technical terms, tool names, file types, action verbs
  const specificPatterns = [
    /\b(file|directory|config|test|build|deploy|lint|format|debug|review)\b/i,
    /\b(\.md|\.json|\.ts|\.js|\.yaml|\.yml|\.py)\b/i,
    /\b(create|extract|validate|generate|analyze|evaluate|parse|compile)\b/i,
    /\b(API|CLI|UI|PR|CI|CD|git|npm|docker)\b/i,
  ];

  const matches = specificPatterns.filter((p) => p.test(description)).length;
  const passed = matches >= 2;

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: passed ? criterion.points : 0,
    status: passed ? "pass" : "fail",
    evidence: passed
      ? `Description has ${matches} specificity signals (concrete terms, action verbs)`
      : `Description has only ${matches} specificity signal(s) — too generic for reliable routing`,
    suggestedFix: passed
      ? undefined
      : "Add concrete terms: what files/tools does this skill work with? What actions does it perform?",
    durationMs: Date.now() - start,
  };
}

function checkNoVague(
  criterion: RubricCriterion,
  tierId: number,
  description: string,
  start: number
): CriterionResult {
  const vaguePatterns = [
    /^helps with\b/i,
    /^does stuff/i,
    /^a? ?useful tool/i,
    /^general purpose/i,
    /^handles? various/i,
  ];

  const vagueFound = vaguePatterns.some((p) => p.test(description.trim()));

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: vagueFound ? 0 : criterion.points,
    status: vagueFound ? "fail" : "pass",
    evidence: vagueFound
      ? "Description starts with vague language that won't trigger reliably"
      : "Description avoids vague lead-in language",
    suggestedFix: vagueFound
      ? "Rewrite to be specific: what does this skill do, and when should an agent use it?"
      : undefined,
    durationMs: Date.now() - start,
  };
}
