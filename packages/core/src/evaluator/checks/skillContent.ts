import { join } from "node:path";

import type { EvaluationContext } from "../context.js";
import type { CriterionResult, RubricCriterion } from "../types.js";
import { extractSkillBody } from "./skillFrontmatter.js";

/**
 * Heuristic checks on the SKILL.md body content for agent-readiness.
 *
 * Criterion fields:
 * - check: string — which content dimension to evaluate:
 *   - "outputContract" — defines expected output format
 *   - "failureModes" — documents failure/error handling
 *   - "composability" — references on-demand loading, clear interfaces
 *   - "deterministicGates" — critical checks backed by scripts
 *   - "sectionStructure" — has organized sections (## headings)
 */
export function checkSkillContent(
  criterion: RubricCriterion,
  tierId: number,
  context: EvaluationContext
): CriterionResult {
  const start = Date.now();
  const skillMdPath = join(context.projectPath, "SKILL.md");
  const body = extractSkillBody(skillMdPath);

  if (!body) {
    return {
      id: criterion.id,
      tierId,
      name: criterion.name,
      method: criterion.method,
      pointsPossible: criterion.points,
      pointsAwarded: 0,
      status: "fail",
      evidence: "SKILL.md has no body content",
      suggestedFix: "Add instructions to SKILL.md after the frontmatter",
      durationMs: Date.now() - start,
    };
  }

  const check = criterion.check as string;

  switch (check) {
    case "outputContract":
      return checkOutputContract(criterion, tierId, body, start);
    case "failureModes":
      return checkFailureModes(criterion, tierId, body, start);
    case "composability":
      return checkComposability(criterion, tierId, body, start);
    case "deterministicGates":
      return checkDeterministicGates(criterion, tierId, body, start);
    case "sectionStructure":
      return checkSectionStructure(criterion, tierId, body, start);
    default:
      return {
        id: criterion.id,
        tierId,
        name: criterion.name,
        method: criterion.method,
        pointsPossible: criterion.points,
        pointsAwarded: 0,
        status: "unsupported",
        evidence: `Unknown content check: "${check}"`,
        suggestedFix: `Use one of: outputContract, failureModes, composability, deterministicGates, sectionStructure`,
        durationMs: Date.now() - start,
      };
  }
}

function checkOutputContract(
  criterion: RubricCriterion,
  tierId: number,
  body: string,
  start: number
): CriterionResult {
  // Look for output format definitions: code blocks with output templates,
  // "Output" sections, format descriptions
  const signals = [
    /##\s*(output|format|result|response)/i,
    /```[\s\S]*?(output|format|template|example)/i,
    /\boutput format\b/i,
    /\bexpected output\b/i,
    /\bproduces?\b.*\b(markdown|json|yaml|report|scorecard)\b/i,
  ];

  const matches = signals.filter((p) => p.test(body)).length;
  const passed = matches >= 1;

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: passed ? criterion.points : 0,
    status: passed ? "pass" : "fail",
    evidence: passed
      ? `Output contract defined (${matches} signal(s) found)`
      : "No output format/contract defined in skill body",
    suggestedFix: passed
      ? undefined
      : "Add an ## Output section describing what the skill produces and in what format",
    durationMs: Date.now() - start,
  };
}

function checkFailureModes(
  criterion: RubricCriterion,
  tierId: number,
  body: string,
  start: number
): CriterionResult {
  const signals = [
    /\b(error|fail|failure|edge.?case|exception)\b/i,
    /\b(if .* fails?|when .* fails?)\b/i,
    /\b(fallback|recovery|graceful|degrad)\b/i,
    /\b(do not|don't|never|must not|avoid)\b/i,
    /\b(guard|gate|prerequisite|require)\b/i,
  ];

  const matches = signals.filter((p) => p.test(body)).length;
  const passed = matches >= 2;

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: passed ? criterion.points : 0,
    status: passed ? "pass" : "fail",
    evidence: passed
      ? `Failure handling documented (${matches} signal(s))`
      : `Insufficient failure mode documentation (${matches} signal(s), need ≥2)`,
    suggestedFix: passed
      ? undefined
      : "Document what happens when things go wrong: error cases, fallbacks, prerequisites",
    durationMs: Date.now() - start,
  };
}

function checkComposability(
  criterion: RubricCriterion,
  tierId: number,
  body: string,
  start: number
): CriterionResult {
  // Composability signals: references to other skills, on-demand loading,
  // clear interfaces, handoff patterns
  const signals = [
    /\breferences?\//i,
    /\bscripts?\//i,
    /\bsee\s+\[/i,                       // markdown links to references
    /\b(load|read|invoke|call|use)\b.*\b(skill|reference|script)\b/i,
    /\b(handoff|transition|chain|pipeline|next step)\b/i,
    /\b(input|output|interface|contract)\b/i,
  ];

  const matches = signals.filter((p) => p.test(body)).length;
  const passed = matches >= 2;

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: passed ? criterion.points : 0,
    status: passed ? "pass" : "fail",
    evidence: passed
      ? `Composability signals found (${matches}): references, handoffs, or clear interfaces`
      : `Low composability (${matches} signal(s), need ≥2)`,
    suggestedFix: passed
      ? undefined
      : "Add references/ for on-demand docs, define clear interfaces, or describe how this skill chains with others",
    durationMs: Date.now() - start,
  };
}

function checkDeterministicGates(
  criterion: RubricCriterion,
  tierId: number,
  body: string,
  start: number
): CriterionResult {
  // Look for deterministic enforcement: scripts, commands, verification steps
  const signals = [
    /\bscripts?\//i,
    /```(bash|sh|shell)/i,
    /\b(run|execute|invoke)\b.*\b(script|command|check)\b/i,
    /\b(verify|validate|check|assert|confirm)\b/i,
    /\b(before|must|required|gate|prerequisite)\b.*\b(proceed|continue|start)\b/i,
  ];

  const matches = signals.filter((p) => p.test(body)).length;
  const passed = matches >= 1;

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: passed ? criterion.points : 0,
    status: passed ? "pass" : "fail",
    evidence: passed
      ? `Deterministic gates found (${matches} signal(s)): scripts or verification commands`
      : "No deterministic gates — critical checks rely on prose only",
    suggestedFix: passed
      ? undefined
      : "Add scripts/ with verification commands, or include bash blocks for critical checks",
    durationMs: Date.now() - start,
  };
}

function checkSectionStructure(
  criterion: RubricCriterion,
  tierId: number,
  body: string,
  start: number
): CriterionResult {
  const minSections = (criterion.minSections as number | undefined) ?? 2;
  const headings = body.match(/^#{1,3}\s+.+$/gm) ?? [];
  const passed = headings.length >= minSections;

  return {
    id: criterion.id,
    tierId,
    name: criterion.name,
    method: criterion.method,
    pointsPossible: criterion.points,
    pointsAwarded: passed ? criterion.points : 0,
    status: passed ? "pass" : "fail",
    evidence: `${headings.length} section heading(s) (need ≥${minSections})`,
    suggestedFix: passed
      ? undefined
      : `Add section headings (## When to Use, ## Process, ## Output, etc.) for structure`,
    durationMs: Date.now() - start,
  };
}
