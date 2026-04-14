import { join } from "node:path";

import { parseSkillFrontmatter } from "../../evaluator/checks/skillFrontmatter.js";
import type { LintFinding } from "../types.js";

const VALID_TIERS = ["standards", "methodology", "personal"];
const VALID_SCOPES = ["global", "project", "local"];
const VALID_STATUSES = ["draft", "active", "deprecated", "archived"];
const KNOWN_PLATFORMS = ["pi", "claude-code", "codex"];

/**
 * Validate governance metadata fields.
 * Per skill-package-schema.md:
 * - Missing tier/owner/platforms = warning
 * - Missing scope/status = info
 * - Missing reviewed_at on standards/methodology = warning
 * - Unknown platform values = warning
 */
export function checkGovernance(skillPath: string): LintFinding[] {
  const findings: LintFinding[] = [];
  const fm = parseSkillFrontmatter(join(skillPath, "SKILL.md"));

  if (!fm) return []; // frontmatter rule handles this

  const metadata = fm.metadata;
  if (!metadata || typeof metadata !== "object") {
    findings.push({
      rule: "governance/metadata-block",
      severity: "warning",
      message: "No metadata block in frontmatter",
      fix: "Add metadata: block with tier, owner, and platforms fields",
    });
    return findings;
  }

  // Required governance fields (warning)
  if (!metadata.tier) {
    findings.push({
      rule: "governance/tier-required",
      severity: "warning",
      message: "Missing governance field: metadata.tier",
      fix: `Add tier: <${VALID_TIERS.join(" | ")}> to metadata`,
    });
  } else if (!VALID_TIERS.includes(String(metadata.tier))) {
    findings.push({
      rule: "governance/tier-valid",
      severity: "warning",
      message: `Invalid tier "${metadata.tier}" (expected: ${VALID_TIERS.join(", ")})`,
      fix: `Set tier to one of: ${VALID_TIERS.join(", ")}`,
    });
  }

  if (!metadata.owner) {
    findings.push({
      rule: "governance/owner-required",
      severity: "warning",
      message: "Missing governance field: metadata.owner",
      fix: "Add owner: <person-or-team> to metadata",
    });
  }

  if (!metadata.platforms) {
    findings.push({
      rule: "governance/platforms-required",
      severity: "warning",
      message: "Missing governance field: metadata.platforms",
      fix: "Add platforms: [pi, claude-code, codex] to metadata",
    });
  } else if (Array.isArray(metadata.platforms)) {
    for (const platform of metadata.platforms) {
      if (!KNOWN_PLATFORMS.includes(String(platform))) {
        findings.push({
          rule: "governance/platform-known",
          severity: "warning",
          message: `Unknown platform "${platform}" (known: ${KNOWN_PLATFORMS.join(", ")})`,
          fix: "Check for typos or add the platform to the known list",
        });
      }
    }
  }

  // Optional fields with defaults (info)
  if (!metadata.scope) {
    findings.push({
      rule: "governance/scope-default",
      severity: "info",
      message: "metadata.scope not set (defaults to project)",
    });
  } else if (!VALID_SCOPES.includes(String(metadata.scope))) {
    findings.push({
      rule: "governance/scope-valid",
      severity: "warning",
      message: `Invalid scope "${metadata.scope}" (expected: ${VALID_SCOPES.join(", ")})`,
      fix: `Set scope to one of: ${VALID_SCOPES.join(", ")}`,
    });
  }

  if (!metadata.status) {
    findings.push({
      rule: "governance/status-default",
      severity: "info",
      message: "metadata.status not set (defaults to active)",
    });
  } else if (!VALID_STATUSES.includes(String(metadata.status))) {
    findings.push({
      rule: "governance/status-valid",
      severity: "warning",
      message: `Invalid status "${metadata.status}" (expected: ${VALID_STATUSES.join(", ")})`,
      fix: `Set status to one of: ${VALID_STATUSES.join(", ")}`,
    });
  }

  // reviewed_at on standards/methodology (warning)
  const tier = String(metadata.tier ?? "");
  if ((tier === "standards" || tier === "methodology") && !metadata.reviewed_at) {
    findings.push({
      rule: "governance/reviewed-at-expected",
      severity: "warning",
      message: `metadata.reviewed_at missing for ${tier}-tier skill`,
      fix: "Add reviewed_at: YYYY-MM-DD to metadata",
    });
  }

  return findings;
}
