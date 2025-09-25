import { describe, it, expect } from 'vitest';
import { coerceNumber } from './importers.js';

describe('coerceNumber', () => {
  it('parses plain numbers', () => {
    expect(coerceNumber('34')).toBe(34);
    expect(coerceNumber(34.5)).toBe(34.5);
  });
  it('handles thousands and locale decimal comma', () => {
    expect(coerceNumber('1,234')).toBe(1234);
    expect(coerceNumber('1,234.56')).toBe(1234.56);
    expect(coerceNumber('1.234,56')).toBe(1234.56);
  });
  it('strips units and symbols', () => {
    expect(coerceNumber('40 ft')).toBe(40);
    expect(coerceNumber('40.1°')).toBe(40.1);
    expect(coerceNumber('  12 m  ')).toBe(12);
  });
  it("converts feet-inches like 12'6\" to decimal", () => {
    expect(coerceNumber("12'0\"")).toBe(12);
    expect(coerceNumber("12'6\"")).toBeCloseTo(12.5, 6);
  });
  it('handles parentheses negatives', () => {
    expect(coerceNumber('(12.5)')).toBe(-12.5);
  });
  it('returns undefined for invalid', () => {
    expect(coerceNumber('abc')).toBeUndefined();
    expect(coerceNumber('')).toBeUndefined();
    expect(coerceNumber(null)).toBeUndefined();
  });
});
