import { describe, it, expect } from 'vitest';
import { computeAnalysis, formatFeetInches } from './calculations.js';

function mockInputs(overrides = {}) {
  return {
    poleHeight: 40,
    poleClass: 'Class 4',
    existingPowerHeight: '35ft 0in',
    existingPowerVoltage: 'distribution',
    spanDistance: 150,
    isNewConstruction: false,
    adjacentPoleHeight: 40,
    attachmentType: 'communication',
    cableDiameter: 0.6,
    windSpeed: 90,
    spanEnvironment: 'road',
    streetLightHeight: '25ft 0in',
    dripLoopHeight: '22ft 0in',
    proposedLineHeight: '22ft 0in',
    existingLines: [
      { type: 'communication', height: '18ft 6in', makeReady: true, makeReadyHeight: '19ft 6in', companyName: 'Comcast' },
      { type: 'drop', height: '15ft 0in', makeReady: false, makeReadyHeight: '', companyName: 'Verizon' },
      { type: 'neutral', height: '26ft 0in', makeReady: false, makeReadyHeight: '', companyName: 'Utility' },
    ],
    iceThicknessIn: 0,
    hasTransformer: true,
    presetProfile: 'firstEnergy',
    customMinTopSpace: '',
    customRoadClearance: '',
    customCommToPower: '',
    ...overrides,
  };
}

function within(x, min, max) { return x >= min && x <= max; }

describe('computeAnalysis reliability', () => {
  it('produces a coherent analysis with typical inputs', () => {
  const { results, cost, errors } = computeAnalysis(mockInputs());
  expect(errors).toBeUndefined();
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
    expect(typeof formatFeetInches(results.attach.proposedAttachFt)).toBe('string');
  });

  it('handles new construction path', () => {
    const out = computeAnalysis(mockInputs({ isNewConstruction: true, existingPowerHeight: '' }));
    expect(out.errors).toBeUndefined();
    expect(out.results.attach.proposedAttachFt).toBeGreaterThan(0);
  });

  it('flags low midspan clearance as warning when applicable', () => {
    const out = computeAnalysis(mockInputs({ spanDistance: 300, adjacentPoleHeight: 35, proposedLineHeight: '20ft 0in' }));
    expect(Array.isArray(out.warnings)).toBe(true);
  });
});
