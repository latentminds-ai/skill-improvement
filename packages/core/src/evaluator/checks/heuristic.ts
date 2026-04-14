import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import type { EvaluationContext } from "../context.js";
import type { CriterionResult, RubricCriterion } from "../types.js";

/**
 * Heuristic checks for llm-judge criteria.
 * Uses regex/file-inspection as reasonable approximations.
 * Each criterion ID maps to a specific heuristic function.
 */
const HEURISTIC_MAP: Record<string, (ctx: EvaluationContext) => HeuristicResult> = {
  "1.8": checkNoHardcodedValues,
  "2.2": checkIntegrationTests,
  "2.7": checkTestIsolation,
  "2.8": checkErrorPathTests,
  "3.4": checkSecurityHeaders,
  "3.5": checkCorsConfigured,
  "3.6": checkRateLimiting,
  "3.7": checkInputValidation,
  "3.8": checkErrorSanitization,
  "4.2": checkGracefulShutdown,
  "4.3": checkStructuredLogging,
  "4.4": checkRequestIdPropagation,
  "4.5": checkGlobalErrorHandler,
  "4.8": checkRequestTimeout,
  "5.2": checkLintInCI,
  "5.3": checkTypeCheckInCI,
  "5.4": checkTestInCI,
  "5.5": checkCoverageInCI,
  "5.6": checkSecurityScanInCI,
  "6.2": checkMeaningfulCommits,
  "6.3": checkAtomicCommits,
  "7.3": checkMemoryLeaks,
  "7.4": checkConnectionPoolingReady,
  "7.5": checkCompression,
  "7.6": checkCacheHeaders,
  "8.5": checkNonObviousComments,
  "8.6": checkErrorCodeCatalog,
};

interface HeuristicResult {
  passed: boolean;
  evidence: string;
  suggestedFix?: string;
}

export function checkHeuristic(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): CriterionResult | null {
  const fn = HEURISTIC_MAP[criterion.id];
  if (!fn) return null; // no heuristic available

  const start = Date.now();
  const result = fn(context);

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: "heuristic",
    pointsPossible: criterion.points,
    pointsAwarded: result.passed ? criterion.points : 0,
    status: result.passed ? "pass" : "fail",
    evidence: result.evidence,
    suggestedFix: result.suggestedFix,
    durationMs: Date.now() - start,
  };
}

// ── Heuristic implementations ───────────────────────────────────────────

function checkNoHardcodedValues(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  const bad = /(localhost|127\.0\.0\.1|:[0-9]{4}[^0-9])/.test(src);
  return {
    passed: !bad,
    evidence: bad ? "Hardcoded URLs/ports found in src/" : "No hardcoded values detected",
    suggestedFix: bad ? "Use environment variables for all config values" : undefined,
  };
}

