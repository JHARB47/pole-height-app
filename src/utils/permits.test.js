import { describe, it, expect } from "vitest";

// Light smoke test - just verify the module exports the expected functions
describe("permit pdf builders", () => {
  it("exports expected functions", async () => {
    const { buildMM109PDF, buildCSXPDF } = await import("./permits.js");
    expect(typeof buildMM109PDF).toBe("function");
    expect(typeof buildCSXPDF).toBe("function");
  });
});
