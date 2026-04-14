import { existsSync } from "node:fs";
import { join } from "node:path";

import type { LintFinding } from "../types.js";

/**
 * Validate skill package file/directory structure.
 * Per skill-package-schema.md: SKILL.md and README.md are required (error if missing).
 */
export function checkStructure(skillPath: string): LintFinding[] {
  const findings: LintFinding[] = [];

  if (!existsSync(join(skillPath, "SKILL.md"))) {
    findings.push({
      rule: "structure/skill-md-required",
      severity: "error",
      message: "SKILL.md is missing",
      fix: "Create a SKILL.md file with YAML frontmatter and instructions",
    });
  }

  if (!existsSync(join(skillPath, "README.md"))) {
    findings.push({
      rule: "structure/readme-required",
      severity: "error",
      message: "README.md is missing",
      fix: "Create a README.md with human-facing documentation",
    });
  }

  return findings;
}
