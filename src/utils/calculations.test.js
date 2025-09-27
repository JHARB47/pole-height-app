import { describe, it, expect } from 'vitest';
import {
  normalizeBearingDeg,
  normalizeIncludedAngleDeg,
  pullFromAngleDeg,
  angleDegFromPull,
  computePullAutofill,
  examples
} from './calculations.js';

describe('geometry + PULL utilities', () => {
  it('normalizes bearing to [0,360)', () => {
    expect(normalizeBearingDeg(370)).toBe(10);
    expect(normalizeBearingDeg(-10)).toBe(350);
    expect(normalizeBearingDeg(720)).toBe(0);
  });

  it('computes included angle θ in [0,180]', () => {
    expect(normalizeIncludedAngleDeg(0, 0)).toBe(0);
    expect(normalizeIncludedAngleDeg(0, 60)).toBe(60);
    expect(normalizeIncludedAngleDeg(30, 210)).toBe(180);
    expect(normalizeIncludedAngleDeg(350, 10)).toBe(20);
  });

  it('forward mapping angle → PULL (S=100)', () => {
    expect(pullFromAngleDeg(0)).toBeCloseTo(0, 6);
    expect(pullFromAngleDeg(60)).toBeCloseTo(50, 3);
    expect(pullFromAngleDeg(120)).toBeCloseTo(86.6025, 3);
    expect(pullFromAngleDeg(180)).toBeCloseTo(100, 6);
  });

  it('inverse mapping PULL → angle (S=100)', () => {
    expect(angleDegFromPull(0)).toBeCloseTo(0, 6);
    expect(angleDegFromPull(50)).toBeCloseTo(60, 3);
    expect(angleDegFromPull(86.6025)).toBeCloseTo(120, 2);
    expect(angleDegFromPull(100)).toBeCloseTo(180, 6);
  });

  it('scales with alternate base span S', () => {
    expect(pullFromAngleDeg(60, 150)).toBeCloseTo(75, 3);
    expect(angleDegFromPull(75, 150)).toBeCloseTo(60, 3);
  });

  it('autofill computes θ and PULL from two bearings', () => {
    const r = computePullAutofill({ incomingBearingDeg: 350, outgoingBearingDeg: 10 });
    expect(r.thetaDeg).toBe(20);
    expect(r.pullFt).toBeCloseTo(100 * Math.sin((Math.PI / 180) * (20 / 2)), 6);
  });

  it('sanity examples match expectations', () => {
    expect(examples.zero).toBeCloseTo(0, 6);
    expect(examples.sixty).toBeCloseTo(50, 3);
    expect(examples.oneTwenty).toBeCloseTo(86.6025, 3);
    expect(examples.oneEighty).toBeCloseTo(100, 6);
  });
});
import {
  parseFeet,
  formatFeetInches,
  formatFeetInchesTickMarks,
  formatFeetInchesVerbose,
  calculateSag,
  calculateDownGuy,
  getPoleBurialData,
  DEFAULTS,
} from './calculations.js';

describe('parseFeet & formatFeetInches', () => {
  it('parses common formats including tick marks', () => {
    expect(parseFeet("35")).toBeCloseTo(35);
    expect(parseFeet("35'")).toBeCloseTo(35);
    expect(parseFeet("35ft")).toBeCloseTo(35);
    expect(parseFeet("35'6\"")).toBeCloseTo(35.5);
    expect(parseFeet("35' 6\"")).toBeCloseTo(35.5);
    expect(parseFeet('6"')).toBeCloseTo(0.5);
    expect(parseFeet('6""')).toBeCloseTo(0.5);
    expect(parseFeet('6in')).toBeCloseTo(0.5);
    expect(parseFeet('35 ft 6 in')).toBeCloseTo(35.5);
    expect(parseFeet('15.5')).toBeCloseTo(15.5);
    expect(parseFeet('15.5\'')).toBeCloseTo(15.5);
    expect(parseFeet('15.5ft')).toBeCloseTo(15.5);
  });
  
  it('formats with tick marks', () => {
    expect(formatFeetInchesTickMarks(42.92)).toBe('42\' 11"');
    expect(formatFeetInchesTickMarks(0.5)).toBe('0\' 6"');
    expect(formatFeetInchesTickMarks(15)).toBe('15\' 0"');
  });
  
  it('formats verbose', () => {
    expect(formatFeetInchesVerbose(42.92)).toBe('42ft 11in');
    expect(formatFeetInchesVerbose(0.5)).toBe('0ft 6in');
    expect(formatFeetInchesVerbose(15)).toBe('15ft 0in');
  });
  
  it('formats with options', () => {
    expect(formatFeetInches(42.92, { tickMarks: true })).toBe('42\' 11"');
    expect(formatFeetInches(42.92, { tickMarks: false })).toBe('42ft 11in');
  });
});

describe('sag calculation', () => {
  it('increases with span and wind', () => {
    const cable = DEFAULTS.cableTypes[0];
    const s1 = calculateSag(100, cable.weight, cable.tension, 70, cable.diameter, 0);
    const s2 = calculateSag(200, cable.weight, cable.tension, 90, cable.diameter, 0);
    expect(s2).toBeGreaterThan(s1);
  });
});

describe('down guy calculation', () => {
  it('requires guy when tension high', () => {
    const cable = { ...DEFAULTS.cableTypes[0], tension: 2500 };
    const pole = getPoleBurialData(45);
    const res = calculateDownGuy(pole.aboveGround, pole.aboveGround - 1, cable, 300, 100);
    expect(res).toBeTruthy();
    expect(res.required).toBe(true);
    expect(res.tension).toBeGreaterThan(0);
    expect(res.angle).toBeGreaterThan(0);
  });
});
