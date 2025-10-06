import { describe, it, expect } from "vitest";
import { errorsToCSV } from "./validationExport";

describe("errorsToCSV", () => {
  it("produces CSV with header and rows", () => {
    const csv = errorsToCSV(["Bad pole", "Missing length"]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("index,error");
    expect(lines.length).toBe(3);
    expect(lines[1]).toContain("0,");
  });
});
