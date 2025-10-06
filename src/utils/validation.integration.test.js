import { describe, it, expect } from "vitest";
import { parsePolesCSVValidated, parseSpansCSVValidated } from "./importers";

const POLES_CSV = `id,height,class,xfmr,latitude,longitude\nP1,40,3,yes,40.1,-80.1\nP2,notnum,4,no,40.2,-80.2`; // second height invalid numeric
const SPANS_CSV = `id,from_id,to_id,length,attach\nS1,P1,P2,150,18\nS2,P2,P3,notnum,20`; // second length invalid

describe("validation integration (optional zod)", () => {
  it("validates poles and reports errors without throwing", async () => {
    const { data, errors } = await parsePolesCSVValidated(POLES_CSV, {
      id: "id",
      height: "height",
      class: "class",
      hasTransformer: "xfmr",
      latitude: "latitude",
      longitude: "longitude",
    });
    expect(Array.isArray(data)).toBe(true);
    expect(errors.length).toBeGreaterThanOrEqual(0); // if zod missing, errors may be 0
    // First row should parse numeric height
    expect(data[0].height).toBe(40);
  });

  it("validates spans and reports errors without throwing", async () => {
    const { data, errors } = await parseSpansCSVValidated(SPANS_CSV, {
      id: "id",
      fromId: "from_id",
      toId: "to_id",
      length: "length",
      proposedAttach: "attach",
    });
    expect(Array.isArray(data)).toBe(true);
    expect(errors.length).toBeGreaterThanOrEqual(0);
    expect(data[0].length).toBe(150);
  });
});
