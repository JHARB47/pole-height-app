import { describe, it, expect } from 'vitest';
import { parsePolesCSV, parseSpansCSV, parseExistingLinesCSV, parsePolesCSVValidated, parseSpansCSVValidated } from './importers';

describe('CSV parsers', () => {
  it('parses poles CSV with defaults and mapping', () => {
    const csv = [
      'id,height,class,power_ht,xfmr,latitude,longitude',
      'P1,35,4,28,yes,40.1,-80.2',
      'P2,40,3,30,no,40.2,-80.3',
    ].join('\n');
    const mapping = { id: 'id', height: 'height', class: 'class', powerHeight: 'power_ht', hasTransformer: 'xfmr', latitude: 'latitude', longitude: 'longitude' };
    const out = parsePolesCSV(csv, mapping);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ id: 'P1', height: 35, class: '4', powerHeight: 28, hasTransformer: true, latitude: 40.1, longitude: -80.2 });
    expect(out[1]).toMatchObject({ id: 'P2', height: 40, class: '3', powerHeight: 30, hasTransformer: false, latitude: 40.2, longitude: -80.3 });
  });

  it('parses spans CSV with defaults and mapping', () => {
    const csv = [
      'id,from_id,to_id,length,attach',
      'S1,P1,P2,150,18',
      'S2,P2,P3,,16',
    ].join('\n');
    const mapping = { id: 'id', fromId: 'from_id', toId: 'to_id', length: 'length', proposedAttach: 'attach' };
    const out = parseSpansCSV(csv, mapping);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ id: 'S1', fromId: 'P1', toId: 'P2', length: 150, proposedAttach: 18 });
    expect(out[1]).toMatchObject({ id: 'S2', fromId: 'P2', toId: 'P3', length: undefined, proposedAttach: 16 });
  });

  it('parses existing lines CSV with mapping', () => {
    const csv = [
      'type,height,company,makeReady,makeReadyHeight',
      'communication,14,ISP,yes,15',
      'neutral,22,Utility,no,',
    ].join('\n');
    const mapping = { type: 'type', height: 'height', company: 'company', makeReady: 'makeReady', makeReadyHeight: 'makeReadyHeight' };
    const out = parseExistingLinesCSV(csv, mapping);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ type: 'communication', height: '14', companyName: 'ISP', makeReady: true, makeReadyHeight: '15' });
    expect(out[1]).toMatchObject({ type: 'neutral', height: '22', companyName: 'Utility', makeReady: false, makeReadyHeight: '' });
  });
  it('validated wrappers return {data, errors}', async () => {
    const polesCsv = 'id,height\nP1,35\nP2,notnum';
    const spansCsv = 'id,from_id,to_id,length,attach\nS1,P1,P2,150,18\nS2,P2,P3,notnum,16';
    const poleRes = await parsePolesCSVValidated(polesCsv, { id: 'id', height: 'height' });
    const spanRes = await parseSpansCSVValidated(spansCsv, { id: 'id', fromId: 'from_id', toId: 'to_id', length: 'length', proposedAttach: 'attach' });
    expect(poleRes).toHaveProperty('data');
    expect(poleRes).toHaveProperty('errors');
    expect(spanRes).toHaveProperty('data');
    expect(spanRes).toHaveProperty('errors');
    expect(Array.isArray(poleRes.data)).toBe(true);
    expect(Array.isArray(spanRes.data)).toBe(true);
  });
});
