import { describe, it, expect } from 'vitest';
import { buildPolesCSV, buildSpansCSV, buildExistingLinesCSV, buildGeoJSON, buildKML, sanitizeFilename, addBOM, buildExportBundle } from './exporters.js';

describe('exporters basic', () => {
  const poles = [{ id: 'P1', height: 35, class: '4', powerHeight: 28, hasTransformer: true, longitude: -80, latitude: 40 }];
  const spans = [{ id: 'S1', fromId: 'P1', toId: 'P2', length: 150, proposedAttach: 18, coordinates: [[-80,40],[-80.001,40.001]] }];
  const lines = [{ type: 'communication', height: 16, companyName: 'ISP', makeReady: true, makeReadyHeight: 14 }];

  it('builds poles csv', () => {
    const csv = buildPolesCSV(poles, 'generic');
    expect(csv).toContain('POLE_ID');
    expect(csv.split('\n').length).toBe(2);
  });

  it('builds spans csv', () => {
    const csv = buildSpansCSV(spans, 'generic');
    expect(csv).toContain('SPAN_ID');
    expect(csv.split('\n').length).toBe(2);
  });

  it('builds existing lines csv', () => {
    const csv = buildExistingLinesCSV(lines, 'generic');
    expect(csv).toContain('TYPE');
    expect(csv.split('\n').length).toBe(2);
  });

  it('builds geojson', () => {
    const gj = buildGeoJSON({ poles, spans });
    expect(gj.type).toBe('FeatureCollection');
    expect(Array.isArray(gj.features)).toBe(true);
    expect(gj.features.length).toBeGreaterThan(0);
  });

  it('builds kml', () => {
    const kml = buildKML({ poles, spans });
    expect(kml).toContain('<kml');
    expect(kml).toContain('<Placemark>');
  });

  it('sanitizes filenames', () => {
    expect(sanitizeFilename(' My Job #123 ')).toBe('my-job-123');
    expect(sanitizeFilename('A'.repeat(300)).length).toBeLessThanOrEqual(120);
  });

  it('adds BOM to CSV when requested', () => {
    const csv = 'A,B\n1,2';
    const withBom = addBOM(csv);
    expect(withBom.charCodeAt(0)).toBe(0xfeff);
  });

  it('buildExportBundle returns expected files', () => {
    const { base, files } = buildExportBundle({ poles, spans, existingLines: lines, preset: 'generic', job: { name: 'Test', jobNumber: '123' } });
    const keys = Object.keys(files);
    expect(keys.some(k => k.endsWith('/poles.csv'))).toBe(true);
    expect(keys.some(k => k.endsWith('/spans.csv'))).toBe(true);
    expect(keys.some(k => k.endsWith('/existing_lines.csv'))).toBe(true);
    expect(keys.some(k => k.endsWith('/export.geojson'))).toBe(true);
    expect(keys.some(k => k.endsWith('/export.kml'))).toBe(true);
    expect(base).toMatch(/pole-plan-/);
  });
});

describe('exporters utility functions', () => {

  it('buildPolesCSV generic headers and mapping', () => {
    /** @type {any[]} */
    const poles = [{ id: 'P1', height: 35, class: '4', powerHeight: 28, hasTransformer: true, longitude: -80.1, latitude: 40.2 }];
    const csv = buildPolesCSV(poles, 'generic');
    const lines = csv.split('\n');
    expect(lines[0]).toBe('POLE_ID,HEIGHT_FT,CLASS,PWR_HT,XFMR,Longitude,Latitude');
    expect(lines[1]).toContain('P1');
    expect(lines[1]).toContain('35');
    expect(lines[1]).toContain('4');
    expect(lines[1]).toContain('28');
    expect(lines[1]).toContain('Y');
  });

  it('buildSpansCSV maps required fields', () => {
    /** @type {any[]} */
    const spans = [{ id: 'S1', fromId: 'P1', toId: 'P2', length: 150, proposedAttach: 18 }];
    const csv = buildSpansCSV(spans, 'generic');
    const lines = csv.split('\n');
    expect(lines[0]).toBe('SPAN_ID,FROM_ID,TO_ID,SPAN_FT,ATTACH_FT');
    expect(lines[1]).toBe('S1,P1,P2,150,18');
  });

  it('buildExistingLinesCSV handles make-ready and owner', () => {
    const linesIn = [{ type: 'communication', height: '15\' 6"', companyName: 'ISP', makeReady: true, makeReadyHeight: '16\' 0"' }];
    const csv = buildExistingLinesCSV(linesIn, 'generic');
    const lines = csv.split('\n');
    expect(lines[0]).toBe('TYPE,LINE_HT,OWNER,MAKE_READY,NEW_HT');
    expect(lines[1]).toContain('communication');
    expect(lines[1]).toContain('ISP');
    expect(lines[1]).toContain('Y');
  });

  it('buildGeoJSON produces FeatureCollection', () => {
    /** @type {Array<Object>} */
    const poles = [{ id: 'P1', height: 35, class: '4', powerHeight: 28, hasTransformer: true, longitude: -80.1, latitude: 40.2 }];
    /** @type {Array<Object>} */
    const spans = [{ id: 'S1', fromId: 'P1', toId: 'P2', length: 150, proposedAttach: 18, coordinates: [[-80.1,40.2],[-80.2,40.3]] }];
    const fc = buildGeoJSON({ poles, spans });
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features.length).toBe(2);
    expect(fc.features[0]?.geometry?.type).toBe('Point');
    expect(fc.features[1]?.geometry?.type).toBe('LineString');
  });

  it('buildKML emits placemarks for poles and spans', () => {
  /** @type {Array<Object>} */
  const poles = [{ id: 'P1', height: 35, class: '4', powerHeight: 28, hasTransformer: true, longitude: -80.1, latitude: 40.2 }];
  /** @type {Array<Object>} */
  const spans = [{ id: 'S1', fromId: 'P1', toId: 'P2', length: 150, proposedAttach: 18, coordinates: [[-80.1,40.2],[-80.2,40.3]] }];
    const kml = buildKML({ poles, spans });
    expect(kml).toContain('<kml');
    expect(kml).toContain('<Placemark>');
    expect(kml).toContain('<Point>');
    expect(kml).toContain('<LineString>');
  });

});
