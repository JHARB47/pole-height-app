import { describe, it, expect } from 'vitest';
import { buildGeoJSON } from './geodata';

describe('geodata buildGeoJSON', () => {
  it('builds points and spans when coordinates exist', () => {
    const poles = [
      { id: 'A', latitude: 39.0, longitude: -80.0, height: 40, jobId: 'J1' },
      { id: 'B', latitude: 39.001, longitude: -80.001, height: 42, jobId: 'J1' }
    ];
    const spans = [{ id: 'S1', fromId: 'A', toId: 'B', length: 150 }];
    const fc = buildGeoJSON({ poles, spans, job: { id: 'J1' } });
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features.length).toBe(3);
    const point = fc.features.find(f => f.geometry.type === 'Point');
    expect(point.properties.id).toBe('A');
    const line = fc.features.find(f => f.geometry.type === 'LineString');
    expect(line.properties.id).toBe('S1');
  });
});
