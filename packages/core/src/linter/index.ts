import { basename } from "node:path";

import { parseSkillFrontmatter } from "../evaluator/checks/skillFrontmatter.js";
import { checkStructure } from "./rules/structure.js";
import { checkFrontmatter } from "./rules/frontmatter.js";
import { checkGovernance } from "./rules/governance.js";
import { checkDescription } from "./rules/description.js";
import { checkVariants } from "./rules/variants.js";
import type { LintFinding, LintResult } from "./types.js";

/**
 * Lint a skill package directory against the skill-package-schema,
 * cross-platform-skill-packaging, and skill-governance-policy specs.
 *
 * Returns all findings with severity. A skill "passes" if it has zero errors.
 */
export function lintSkillPackage(skillPath: string): LintResult {
  const findings: LintFinding[] = [];

  // Run all rule sets
  findings.push(...checkStructure(skillPath));
  findings.push(...checkFrontmatter(skillPath));
  findings.push(...checkGovernance(skillPath));
  findings.push(...checkDescription(skillPath));
  findings.push(...checkVariants(skillPath));

  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  const infos = findings.filter((f) => f.severity === "info").length;

  // Try to get skill name
  const fm = parseSkillFrontmatter(`${skillPath}/SKILL.md`);
  const skillName = fm?.name ?? basename(skillPath);

  return {
    skillPath,
    skillName,
    findings,
    errors,
    warnings,
    infos,
    passed: errors === 0,
  };
}

/**
 * Format lint results as human-readable text for CLI output.
 */
export function formatLintResult(result: LintResult): string {
  const lines: string[] = [];

  const icon = result.passed ? "✅" : "❌";
  lines.push(`${icon} ${result.skillName} (${result.skillPath})`);
  lines.push("");

  if (result.findings.length === 0) {
    lines.push("  No issues found.");
    return lines.join("\n");
  }

  const severityIcon = { error: "❌", warning: "⚠️", info: "ℹ️" };

  for (const finding of result.findings) {
    lines.push(`  ${severityIcon[finding.severity]} [${finding.rule}] ${finding.message}`);
    if (finding.fix) {
      lines.push(`     Fix: ${finding.fix}`);
    }
  }

  lines.push("");
  const parts: string[] = [];
  if (result.errors > 0) parts.push(`${result.errors} error(s)`);
  if (result.warnings > 0) parts.push(`${result.warnings} warning(s)`);
  if (result.infos > 0) parts.push(`${result.infos} info(s)`);
  lines.push(`  Summary: ${parts.join(", ")}`);

  return lines.join("\n");
}
