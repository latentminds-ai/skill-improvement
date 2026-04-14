import { resolve } from "node:path";

import {
  lintSkillPackage,
  formatLintResult,
} from "@latentminds/skill-improvement-core";

export interface LintOptions {
  skillPaths: string[];
}

export async function runLint(options: LintOptions): Promise<void> {
  const { skillPaths } = options;
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const skillPath of skillPaths) {
    const result = lintSkillPackage(resolve(skillPath));
    console.log(formatLintResult(result));
    console.log("");
    totalErrors += result.errors;
    totalWarnings += result.warnings;
  }

  if (skillPaths.length > 1) {
    console.log("═══════════════════════════════════════");
    console.log(`Total: ${totalErrors} error(s), ${totalWarnings} warning(s) across ${skillPaths.length} skills`);
  }

  if (totalErrors > 0) {
    process.exit(1);
  }
}
