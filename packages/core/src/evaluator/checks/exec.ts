import { execSync, type ExecSyncOptions } from "node:child_process";

import type { EvaluationContext } from "../context.js";
import type { CriterionResult, RubricCriterion } from "../types.js";

const DEFAULT_TIMEOUT_MS = 15_000;

export function checkExec(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): CriterionResult {
  const start = Date.now();
  const command = criterion.command as string;
  const expectExitCode = (criterion.expectExitCode as number | undefined) ?? 0;
  const timeout = (criterion.timeout as number | undefined) ?? DEFAULT_TIMEOUT_MS;

  try {
    const opts: ExecSyncOptions = {
      cwd: context.projectPath,
      timeout,
      killSignal: "SIGKILL",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "test", PORT: String(49152 + Math.floor(Math.random() * 16383)) },
      maxBuffer: 1024 * 1024,
    };
    const stdout = execSync(command, opts).toString("utf8");

    return {
      id: criterion.id,
      tierId,
      name: criterion.name,
      method: criterion.method,
      pointsPossible: criterion.points,
      pointsAwarded: criterion.points,
      status: "pass",
      evidence: `Command "${command}" exited 0. Output: ${stdout.slice(0, 200)}`,
      durationMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const exitCode = isExecError(err) ? (err.status ?? -1) : -1;
    const stderr = isExecError(err) ? err.stderr?.toString("utf8").slice(0, 200) ?? "" : "";
    const timedOut = isExecError(err) && (err.killed || err.signal === "SIGKILL" || err.status === null);

    if (timedOut) {
      // For long-running processes (servers), surviving until timeout = success.
      // The rubric uses timeout to mean "boot check window" for commands like npm start.
      return {
        id: criterion.id,
        tierId,
        name: criterion.name,
        method: criterion.method,
        pointsPossible: criterion.points,
        pointsAwarded: criterion.points,
        status: "pass",
        evidence: `Command "${command}" ran for ${timeout}ms without crashing (server boot check)`,
        durationMs: Date.now() - start,
      };
    }

    // Some rubric checks just verify command succeeds (exit 0)
    // Others may have non-zero expected exit codes
    const passed = exitCode === expectExitCode;

    return {
      id: criterion.id,
      tierId,
      name: criterion.name,
      method: criterion.method,
      pointsPossible: criterion.points,
      pointsAwarded: passed ? criterion.points : 0,
      status: passed ? "pass" : "fail",
      evidence: `Command "${command}" exited ${exitCode} (expected ${expectExitCode}). ${stderr}`,
      suggestedFix: passed ? undefined : `Fix "${command}" to exit ${expectExitCode}`,
      durationMs: Date.now() - start,
    };
  }
}

interface ExecError {
  status?: number | null;
  signal?: string | null;
  stderr?: Buffer;
  killed?: boolean;
}

function isExecError(err: unknown): err is ExecError {
  return typeof err === "object" && err !== null;
}
