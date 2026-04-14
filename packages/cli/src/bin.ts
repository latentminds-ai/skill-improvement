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
    const scorecardPath = args[3] ?? "SCORECARD.md";

    if (!projectPath) {
      console.error("Usage: skill-improvement evaluate <project-path> [rubric-path] [scorecard-path]");
      process.exit(1);
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
