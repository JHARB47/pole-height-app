import { describe, it, expect } from 'vitest';
import { parsePolesCSV, parseSpansCSV, parseExistingLinesCSV } from './importers.js';

describe('CSV parsers integration with numeric coercion', () => {
  it('parses poles with various numeric formats', () => {
    const csv = `id,height,power_ht,latitude,longitude\nA,40 ft,18,40.1°, -80.2\nB,12'6",10, , \nC,1,234.56,1,234.5, -79,5`;
    const rows = parsePolesCSV(csv, { id: 'id', height: 'height', powerHeight: 'power_ht', latitude: 'latitude', longitude: 'longitude' });
    expect(rows[0].height).toBe(40);
    expect(rows[0].powerHeight).toBe(18);
    expect(rows[0].latitude).toBe(40.1);
    expect(rows[0].longitude).toBe(-80.2);
    expect(rows[1].height).toBeCloseTo(12.5, 6);
    expect(rows[2].height).toBe(1234.56);
    expect(rows[2].latitude).toBe(1234.5);
    expect(rows[2].longitude).toBe(-79.5);
  });

  it('parses spans with locale decimals and units', () => {
    const csv = `id,length,attach,from_id,to_id\nS1,1.234,56,15 ft,F1,T1`;
    const rows = parseSpansCSV(csv, { id: 'id', length: 'length', proposedAttach: 'attach', fromId: 'from_id', toId: 'to_id' });
    expect(rows[0].length).toBe(1234.56);
    expect(rows[0].proposedAttach).toBe(15);
  });

  it('parses existing lines with messy height values', () => {
    const csv = `type,height,company,makeReady,makeReadyHeight\ncommunication,40.1°,Foo,yes,20\n,12'6",Bar,no,`;
    const rows = parseExistingLinesCSV(csv, { type: 'type', height: 'height', company: 'company', makeReady: 'makeReady', makeReadyHeight: 'makeReadyHeight' });
    expect(rows[0].height).toBe('40.1');
    expect(rows[0].makeReady).toBe(true);
    expect(rows[1].height).toBe('12.5');
  });
});
