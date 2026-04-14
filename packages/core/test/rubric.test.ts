import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { loadRubricFromFile, validateRubric } from "../src/index.js";

const RUBRIC_PATH = resolve(__dirname, "../../../benchmark-profiles/enterprise-hello-world/rubric.json");

describe("loadRubricFromFile", () => {
  it("loads the enterprise-hello-world rubric", () => {
    const rubric = loadRubricFromFile(RUBRIC_PATH);

    expect(rubric.name).toBe("Enterprise Hello World");
    expect(rubric.version).toBe("1.0.0");
    expect(rubric.totalPoints).toBe(66);
    expect(rubric.tiers).toHaveLength(9);
  });

  it("computes implementedPoints from supported methods", () => {
    const rubric = loadRubricFromFile(RUBRIC_PATH);

    // implementedPoints ≤ totalPoints, and > 0 (we support many methods)
    expect(rubric.implementedPoints).toBeGreaterThan(0);
    expect(rubric.implementedPoints).toBeLessThanOrEqual(rubric.totalPoints);
  });

  it("includes grading bands", () => {
    const rubric = loadRubricFromFile(RUBRIC_PATH);

    expect(rubric.grading).toBeDefined();
    expect(rubric.grading!["A"]).toEqual({ min: 56, max: 66, label: "Enterprise-grade" });
    expect(rubric.grading!["F"]).toEqual({ min: 0, max: 4, label: "Proof of Life only" });
  });
});

describe("validateRubric", () => {
  it("rejects non-object input", () => {
    expect(() => validateRubric("not an object")).toThrow("top-level value must be an object");
  });

  it("rejects missing name", () => {
    expect(() => validateRubric({ tiers: [] })).toThrow("name is required");
  });

  it("rejects empty tiers", () => {
    expect(() => validateRubric({ name: "test", tiers: [] })).toThrow("non-empty array");
  });

  it("rejects duplicate tier ids", () => {
    const input = {
      name: "test",
      tiers: [
        { id: 1, name: "A", points: 1, criteria: [{ id: "1.1", name: "c", type: "deterministic", method: "files", points: 1 }] },
        { id: 1, name: "B", points: 1, criteria: [{ id: "1.2", name: "d", type: "deterministic", method: "files", points: 1 }] },
      ],
    };
    expect(() => validateRubric(input)).toThrow("duplicate tier id");
  });

  it("rejects duplicate criterion ids", () => {
    const input = {
      name: "test",
      tiers: [
        {
          id: 1,
          name: "A",
          points: 2,
          criteria: [
            { id: "1.1", name: "c", type: "deterministic", method: "files", points: 1 },
            { id: "1.1", name: "d", type: "deterministic", method: "files", points: 1 },
          ],
        },
      ],
    };
    expect(() => validateRubric(input)).toThrow("duplicate criterion id");
  });

  it("rejects tier points mismatch", () => {
    const input = {
      name: "test",
      tiers: [
        {
          id: 1,
          name: "A",
          points: 10,
          criteria: [{ id: "1.1", name: "c", type: "deterministic", method: "files", points: 1 }],
        },
      ],
    };
    expect(() => validateRubric(input)).toThrow("must equal criteria sum");
  });

  it("validates a minimal rubric", () => {
    const input = {
      name: "Minimal",
      tiers: [
        {
          id: 0,
          name: "Basics",
          points: 2,
          criteria: [
            { id: "0.1", name: "Check A", type: "deterministic", method: "files", points: 1 },
            { id: "0.2", name: "Check B", type: "deterministic", method: "exec", points: 1 },
          ],
        },
      ],
    };

    const rubric = validateRubric(input);
    expect(rubric.name).toBe("Minimal");
    expect(rubric.totalPoints).toBe(2);
    expect(rubric.implementedPoints).toBe(2); // both files and exec are supported
  });
});
