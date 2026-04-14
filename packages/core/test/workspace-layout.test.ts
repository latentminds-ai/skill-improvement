import { describe, expect, it } from "vitest";

import { SUPPORTED_METHODS } from "../src/index.js";

describe("core package exports", () => {
  it("exports SUPPORTED_METHODS", () => {
    expect(SUPPORTED_METHODS).toContain("files");
    expect(SUPPORTED_METHODS).toContain("exec");
    expect(SUPPORTED_METHODS).toContain("http");
    expect(SUPPORTED_METHODS).toContain("glob");
    expect(SUPPORTED_METHODS).toContain("jsonPath");
  });
});
