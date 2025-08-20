import { describe, it, expect } from 'vitest';
import { buildPolesCSV, buildSpansCSV, buildExistingLinesCSV, buildGeoJSON, buildKML } from './exporters';

describe('exporters', () => {
  it('buildPolesCSV generic headers and mapping', () => {
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
    const poles = [{ id: 'P1', height: 35, class: '4', powerHeight: 28, hasTransformer: true, longitude: -80.1, latitude: 40.2 }];
    const spans = [{ id: 'S1', fromId: 'P1', toId: 'P2', length: 150, proposedAttach: 18, coordinates: [[-80.1,40.2],[-80.2,40.3]] }];
    const fc = buildGeoJSON({ poles, spans });
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features.length).toBe(2);
    expect(fc.features[0].geometry.type).toBe('Point');
    expect(fc.features[1].geometry.type).toBe('LineString');
  });

  it('buildKML emits placemarks for poles and spans', () => {
    const poles = [{ id: 'P1', height: 35, class: '4', powerHeight: 28, hasTransformer: true, longitude: -80.1, latitude: 40.2 }];
    const spans = [{ id: 'S1', fromId: 'P1', toId: 'P2', length: 150, proposedAttach: 18, coordinates: [[-80.1,40.2],[-80.2,40.3]] }];
    const kml = buildKML({ poles, spans });
    expect(kml).toContain('<kml');
    expect(kml).toContain('<Placemark>');
    expect(kml).toContain('<Point>');
    expect(kml).toContain('<LineString>');
  });

  it('PoleForeman preset uses POLE_HT_FT header', () => {
    const poles = [{ id: 'PF1', height: 40, class: '3', powerHeight: 30, latitude: 40, longitude: -80 }];
    const csv = buildPolesCSV(poles, 'poleForeman');
    const [header, row] = csv.split('\n');
    expect(header).toBe('POLE_ID,POLE_HT_FT,CLASS,PRIMARY_HT_FT,Longitude,Latitude');
    expect(row).toBe('PF1,40,3,30,-80,40');
  });
});
