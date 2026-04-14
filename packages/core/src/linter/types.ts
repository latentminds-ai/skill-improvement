export type LintSeverity = "error" | "warning" | "info";

export interface LintFinding {
  rule: string;
  severity: LintSeverity;
  message: string;
  fix?: string;
}

export interface LintResult {
  skillPath: string;
  skillName: string | null;
  findings: LintFinding[];
  errors: number;
  warnings: number;
  infos: number;
  passed: boolean;
}
