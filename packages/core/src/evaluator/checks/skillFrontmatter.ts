import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parse as parseYaml } from "yaml";

import type { EvaluationContext } from "../context.js";
import type { CriterionResult, RubricCriterion } from "../types.js";

export interface ParsedFrontmatter {
  name?: string;
  description?: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Extract and parse YAML frontmatter from a SKILL.md file.
 * Returns null if the file doesn't exist or has no frontmatter.
 */
export function parseSkillFrontmatter(skillMdPath: string): ParsedFrontmatter | null {
  if (!existsSync(skillMdPath)) return null;

  const content = readFileSync(skillMdPath, "utf8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) return null;

  try {
    const parsed = parseYaml(match[1]) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    return parsed as ParsedFrontmatter;
  } catch {
    return null;
  }
}

/**
 * Extract the markdown body (everything after frontmatter) from a SKILL.md file.
 */
export function extractSkillBody(skillMdPath: string): string {
  if (!existsSync(skillMdPath)) return "";

  const content = readFileSync(skillMdPath, "utf8");
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  return match?.[1]?.trim() ?? content;
}

/**
 * Check SKILL.md frontmatter for required and optional fields.
 *
 * Criterion fields:
 * - require: string[] — frontmatter fields that must exist (dot-path for nested, e.g. "metadata.tier")
 * - requireValues: Record<string, string[]> — field must be one of the allowed values
 * - checkNameMatch: boolean — verify name matches parent directory
 */
export function checkSkillFrontmatter(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): CriterionResult {
  const start = Date.now();
  const skillMdPath = join(context.projectPath, "SKILL.md");
  const frontmatter = parseSkillFrontmatter(skillMdPath);

  if (!frontmatter) {
    return {
      id: criterion.id,
      tierId,
      name: criterion.name,
      method: criterion.method,
      pointsPossible: criterion.points,
      pointsAwarded: 0,
      status: "fail",
      evidence: "SKILL.md missing or has no valid YAML frontmatter",
      suggestedFix: "Add YAML frontmatter with --- delimiters to SKILL.md",
      durationMs: Date.now() - start,
    };
  }

  const require = (criterion.require as string[] | undefined) ?? [];
  const requireValues = (criterion.requireValues as Record<string, string[]> | undefined) ?? {};
  const checkNameMatch = (criterion.checkNameMatch as boolean | undefined) ?? false;

  const issues: string[] = [];

  // Check required fields (supports dot-path for nested fields like metadata.tier)
  for (const field of require) {
    const value = resolveDotPath(frontmatter, field);
    if (value === undefined || value === null || value === "") {
      issues.push(`missing: ${field}`);
    }
  }

  // Check value constraints
  for (const [field, allowed] of Object.entries(requireValues)) {
    const value = resolveDotPath(frontmatter, field);
    if (value !== undefined && value !== null) {
      const strValue = String(value);
      if (!allowed.includes(strValue)) {
        issues.push(`${field} = "${strValue}" (expected one of: ${allowed.join(", ")})`);
      }
    }
  }

  // Check name matches directory
  if (checkNameMatch && frontmatter.name) {
    const dirName = basename(context.projectPath);
    if (frontmatter.name !== dirName) {
      issues.push(`name "${frontmatter.name}" does not match directory "${dirName}"`);
    }
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
      ? `Frontmatter valid: ${require.join(", ")} present`
      : `Frontmatter issues: ${issues.join("; ")}`,
    suggestedFix: passed ? undefined : `Fix frontmatter: ${issues.join("; ")}`,
    durationMs: Date.now() - start,
  };
}

function resolveDotPath(obj: unknown, path: string): unknown {
  let current = obj;
  for (const key of path.split(".")) {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}
