// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { degToRad, radToDeg, pullFromAngleDeg, angleDegFromPull, normalizeIncludedAngleDeg, computePullAutofill, calculateSag } from './calculations';

const nearly = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

describe('Angle/Pull forward-inverse consistency', () => {
  it('deg/rad conversions roundtrip', () => {
    for (let d = -720; d <= 720; d += 15) {
      const r = degToRad(d);
      const back = radToDeg(r);
      expect(nearly(back, d)).toBe(true);
    }
  });
  it('pullFromAngleDeg and angleDegFromPull are inverse within tolerance', () => {
    const span = 137;
    for (let a = 0; a <= 180; a += 5) {
      const pull = pullFromAngleDeg(a, span);
      const a2 = angleDegFromPull(pull, span);
      expect(Math.abs(a - a2)).toBeLessThan(1e-9);
    }
  });
  it('PULL monotonically increases with angle', () => {
    let prev = -1;
    for (let a = 0; a <= 180; a += 2) {
      const p = pullFromAngleDeg(a, 200);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });
});

describe('Included angle from bearings', () => {
  it('always between 0 and 180', () => {
    for (let a = -450; a <= 450; a += 57) {
      for (let b = -450; b <= 450; b += 73) {
        const theta = normalizeIncludedAngleDeg(a, b);
        expect(theta).toBeGreaterThanOrEqual(0);
        expect(theta).toBeLessThanOrEqual(180);
      }
    }
  });
  it('computePullAutofill respects 180° opposite bearings', () => {
    const { thetaDeg, pullFt } = computePullAutofill({ incomingBearingDeg: 0, outgoingBearingDeg: 180, baseSpanFt: 100 });
    expect(thetaDeg).toBe(180);
    expect(pullFt).toBeCloseTo(pullFromAngleDeg(180, 100), 12);
  });
});

describe('Sag functional behavior', () => {
  it('sag increases with span (fixed tension)', () => {
    const w = 0.15, T = 1500;
    let prev = -1;
    for (let L = 50; L <= 400; L += 25) {
      const s = calculateSag(L, w, T, 70, 0.6, 0);
      expect(s).toBeGreaterThan(prev);
      prev = s;
    }
  });
  it('sag decreases with higher tension (fixed span)', () => {
    const w = 0.15, L = 200;
    let prev = Infinity;
    for (let T = 500; T <= 3000; T += 250) {
      const s = calculateSag(L, w, T, 70, 0.6, 0);
      expect(s).toBeLessThan(prev);
      prev = s;
    }
  });
});
