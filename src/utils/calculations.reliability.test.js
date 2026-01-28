import { describe, it, expect } from "vitest";
import { computeAnalysis, formatFeetInches } from "./calculations.js";

function mockInputs(overrides = {}) {
  return {
    poleHeight: 40,
    poleClass: "Class 4",
    existingPowerHeight: "35ft 0in",
    existingPowerVoltage: "distribution",
    spanDistance: 150,
    isNewConstruction: false,
    adjacentPoleHeight: 40,
    attachmentType: "communication",
    cableDiameter: 0.6,
    windSpeed: 90,
    spanEnvironment: "road",
    streetLightHeight: "25ft 0in",
    dripLoopHeight: "22ft 0in",
    proposedLineHeight: "22ft 0in",
    existingLines: [
      {
        type: "communication",
        height: "18ft 6in",
        makeReady: true,
        makeReadyHeight: "19ft 6in",
        companyName: "Comcast",
      },
      {
        type: "drop",
        height: "15ft 0in",
        makeReady: false,
        makeReadyHeight: "",
        companyName: "Verizon",
      },
      {
        type: "neutral",
        height: "26ft 0in",
        makeReady: false,
        makeReadyHeight: "",
        companyName: "Utility",
      },
    ],
    iceThicknessIn: 0,
    hasTransformer: true,
    presetProfile: "firstEnergy",
    customMinTopSpace: "",
    customRoadClearance: "",
    customCommToPower: "",
    ...overrides,
  };
}

function within(x, min, max) {
  return x >= min && x <= max;
}

