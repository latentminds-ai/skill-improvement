import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";

import { parseSkillFrontmatter } from "../../evaluator/checks/skillFrontmatter.js";
import type { LintFinding } from "../types.js";

const KNOWN_PLATFORMS = ["pi", "claude-code", "codex"];
const SHARED_DIRS = ["references", "scripts", "assets"];

/**
 * Validate variants/ directory integrity.
 * Per cross-platform-skill-packaging.md:
 * - Variant name must match canonical name (error)
 * - Variant governance metadata should match canonical (warning)
 * - Variant must not duplicate shared resources (error)
 */
export function checkVariants(skillPath: string): LintFinding[] {
  const findings: LintFinding[] = [];
  const variantsDir = join(skillPath, "variants");

  if (!existsSync(variantsDir)) return []; // no variants is fine

  const canonicalFm = parseSkillFrontmatter(join(skillPath, "SKILL.md"));
  if (!canonicalFm) return []; // frontmatter rule handles this

  const entries = readdirSync(variantsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const platformDir = join(variantsDir, entry.name);

    // Check for unknown platform directories
    if (!KNOWN_PLATFORMS.includes(entry.name)) {
      findings.push({
        rule: "variants/unknown-platform",
        severity: "warning",
        message: `Unknown platform directory: variants/${entry.name}`,
        fix: `Expected one of: ${KNOWN_PLATFORMS.join(", ")}`,
      });
    }

    // Check variant SKILL.md if present
    const variantSkillMd = join(platformDir, "SKILL.md");
    if (existsSync(variantSkillMd)) {
      const variantFm = parseSkillFrontmatter(variantSkillMd);

      if (variantFm) {
        // Name must match (error)
        if (variantFm.name && variantFm.name !== canonicalFm.name) {
          findings.push({
            rule: "variants/name-mismatch",
            severity: "error",
            message: `Variant ${entry.name}/SKILL.md name "${variantFm.name}" does not match canonical "${canonicalFm.name}"`,
            fix: `Set name to "${canonicalFm.name}" in variant SKILL.md`,
          });
        }

        // Governance metadata should match (warning)
        const canonicalMeta = canonicalFm.metadata ?? {};
        const variantMeta = variantFm.metadata ?? {};

        for (const field of ["tier", "owner"] as const) {
          const canonicalVal = (canonicalMeta as Record<string, unknown>)[field];
          const variantVal = (variantMeta as Record<string, unknown>)[field];
          if (canonicalVal && variantVal && String(canonicalVal) !== String(variantVal)) {
            findings.push({
              rule: "variants/metadata-drift",
              severity: "warning",
              message: `Variant ${entry.name}: metadata.${field} = "${variantVal}" differs from canonical "${canonicalVal}"`,
              fix: `Update variant metadata.${field} to match canonical`,
            });
          }
        }
      }
    }

    // Check for duplicated shared resources (error)
    for (const sharedDir of SHARED_DIRS) {
      const variantSharedDir = join(platformDir, sharedDir);
      if (existsSync(variantSharedDir) && statSync(variantSharedDir).isDirectory()) {
        findings.push({
          rule: "variants/duplicated-shared-resource",
          severity: "error",
          message: `Variant ${entry.name}/ duplicates shared directory: ${sharedDir}/`,
          fix: `Remove ${sharedDir}/ from variant — shared resources live at the package root`,
        });
      }
    }
  }

  return findings;
}
