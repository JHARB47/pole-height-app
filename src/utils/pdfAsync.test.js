import { describe, it, expect } from "vitest";

// Light smoke test - just verify the module exports the expected functions
describe("pdfAsync loader", () => {
  it("exports expected functions", async () => {
    const { loadPdfLib, createPdfDocument, withPdfLib } =
      await import("./pdfAsync");
    expect(typeof loadPdfLib).toBe("function");
    expect(typeof createPdfDocument).toBe("function");
    expect(typeof withPdfLib).toBe("function");
  });
});
