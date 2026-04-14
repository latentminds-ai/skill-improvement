import type { EvaluationResult } from "../types.js";
import { tierMetricName } from "../rubric.js";

export function renderScorecard(result: EvaluationResult): string {
  const lines: string[] = [];

  const grade = computeGrade(result);

  lines.push("# Evaluation Scorecard");
  lines.push("");
  lines.push(`**Project:** \`${result.projectPath}\``);
  lines.push(`**Rubric:** ${result.rubric.name} v${result.rubric.version ?? "unknown"}`);
  lines.push(`**Date:** ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");

  // Summary
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| **Score** | **${result.totalScore}/${result.rubricTotalPoints}** |`);
  lines.push(`| Implemented checks | ${result.implementedTotalPoints}/${result.rubricTotalPoints} points |`);
  lines.push(`| Grade | **${grade}** |`);
  lines.push("");

  // Tier breakdown
  lines.push("## Scores by Tier");
  lines.push("");
  lines.push("| Tier | Score | Bar | Status |");
  lines.push("|------|-------|-----|--------|");

  for (const tier of result.tiers) {
    const pct = tier.possiblePoints > 0 ? tier.score / tier.possiblePoints : 0;
    const bar = renderBar(pct, 8);
    const status = tier.score === tier.possiblePoints ? "✅" : tier.score > 0 ? "⚠️" : "❌";
    lines.push(
      `| ${tier.id}. ${tier.name} | ${tier.score}/${tier.possiblePoints} | ${bar} | ${status} |`
    );
  }
  lines.push("");

  // Passes
  const passes = result.criteria.filter((c) => c.status === "pass");
  if (passes.length > 0) {
    lines.push("## Passes");
    lines.push("");
    for (const c of passes) {
      lines.push(`- ✅ **${c.id}** ${c.name} — ${c.evidence}`);
    }
    lines.push("");
  }

  // Failures
  const failures = result.criteria.filter((c) => c.status === "fail");
  if (failures.length > 0) {
    lines.push("## Failures & Fixes");
    lines.push("");
    for (const c of failures) {
      lines.push(`### ❌ ${c.id} — ${c.name}`);
      lines.push(`- **Evidence:** ${c.evidence}`);
      if (c.suggestedFix) {
        lines.push(`- **Fix:** ${c.suggestedFix}`);
      }
      lines.push("");
    }
  }

  // Errors
  const errors = result.criteria.filter((c) => c.status === "error");
  if (errors.length > 0) {
    lines.push("## Errors");
    lines.push("");
    for (const c of errors) {
      lines.push(`### ⚠️ ${c.id} — ${c.name}`);
      lines.push(`- **Evidence:** ${c.evidence}`);
      if (c.suggestedFix) {
        lines.push(`- **Fix:** ${c.suggestedFix}`);
      }
      lines.push("");
    }
  }

  // Unsupported
  const unsupported = result.criteria.filter((c) => c.status === "unsupported");
  if (unsupported.length > 0) {
    lines.push("## Unsupported Checks");
    lines.push("");
    lines.push("These criteria are defined in the rubric but not yet implemented in the evaluator.");
    lines.push("");
    for (const c of unsupported) {
      lines.push(`- ⬜ **${c.id}** ${c.name} (method: ${c.method})`);
    }
    lines.push("");
  }

  // Skipped
  const skipped = result.criteria.filter((c) => c.status === "skipped");
  if (skipped.length > 0) {
    lines.push("## Skipped Checks");
    lines.push("");
    for (const c of skipped) {
      lines.push(`- ⏭️ **${c.id}** ${c.name} — ${c.evidence}`);
    }
    lines.push("");
  }

  // Top improvements
  lines.push("## Top Next Improvements");
  lines.push("");
  const topFixes = failures.slice(0, 5);
  if (topFixes.length === 0) {
    lines.push("No failures — all implemented checks pass! 🎉");
  } else {
    for (const c of topFixes) {
      lines.push(`1. **${c.id} ${c.name}**: ${c.suggestedFix ?? c.evidence}`);
    }
  }
  lines.push("");

  return lines.join("\n");
}

function computeGrade(result: EvaluationResult): string {
  const grading = result.rubric.grading;
  if (!grading) {
    return `${result.totalScore}/${result.rubricTotalPoints}`;
  }

  for (const [letter, band] of Object.entries(grading)) {
    if (result.totalScore >= band.min && result.totalScore <= band.max) {
      return `${letter} (${band.label})`;
    }
  }

  return `${result.totalScore}/${result.rubricTotalPoints}`;
}

function renderBar(pct: number, width: number): string {
  const filled = Math.round(pct * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}
