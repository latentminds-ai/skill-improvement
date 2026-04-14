import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { EvaluationResult } from "../types.js";

export interface JsonReportOptions {
  outputDir: string;
}

export function writeJsonReport(result: EvaluationResult, options: JsonReportOptions): string {
  const latestPath = join(options.outputDir, "latest.json");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const historyDir = join(options.outputDir, "history");
  const historyPath = join(historyDir, `${timestamp}.json`);

  const report = {
    generatedAt: new Date().toISOString(),
    rubricName: result.rubric.name,
    rubricVersion: result.rubric.version,
    projectPath: result.projectPath,
    totalScore: result.totalScore,
    rubricTotalPoints: result.rubricTotalPoints,
    implementedTotalPoints: result.implementedTotalPoints,
    tiers: result.tiers,
    criteria: result.criteria,
  };

  const json = JSON.stringify(report, null, 2);

  ensureDir(dirname(latestPath));
  writeFileSync(latestPath, json, "utf8");

  ensureDir(historyDir);
  writeFileSync(historyPath, json, "utf8");

  return latestPath;
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
