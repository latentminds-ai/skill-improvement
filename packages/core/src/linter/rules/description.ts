import { join } from "node:path";

import { parseSkillFrontmatter } from "../../evaluator/checks/skillFrontmatter.js";
import type { LintFinding } from "../types.js";

/**
 * Catch description formatting hazards and routing-quality issues.
 */
export function checkDescription(skillPath: string): LintFinding[] {
  const findings: LintFinding[] = [];
  const fm = parseSkillFrontmatter(join(skillPath, "SKILL.md"));

  if (!fm?.description) return []; // frontmatter rule handles this

  const desc = fm.description;

  // Too short for reliable routing
  if (desc.length < 30) {
    findings.push({
      rule: "description/too-short",
      severity: "warning",
      message: `Description is only ${desc.length} chars — too short for reliable agent routing`,
      fix: "Expand description to at least 30 characters with specific trigger information",
    });
  }

  // No trigger keywords
  const hasTrigger = /\buse when\b|\buse for\b|\buse if\b|\btriggers? when\b|\bapplies when\b/i.test(desc);
  if (!hasTrigger) {
    findings.push({
      rule: "description/trigger-keywords",
      severity: "warning",
      message: "Description lacks trigger keywords (e.g., 'Use when...')",
      fix: "Add 'Use when...' or similar phrase so agents know when to load this skill",
    });
  }

  // Starts with vague language
  const vagueStart = /^(helps? with|does stuff|a? ?useful|general purpose|handles? various)/i.test(desc.trim());
  if (vagueStart) {
    findings.push({
      rule: "description/vague-start",
      severity: "warning",
      message: "Description starts with vague language that won't trigger reliably",
      fix: "Lead with what the skill does, not a generic qualifier",
    });
  }

  return findings;
}
