import { describe, it, expect } from "vitest";
import { makePermitSummary } from "./permitSummary";

describe("makePermitSummary", () => {
  const baseResults = {
    span: { spanFt: 150, midspanFt: 16.5 },
    attach: {
      proposedAttachFt: 22,
      recommendation: { basis: "test", detail: "details" },
    },
    clearances: { groundClearance: 18 },
  };
  const baseJob = {
    id: "J1",
    name: "Job One",
    applicantName: "Acme",
    jobNumber: "123",
    jobOwner: "Mon Power",
  };
  const baseStore = {
    projectName: "Proj",
    applicantName: "Acme",
    jobNumber: "123",
    jobOwner: "Mon Power",
    poleHeight: "40",
    poleClass: "Class 4",
    poleLatitude: "40.0",
    poleLongitude: "-80.0",
    existingPowerVoltage: "distribution",
    existingPowerHeight: "30' 0\"",
  };

  it("sets type for WV Highway and Railroad", () => {
    const profile = { envWVHighwayFt: 18, envRailroadFt: 27 };
    const s1 = makePermitSummary({
      env: "wvHighway",
      results: baseResults,
      job: baseJob,
      effectiveProfile: profile,
      cachedMidspans: [],
      store: baseStore,
    });
    expect(s1.type).toBe("WVDOH MM109");
    const s2 = makePermitSummary({
      env: "railroad",
      results: baseResults,
      job: baseJob,
      effectiveProfile: profile,
      cachedMidspans: [],
      store: baseStore,
    });
    expect(s2.type).toBe("CSX Railroad Crossing");
  });

  it("uses max target from cached midspans when available", () => {
    const profile = { envWVHighwayFt: 18 };
    const cached = [
      { environment: "wvHighway", targetFt: 18.5 },
      { environment: "wvHighway", targetFt: 19.2 },
      { environment: "road", targetFt: 16 },
    ];
    const s = makePermitSummary({
      env: "wvHighway",
      results: baseResults,
      job: baseJob,
      effectiveProfile: profile,
      cachedMidspans: cached,
      store: baseStore,
    });
    expect(s.span.targetFt).toBe(19.2);
  });

  it("falls back to results.clearances.groundClearance when no cached target", () => {
    const profile = { envWVHighwayFt: 18 };
    const s = makePermitSummary({
      env: "wvHighway",
      results: baseResults,
      job: baseJob,
      effectiveProfile: profile,
      cachedMidspans: [],
      store: baseStore,
    });
    expect(s.span.targetFt).toBe(18);
  });

  it("indicates targetSource and exposes computedGroundClearanceFt", () => {
    const profile = { envWVHighwayFt: 18 };
    const cached = [{ environment: "wvHighway", targetFt: 19.2 }];
    const s1 = makePermitSummary({
      env: "wvHighway",
      results: baseResults,
      job: baseJob,
      effectiveProfile: profile,
      cachedMidspans: cached,
      store: baseStore,
    });
    expect(s1.span.targetSource).toBe("cachedMidspans");
    expect(s1.span.computedGroundClearanceFt).toBe(18);
    const s2 = makePermitSummary({
      env: "wvHighway",
      results: baseResults,
      job: baseJob,
      effectiveProfile: profile,
      cachedMidspans: [],
      store: baseStore,
    });
    expect(s2.span.targetSource).toBe("computed");
  });
});
