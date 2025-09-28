import { describe, it, expect } from 'vitest';
import { buildPolesCSV, buildSpansCSV, buildExistingLinesCSV, buildGeoJSON, buildKML, sanitizeFilename, addBOM, buildExportBundle } from './exporters.js';

describe('exporters', () => {
  const poles = [{
    id: 'P1',
    label: 'Pole 1',
    lat: 40,
    lng: -80,
    heightFt: 35,
    class: '4',
    attachHeightFt: 28,
    bearingDeg: 12,
    pullFt: 5,
    notes: 'Test pole',
  }];
  const spans = [{
    id: 'S1',
    fromPoleId: 'P1',
    toPoleId: 'P2',
    lengthFt: 150,
    sagFt: 2,
    midspanHeightFt: 18,
    coordinates: [{ lat: 40, lng: -80 }, { lat: 40.001, lng: -80.001 }],
  }];
  const lines = [{
    id: 'L1',
    type: 'communication',
    lat: 40,
    lng: -80,
    heightFt: 16,
    notes: 'Down line',
  }];

  it('buildPolesCSV', () => {
    const csv = buildPolesCSV(poles, 'generic');
    const [header, data] = csv.split('\n');
    expect(header).toBe('id,label,latitude,longitude,height_ft,class,attach_height_ft,bearing_deg,pull_ft,notes');
    expect(data).toBe('P1,Pole 1,40,-80,35,4,28,12,5,Test pole');
  });
  it('buildSpansCSV', () => {
    const csv = buildSpansCSV(spans, 'generic');
    const [header, data] = csv.split('\n');
    expect(header).toBe('id,from_pole_id,to_pole_id,length_ft,sag_ft,midspan_height_ft');
    expect(data).toBe('S1,P1,P2,150,2,18');
  });
  it('buildExistingLinesCSV', () => {
    const csv = buildExistingLinesCSV(lines, 'generic');
    const [header, data] = csv.split('\n');
    expect(header).toBe('id,type,latitude,longitude,height_ft,notes');
    expect(data).toBe('L1,communication,40,-80,16,Down line');
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
