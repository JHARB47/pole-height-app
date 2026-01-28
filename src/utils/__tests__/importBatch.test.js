import { describe, it, expect, vi } from "vitest";
import { applyImportBatch } from "../importBatch.js";

describe("applyImportBatch", () => {
  it("applies imports in a single update", () => {
    const getState = () => ({
      importedPoles: [{ id: "P0" }],
      importedSpans: [],
      importedExistingLines: [],
      existingLines: [{ id: "L0" }],
    });
    const setState = vi.fn();

    applyImportBatch({
      getState,
      setState,
      payload: {
        poles: [{ id: "P1" }],
        spans: [{ id: "S1" }],
        existingLines: [{ id: "L1" }],
      },
    });

    expect(setState).toHaveBeenCalledTimes(1);
    const [update] = setState.mock.calls[0];
    expect(update.importedPoles).toHaveLength(2);
    expect(update.importedSpans).toHaveLength(1);
    expect(update.importedExistingLines).toHaveLength(1);
    expect(update.existingLines).toHaveLength(2);
  });
});
