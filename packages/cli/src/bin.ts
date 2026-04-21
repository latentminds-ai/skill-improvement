#!/usr/bin/env node

import { runEvaluate } from "./evaluate.js";
import { runLint } from "./lint.js";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help" || command === "--help") {
    printUsage();
    process.exit(0);
  }

  if (command === "evaluate") {
    const projectPath = args[1];
    const rubricPath = args[2] ?? "rubric.json";
    let scorecardPath = args[3] ?? undefined;
    let outputDir = args[4] ?? undefined;

    // Parse flags
    for (let i = 5; i < args.length; i++) {
      if (args[i] === "--output-dir" || args[i] === "-o") {
        outputDir = args[++i];
      }
    }

    if (!projectPath) {
      console.error("Usage: skill-improvement evaluate <project-path> [rubric-path] [scorecard-path] [output-dir]");
      console.error("");
      console.error("Arguments:");
      console.error("  project-path    Path to the project to evaluate");
      console.error("  rubric-path     Path to rubric JSON (default: rubric.json)");
      console.error("  scorecard-path  Path for output scorecard (default: auto-generated)");
      console.error("  output-dir      Output directory for scorecards (default: ./scorecards/<project-name>/)");
      process.exit(1);
    }

    // Auto-generate scorecard path if not provided
    if (!scorecardPath) {
      const projectName = projectPath.split("/").pop() || "project";
      const defaultPath = outputDir 
        ? `${outputDir}/${projectName}/scorecard.md`
        : `scorecards/${projectName}/scorecard.md`;
      scorecardPath = defaultPath;
    }

    await runEvaluate({ projectPath, rubricPath, scorecardPath });
    process.exit(0);
  }

  if (command === "lint") {
    const skillPaths = args.slice(1);

    if (skillPaths.length === 0) {
      console.error("Usage: skill-improvement lint <skill-path> [skill-path...]");
      process.exit(1);
    }

    await runLint({ skillPaths });
    process.exit(0);
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}

function printUsage(): void {
  console.log(`
skill-improvement — cross-platform skill evaluation toolkit

Commands:
  evaluate <project-path> [rubric-path] [scorecard-path]
    Evaluate a project against a rubric and produce a scorecard.

    Arguments:
      project-path    Path to the project to evaluate
      rubric-path     Path to rubric JSON (default: rubric.json)
      scorecard-path  Path for output scorecard (default: SCORECARD.md)

  lint <skill-path> [skill-path...]
    Validate skill packages against the packaging and governance specs.

    Exits with code 1 if any errors are found.
    Warnings and info findings do not cause failure.
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