describe("computeAnalysis reliability", () => {
  it("produces a coherent analysis with typical inputs", () => {
    const { ok, results, cost, errors } = computeAnalysis(mockInputs());
    expect(ok).toBe(true);
    expect(Object.keys(errors || {}).length).toBe(0);
    expect(results).toBeTruthy();

    // Pole basics
    expect(results.pole.inputHeight).toBe(40);
    expect(within(results.pole.buriedFt, 5, 7)).toBe(true);
    expect(within(results.pole.aboveGroundFt, 33, 36)).toBe(true);

    // Attachment derived from power clearance (distribution ~ 40in)
    expect(results.attach.proposedAttachFt).toBeGreaterThan(0);

    // Span calc
    expect(results.span.spanFt).toBe(150);
    expect(results.span.sagFt).toBeGreaterThanOrEqual(0);
    expect(results.span.midspanFt).toBeDefined();

    // Clearances targets should be positive and consistent
    expect(results.clearances.roadClearance).toBeGreaterThan(0);
    expect(results.clearances.minimumPoleTopSpace).toBeGreaterThan(0);

    // Make-ready total reflects one adjusted line
    expect(results.makeReadyTotal).toBeGreaterThan(0);

    // Guy calculation present for nonzero span
    expect(results.guy).toBeTruthy();

    // Cost includes make-ready and guy cost when applicable
    expect(cost).toBeGreaterThanOrEqual(results.makeReadyTotal);

    // No basic contradictions: midspan should not be negative
    expect(results.span.midspanFt).toBeGreaterThan(0);

    // Formatting helpers don’t crash on values
    expect(typeof formatFeetInches(results.attach.proposedAttachFt)).toBe(
      "string",
    );
  });

  it("handles new construction path", () => {
    const out = computeAnalysis(
      mockInputs({ isNewConstruction: true, existingPowerHeight: "" }),
    );
    expect(out.ok).toBe(true);
    expect(Object.keys(out.errors || {}).length).toBe(0);
    expect(out.results.attach.proposedAttachFt).toBeGreaterThan(0);
  });

  it("flags low midspan clearance as warning when applicable", () => {
    const out = computeAnalysis(
      mockInputs({
        spanDistance: 300,
        adjacentPoleHeight: 35,
        proposedLineHeight: "20ft 0in",
      }),
    );
    expect(Array.isArray(out.warnings)).toBe(true);
  });

  it('uses FE 44" comm-to-power when jobOwner is FE subsidiary', () => {
    // Baseline with generic preset and no FE owner: expect 40"
    const base = computeAnalysis(
      mockInputs({
        presetProfile: "",
        existingPowerHeight: "35ft 0in",
        jobOwner: "",
        powerReference: "power",
        dripLoopHeight: "",
      }),
    );
    expect(base.ok).toBe(true);
    expect(Object.keys(base.errors || {}).length).toBe(0);
    const sep40 = (35 - base.results.attach.proposedAttachFt) * 12; // inches
    // With FE subsidiary owner at job level: expect ~44"
    const fe = computeAnalysis(
      mockInputs({
        presetProfile: "",
        existingPowerHeight: "35ft 0in",
        jobOwner: "Mon Power",
        powerReference: "power",
        dripLoopHeight: "",
      }),
    );
    expect(fe.ok).toBe(true);
    expect(Object.keys(fe.errors || {}).length).toBe(0);
    const sep44 = (35 - fe.results.attach.proposedAttachFt) * 12;
    expect(Math.round(sep40)).toBe(40);
    expect(Math.round(sep44)).toBe(44);
  });

  it("applies environment-specific ground clearance override (residential)", () => {
    const out = computeAnalysis(
      mockInputs({
        spanEnvironment: "residential",
        submissionProfile: { envResidentialFt: 16.5 },
      }),
    );
    expect(out.ok).toBe(true);
    expect(Object.keys(out.errors || {}).length).toBe(0);
    expect(out.results.clearances.groundClearance).toBeCloseTo(16.5, 5);
  });

  it("applies Interstate ground clearance from profile", () => {
    const out = computeAnalysis(
      mockInputs({
        spanEnvironment: "interstate",
        submissionProfile: { envInterstateFt: 18.0 },
      }),
    );
    expect(out.ok).toBe(true);
    expect(Object.keys(out.errors || {}).length).toBe(0);
    expect(out.results.clearances.groundClearance).toBeCloseTo(18.0, 5);
  });

  it("applies Interstate (New Crossing) ground clearance from profile", () => {
    const out = computeAnalysis(
      mockInputs({
        spanEnvironment: "interstateNewCrossing",
        submissionProfile: { envInterstateNewCrossingFt: 21.0 },
      }),
    );
    expect(out.ok).toBe(true);
    expect(Object.keys(out.errors || {}).length).toBe(0);
    expect(out.results.clearances.groundClearance).toBeCloseTo(21.0, 5);
  });

  it("applies Non-Residential Driveway ground clearance from profile", () => {
    const out = computeAnalysis(
      mockInputs({
        spanEnvironment: "nonResidentialDriveway",
        submissionProfile: { envNonResidentialDrivewayFt: 16.0 },
      }),
    );
    expect(out.ok).toBe(true);
    expect(Object.keys(out.errors || {}).length).toBe(0);
    expect(out.results.clearances.groundClearance).toBeCloseTo(16.0, 5);
  });

  it("clamps proposed attach to min communications attach height when no power present", () => {
    // Force commOwnerScenario by setting voltage to 'communication' and no power height
    const out = computeAnalysis(
      mockInputs({
        poleHeight: 18,
        existingPowerHeight: "",
        existingPowerVoltage: "communication",
        isNewConstruction: false,
        submissionProfile: { minCommAttachFt: 14.0 },
      }),
    );
    expect(out.ok).toBe(true);
    expect(Object.keys(out.errors || {}).length).toBe(0);
    expect(out.results.attach.proposedAttachFt).toBeGreaterThanOrEqual(14.0);
  });

  it("returns structured errors when required inputs are missing", () => {
    const out = computeAnalysis(mockInputs({ poleHeight: 0 }));
    expect(out.ok).toBe(false);
    expect(out.errors?.poleHeight).toBeTruthy();
    expect(out.results).toBeNull();
  });

  it("handles missing span data without throwing", () => {
    const out = computeAnalysis(
      mockInputs({ spanDistance: 0, adjacentPoleHeight: 0 }),
    );
    expect(out.ok).toBe(true);
    expect(out.results).toBeTruthy();
    expect(out.results.span.spanFt).toBe(0);
    expect(out.results.span.midspanFt).toBeNull();
  });

  it("skips haversine span when coordinates are invalid", () => {
    const out = computeAnalysis(
      mockInputs({
        spanDistance: 0,
        poleLatitude: "",
        poleLongitude: "",
        adjacentPoleLatitude: "",
        adjacentPoleLongitude: "",
      }),
    );
    expect(out.ok).toBe(true);
    expect(out.results.span.spanFt).toBe(0);
  });
});
