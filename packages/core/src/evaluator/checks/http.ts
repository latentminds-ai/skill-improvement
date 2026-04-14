import { spawn, type ChildProcess } from "node:child_process";
import type { EvaluationContext } from "../context.js";
import type { CriterionResult, RubricCriterion } from "../types.js";

const STARTUP_WAIT_MS = 3000;
const REQUEST_TIMEOUT_MS = 5000;

interface HttpExpectation {
  status?: number;
  bodyContains?: string;
}

/**
 * HTTP check: starts the project's server, hits an endpoint, checks response.
 * Handles the full lifecycle: start → wait → request → assert → kill.
 */
export async function checkHttp(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): Promise<CriterionResult> {
  const start = Date.now();
  const urlSpec = criterion.url as string; // e.g. "GET /"
  const expect = criterion.expect as HttpExpectation | undefined;

  const [method, path] = parseUrlSpec(urlSpec);
  const port = 49152 + Math.floor(Math.random() * 16383);
  const url = `http://127.0.0.1:${port}${path}`;

  let serverProcess: ChildProcess | null = null;

  try {
    // Start the server
    serverProcess = spawn("npx", ["tsx", "src/server.ts"], {
      cwd: context.projectPath,
      env: { ...process.env, PORT: String(port), NODE_ENV: "test", LOG_LEVEL: "silent" },
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    // Wait for server to be ready
    await waitForServer(url, STARTUP_WAIT_MS);

    // Make the request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      method,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const body = await response.text();
    const status = response.status;

    // Check expectations
    const statusOk = expect?.status ? status === expect.status : status >= 200 && status < 400;
    const bodyOk = expect?.bodyContains ? body.includes(expect.bodyContains) : true;
    const passed = statusOk && bodyOk;

    return {
      id: criterion.id,
      tierId,
      name: criterion.name,
      method: "http",
      pointsPossible: criterion.points,
      pointsAwarded: passed ? criterion.points : 0,
      status: passed ? "pass" : "fail",
      evidence: passed
        ? `${method} ${path} → ${status} (${body.slice(0, 100)})`
        : `${method} ${path} → ${status}. Expected status=${expect?.status ?? "2xx"}, bodyContains="${expect?.bodyContains ?? ""}"`,
      suggestedFix: passed ? undefined : `Fix ${method} ${path} to return expected response`,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      id: criterion.id,
      tierId,
      name: criterion.name,
      method: "http",
      pointsPossible: criterion.points,
      pointsAwarded: 0,
      status: "error",
      evidence: `HTTP check failed: ${err instanceof Error ? err.message : String(err)}`,
      suggestedFix: "Ensure the server starts and responds on the expected port",
      durationMs: Date.now() - start,
    };
  } finally {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill("SIGKILL");
    }
  }
}

/**
 * HTTP timing check: same as http but measures response time.
 */
export async function checkHttpTiming(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): Promise<CriterionResult> {
  const start = Date.now();
  const urlSpec = criterion.url as string;
  const maxP95ms = (criterion.maxP95ms as number) ?? 50;

  const [method, path] = parseUrlSpec(urlSpec);
  const port = 49152 + Math.floor(Math.random() * 16383);
  const url = `http://127.0.0.1:${port}${path}`;

  let serverProcess: ChildProcess | null = null;

  try {
    serverProcess = spawn("npx", ["tsx", "src/server.ts"], {
      cwd: context.projectPath,
      env: { ...process.env, PORT: String(port), NODE_ENV: "test", LOG_LEVEL: "silent" },
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    await waitForServer(url, STARTUP_WAIT_MS);

    // Warmup
    await fetch(url, { method });

    // Measure N requests
    const times: number[] = [];
    const iterations = 20;
    for (let i = 0; i < iterations; i++) {
      const t0 = performance.now();
      await fetch(url, { method });
      times.push(performance.now() - t0);
    }

    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)]!;
    const passed = p95 <= maxP95ms;

    return {
      id: criterion.id,
      tierId,
      name: criterion.name,
      method: "httpTiming",
      pointsPossible: criterion.points,
      pointsAwarded: passed ? criterion.points : 0,
      status: passed ? "pass" : "fail",
      evidence: `P95 latency: ${p95.toFixed(1)}ms (threshold: ${maxP95ms}ms)`,
      suggestedFix: passed ? undefined : `Optimize ${method} ${path} to respond within ${maxP95ms}ms`,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      id: criterion.id,
      tierId,
      name: criterion.name,
      method: "httpTiming",
      pointsPossible: criterion.points,
      pointsAwarded: 0,
      status: "error",
      evidence: `Timing check failed: ${err instanceof Error ? err.message : String(err)}`,
      suggestedFix: "Ensure the server starts and responds",
      durationMs: Date.now() - start,
    };
  } finally {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill("SIGKILL");
    }
  }
}

function parseUrlSpec(spec: string): [string, string] {
  const parts = spec.trim().split(/\s+/);
  if (parts.length === 2) return [parts[0]!, parts[1]!];
  return ["GET", parts[0] ?? "/"];
}

async function waitForServer(url: string, maxWaitMs: number): Promise<void> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(500) });
      return; // Server is up
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error(`Server did not start within ${maxWaitMs}ms`);
}
