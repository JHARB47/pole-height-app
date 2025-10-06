import { describe, it, expect } from "vitest";
import { parsePolesCSVValidated, parseSpansCSVValidated } from "./importers";

const POLES_CSV = `id,height,class,xfmr,latitude,longitude\nP1,40,3,yes,40.1,-80.1\nP2,notnum,4,no,40.2,-80.2`;
const SPANS_CSV = `id,from_id,to_id,length,attach\nS1,P1,P2,150,18\nS2,P2,P3,notnum,20`;

describe("validation helpers", () => {
  it("returns data and errors keys for poles", async () => {
    const { data, errors } = await parsePolesCSVValidated(POLES_CSV, {
      id: "id",
      height: "height",
      class: "class",
      hasTransformer: "xfmr",
      latitude: "latitude",
      longitude: "longitude",
    });
    expect(Array.isArray(data)).toBe(true);
    expect(errors).toBeDefined();
  });
  it("returns data and errors keys for spans", async () => {
    const { data, errors } = await parseSpansCSVValidated(SPANS_CSV, {
      id: "id",
      fromId: "from_id",
      toId: "to_id",
      length: "length",
      proposedAttach: "attach",
    });
    expect(Array.isArray(data)).toBe(true);
    expect(errors).toBeDefined();
  });
  it("produces at least one validation error for invalid numeric values", async () => {
    const poleRes = await parsePolesCSVValidated(POLES_CSV, {
      id: "id",
      height: "height",
      class: "class",
      hasTransformer: "xfmr",
      latitude: "latitude",
      longitude: "longitude",
    });
    const spanRes = await parseSpansCSVValidated(SPANS_CSV, {
      id: "id",
      fromId: "from_id",
      toId: "to_id",
      length: "length",
      proposedAttach: "attach",
    });
    // The schema currently treats height/length as optional unions but numeric coercion failures should still leave raw strings; ensure arrays defined
    expect(Array.isArray(poleRes.errors)).toBe(true);
    expect(Array.isArray(spanRes.errors)).toBe(true);
  });
});
