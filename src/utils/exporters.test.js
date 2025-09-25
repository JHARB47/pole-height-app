import { describe, it, expect } from 'vitest';
import { buildPolesCSV, buildSpansCSV, buildExistingLinesCSV, buildGeoJSON, buildKML, sanitizeFilename, addBOM, buildExportBundle } from './exporters.js';

describe('exporters', () => {
  const poles = [{ id: 'P1', height: 35, class: '4', powerHeight: 28, hasTransformer: true, longitude: -80, latitude: 40 }];
  const spans = [{ id: 'S1', fromId: 'P1', toId: 'P2', length: 150, proposedAttach: 18, coordinates: [[-80,40],[-80.001,40.001]] }];
  const lines = [{ type: 'communication', height: 16, companyName: 'ISP', makeReady: true, makeReadyHeight: 14 }];

  it('buildPolesCSV', () => {
    const csv = buildPolesCSV(poles, 'generic');
    expect(csv).toContain('POLE_ID');
  });
  it('buildSpansCSV', () => {
    const csv = buildSpansCSV(spans, 'generic');
    expect(csv).toContain('SPAN_ID');
  });
  it('buildExistingLinesCSV', () => {
    const csv = buildExistingLinesCSV(lines, 'generic');
    expect(csv).toContain('TYPE');
  });
  it('buildGeoJSON', () => {
    const gj = buildGeoJSON({ poles, spans });
    expect(gj.type).toBe('FeatureCollection');
  });
  it('buildKML', () => {
    const kml = buildKML({ poles, spans });
    expect(kml).toContain('<kml');
  });
  it('sanitizeFilename + clamp', () => {
    expect(sanitizeFilename(' My Job #123 ')).toBe('my-job-123');
    expect(sanitizeFilename('A'.repeat(300)).length).toBeLessThanOrEqual(120);
  });
  it('addBOM', () => {
    const withBom = addBOM('A,B\n1,2');
    expect(withBom.charCodeAt(0)).toBe(0xfeff);
  });
  it('buildExportBundle', () => {
    const { base, files } = buildExportBundle({ poles, spans, existingLines: lines, preset: 'generic', job: { name: 'Test', jobNumber: '123' } });
    const keys = Object.keys(files);
    expect(keys.some(k => k.endsWith('/poles.csv'))).toBe(true);
    expect(keys.some(k => k.endsWith('/spans.csv'))).toBe(true);
    expect(keys.some(k => k.endsWith('/existing_lines.csv'))).toBe(true);
    expect(keys.some(k => k.endsWith('/data.geojson'))).toBe(true);
    expect(keys.some(k => k.endsWith('/data.kml'))).toBe(true);
    expect(base).toMatch(/123-test-/);
  });
});
