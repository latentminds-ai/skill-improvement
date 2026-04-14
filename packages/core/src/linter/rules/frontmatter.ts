import { basename, join } from "node:path";

import { parseSkillFrontmatter } from "../../evaluator/checks/skillFrontmatter.js";
import type { LintFinding } from "../types.js";

const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1024;

/**
 * Validate SKILL.md frontmatter against the Agent Skills standard.
 */
export function checkFrontmatter(skillPath: string): LintFinding[] {
  const findings: LintFinding[] = [];
  const skillMdPath = join(skillPath, "SKILL.md");
  const fm = parseSkillFrontmatter(skillMdPath);

  if (!fm) {
    findings.push({
      rule: "frontmatter/valid-yaml",
      severity: "error",
      message: "SKILL.md has no valid YAML frontmatter",
      fix: "Add YAML frontmatter between --- delimiters",
    });
    return findings; // Can't check further
  }

  // name: required
  if (!fm.name || typeof fm.name !== "string") {
    findings.push({
      rule: "frontmatter/name-required",
      severity: "error",
      message: "Frontmatter missing required field: name",
      fix: "Add name: my-skill-name to frontmatter",
    });
  } else {
    if (fm.name.length > MAX_NAME_LENGTH) {
      findings.push({
        rule: "frontmatter/name-length",
        severity: "warning",
        message: `Name "${fm.name}" exceeds ${MAX_NAME_LENGTH} characters`,
        fix: `Shorten name to ${MAX_NAME_LENGTH} characters or fewer`,
      });
    }

    if (!NAME_PATTERN.test(fm.name)) {
      findings.push({
        rule: "frontmatter/name-format",
        severity: "warning",
        message: `Name "${fm.name}" does not match required pattern (lowercase, hyphens, no leading/trailing/consecutive hyphens)`,
        fix: "Use lowercase letters, numbers, and single hyphens only",
      });
    }

    const dirName = basename(skillPath);
    if (fm.name !== dirName) {
      findings.push({
        rule: "frontmatter/name-matches-dir",
        severity: "warning",
        message: `Name "${fm.name}" does not match directory "${dirName}"`,
        fix: `Rename directory to "${fm.name}" or update name in frontmatter`,
      });
    }
  }

  // description: required
  if (!fm.description || typeof fm.description !== "string") {
    findings.push({
      rule: "frontmatter/description-required",
      severity: "error",
      message: "Frontmatter missing required field: description",
      fix: "Add a description that explains what the skill does and when to use it",
    });
  } else if (fm.description.length > MAX_DESCRIPTION_LENGTH) {
    findings.push({
      rule: "frontmatter/description-length",
      severity: "warning",
      message: `Description exceeds ${MAX_DESCRIPTION_LENGTH} characters (${fm.description.length})`,
      fix: `Shorten description to ${MAX_DESCRIPTION_LENGTH} characters`,
    });
  }

  return findings;
}