function checkIntegrationTests(ctx: EvaluationContext): HeuristicResult {
  const tests = readAllTests(ctx);
  const found = /(supertest|app\.request|fetch\(|\.get\(|\.post\()/.test(tests);
  return {
    passed: found,
    evidence: found ? "HTTP-level test patterns found" : "No HTTP-level integration tests",
    suggestedFix: found ? undefined : "Add integration tests using app.request() or supertest",
  };
}

function checkTestIsolation(ctx: EvaluationContext): HeuristicResult {
  const tests = readAllTests(ctx);
  const found = /(beforeEach|afterEach|beforeAll|afterAll)/.test(tests);
  return {
    passed: found,
    evidence: found ? "Test setup/teardown patterns found" : "No beforeEach/afterEach patterns",
    suggestedFix: found ? undefined : "Add beforeEach/afterEach for test isolation",
  };
}

function checkErrorPathTests(ctx: EvaluationContext): HeuristicResult {
  const tests = readAllTests(ctx);
  const found = /(404|400|500|error|invalid|malformed)/i.test(tests);
  return {
    passed: found,
    evidence: found ? "Error path test patterns found" : "No error path tests",
    suggestedFix: found ? undefined : "Add tests for 404, 400, 500 responses",
  };
}

function checkSecurityHeaders(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  const found = /(secureHeaders|helmet|x-frame-options|content-security-policy)/i.test(src);
  return {
    passed: found,
    evidence: found ? "Security headers middleware detected" : "No security headers middleware",
    suggestedFix: found ? undefined : "Add secureHeaders() or helmet middleware",
  };
}

function checkCorsConfigured(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  const found = /(cors|access-control)/i.test(src);
  return {
    passed: found,
    evidence: found ? "CORS configuration detected" : "No CORS configuration",
    suggestedFix: found ? undefined : "Add CORS middleware with explicit origins",
  };
}

function checkRateLimiting(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  const found = /(rate.?limit|throttle|limiter)/i.test(src);
  return {
    passed: found,
    evidence: found ? "Rate limiting detected" : "No rate limiting",
    suggestedFix: found ? undefined : "Add rate limiting middleware",
  };
}

function checkInputValidation(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  const found = /(zod|valibot|joi|class-validator|z\.object|zValidator)/i.test(src);
  return {
    passed: found,
    evidence: found ? "Input validation detected" : "No input validation",
    suggestedFix: found ? undefined : "Add request validation with Zod",
  };
}

function checkErrorSanitization(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  const found = /(NODE_ENV|production|sanitize|onError|errorHandler)/i.test(src);
  return {
    passed: found,
    evidence: found ? "Error sanitization patterns detected" : "No production error handling",
    suggestedFix: found ? undefined : "Sanitize errors in production (no stack traces)",
  };
}

function checkGracefulShutdown(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  const found = /(SIGTERM|SIGINT|graceful)/i.test(src);
  return {
    passed: found,
    evidence: found ? "Graceful shutdown handlers detected" : "No SIGTERM/SIGINT handlers",
    suggestedFix: found ? undefined : "Add SIGTERM/SIGINT handlers for graceful shutdown",
  };
}

function checkStructuredLogging(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  const found = /(pino|winston|bunyan|logger\.info)/i.test(src);
  return {
    passed: found,
    evidence: found ? "Structured logging library detected" : "No structured logging (console.log only)",
    suggestedFix: found ? undefined : "Add pino or winston for structured JSON logging",
  };
}

function checkRequestIdPropagation(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  const found = /(request.?id|x-request-id|requestId)/i.test(src);
  return {
    passed: found,
    evidence: found ? "Request ID propagation detected" : "No request ID middleware",
    suggestedFix: found ? undefined : "Add request ID generation and propagation",
  };
}

function checkGlobalErrorHandler(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  const found = /(onError|errorHandler|unhandledRejection)/i.test(src);
  return {
    passed: found,
    evidence: found ? "Global error handler detected" : "No global error handler",
    suggestedFix: found ? undefined : "Add app.onError() and unhandledRejection handler",
  };
}

function checkRequestTimeout(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  const found = /(timeout|requestTimeout)/i.test(src);
  return {
    passed: found,
    evidence: found ? "Request timeout configuration detected" : "No request timeouts",
    suggestedFix: found ? undefined : "Add timeout middleware to prevent hanging requests",
  };
}

function checkLintInCI(ctx: EvaluationContext): HeuristicResult {
  const ci = readCIContent(ctx);
  const found = /(lint|eslint|biome)/i.test(ci);
  return {
    passed: found,
    evidence: found ? "Lint step found in CI" : "No lint step in CI",
    suggestedFix: found ? undefined : "Add lint step to CI pipeline",
  };
}

function checkTypeCheckInCI(ctx: EvaluationContext): HeuristicResult {
  const ci = readCIContent(ctx);
  const found = /(tsc|type.?check)/i.test(ci);
  return {
    passed: found,
    evidence: found ? "Type check step found in CI" : "No type check in CI",
    suggestedFix: found ? undefined : "Add tsc --noEmit step to CI",
  };
}

function checkTestInCI(ctx: EvaluationContext): HeuristicResult {
  const ci = readCIContent(ctx);
  const found = /(test|vitest|jest)/i.test(ci);
  return {
    passed: found,
    evidence: found ? "Test step found in CI" : "No test step in CI",
    suggestedFix: found ? undefined : "Add test execution to CI",
  };
}

function checkCoverageInCI(ctx: EvaluationContext): HeuristicResult {
  const ci = readCIContent(ctx);
  const found = /(coverage|codecov)/i.test(ci);
  return {
    passed: found,
    evidence: found ? "Coverage reporting in CI" : "No coverage in CI",
    suggestedFix: found ? undefined : "Add coverage reporting to CI",
  };
}

function checkSecurityScanInCI(ctx: EvaluationContext): HeuristicResult {
  const ci = readCIContent(ctx);
  const found = /(audit|snyk|security)/i.test(ci);
  return {
    passed: found,
    evidence: found ? "Security scan in CI" : "No security scanning in CI",
    suggestedFix: found ? undefined : "Add npm audit or SAST scanning to CI",
  };
}

function checkMeaningfulCommits(ctx: EvaluationContext): HeuristicResult {
  // Check git log for lazy messages
  try {
    const log = execSync("git log --oneline -20", { cwd: ctx.projectPath, timeout: 5000 }).toString();
    const lazy = /(^|\n)[a-f0-9]+ (fix|update|wip|asdf|test|changes)\s*$/im.test(log);
    return {
      passed: !lazy,
      evidence: lazy ? "Lazy commit messages found" : "Commit messages are descriptive",
      suggestedFix: lazy ? "Use descriptive commit messages" : undefined,
    };
  } catch {
    return { passed: false, evidence: "Could not read git log", suggestedFix: "Initialize git repo" };
  }
}

function checkAtomicCommits(ctx: EvaluationContext): HeuristicResult {
  // Simple heuristic: git repo exists with commits
  try {
    execSync("git log --oneline -1", { cwd: ctx.projectPath, timeout: 5000 });
    return { passed: true, evidence: "Git repository with commit history" };
  } catch {
    return { passed: false, evidence: "No git history", suggestedFix: "Initialize git with commits" };
  }
}

function checkMemoryLeaks(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  // Check for common leak patterns: unbounded caches, missing cleanup
  const unboundedMap = /new Map\(\)/.test(src) && !/\.delete\(|\.clear\(/.test(src);
  return {
    passed: !unboundedMap,
    evidence: unboundedMap ? "Potential unbounded Map without cleanup" : "No obvious memory leak patterns",
    suggestedFix: unboundedMap ? "Add cleanup/eviction for in-memory caches" : undefined,
  };
}

function checkConnectionPoolingReady(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  // Check for patterns indicating clean service/factory structure:
  // singleton exports, factory functions, cleanup patterns
  const found = /(export \{|export default|singleton|factory|pool|cleanup|close\()/i.test(src);
  return {
    passed: found,
    evidence: found ? "Code structured with clean exports/factory patterns" : "No service factory or pooling patterns",
    suggestedFix: found ? undefined : "Structure services as singletons with cleanup methods",
  };
}

function checkCompression(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  const found = /(compress|gzip|brotli|deflate)/i.test(src);
  return {
    passed: found,
    evidence: found ? "Compression middleware detected" : "No response compression",
    suggestedFix: found ? undefined : "Add compression middleware (gzip/brotli)",
  };
}

function checkCacheHeaders(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  const found = /(cache-control|etag|max-age)/i.test(src);
  return {
    passed: found,
    evidence: found ? "Cache headers configuration detected" : "No cache headers",
    suggestedFix: found ? undefined : "Set Cache-Control headers on responses",
  };
}

function checkNonObviousComments(ctx: EvaluationContext): HeuristicResult {
  const src = readAllSrc(ctx);
  // Look for WHY comments (not just WHAT)
  const found = /(\/\/\s*WHY|\/\/\s*REASON|\/\/\s*NOTE:|\/\*\*[\s\S]*?why[\s\S]*?\*\/)/i.test(src);
  return {
    passed: found,
    evidence: found ? "Explanatory comments found (WHY, not just WHAT)" : "No WHY-style comments",
    suggestedFix: found ? undefined : "Add comments explaining WHY decisions were made",
  };
}

function checkErrorCodeCatalog(ctx: EvaluationContext): HeuristicResult {
  // Check README, docs, or source for error code documentation
  const readme = readFile(ctx, "README.md");
  const apiDocs = readFile(ctx, "docs/api.md");
  const combined = readme + apiDocs;
  const found = /(error code|status code|error response|400|404|429|500)/i.test(combined);
  return {
    passed: found,
    evidence: found ? "Error codes documented" : "No error code documentation",
    suggestedFix: found ? undefined : "Document error response codes in README or API docs",
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────

function readAllSrc(ctx: EvaluationContext): string {
  return collectFileContents(join(ctx.projectPath, "src"));
}

function readAllTests(ctx: EvaluationContext): string {
  const dirs = ["tests", "test", "__tests__"];
  return dirs.map((d) => collectFileContents(join(ctx.projectPath, d))).join("\n");
}

function readCIContent(ctx: EvaluationContext): string {
  const ciDir = join(ctx.projectPath, ".github", "workflows");
  return collectFileContents(ciDir);
}

function readFile(ctx: EvaluationContext, relPath: string): string {
  const full = join(ctx.projectPath, relPath);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
}

function collectFileContents(dir: string): string {
  if (!existsSync(dir)) return "";
  const stat = statSync(dir);
  if (stat.isFile()) return readFileSync(dir, "utf8");
  if (!stat.isDirectory()) return "";

  const parts: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = join(dir, entry.name);
    if (entry.isFile()) parts.push(readFileSync(full, "utf8"));
    else if (entry.isDirectory()) parts.push(collectFileContents(full));
  }
  return parts.join("\n");
}
