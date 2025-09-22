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
  if (!point) throw new Error('point feature missing');
  expect(point.properties.id).toBe('A');
  const line = fc.features.find(f => f.geometry.type === 'LineString');
  if (!line) throw new Error('line feature missing');
  expect(line.properties.id).toBe('S1');
  });

  it('includes bearings and PULL properties when provided', () => {
    const poles = [
      {
        id: 'P1',
        latitude: 34.1,
        longitude: -118.2,
        incomingBearingDeg: 10,
        outgoingBearingDeg: 40,
        PULL_ft: 12.34,
      },
      { id: 'P2', latitude: 34.2, longitude: -118.25 },
    ];
    const spans = [
      {
        id: 'S2',
        fromId: 'P1',
        toId: 'P2',
        incomingBearingDeg: 123,
        outgoingBearingDeg: 234,
        PULL_ft: 56,
      },
    ];
    const fc = buildGeoJSON({ poles, spans, job: { id: 'J2' } });
  const p = fc.features.find(f => f.geometry.type === 'Point' && f.properties.id === 'P1');
  if (!p) throw new Error('P1 point not found');
  // Cast to any for flexible property assertions
  const pp = /** @type {any} */ (p);
  expect(pp.properties.incomingBearingDeg).toBe(10);
  expect(pp.properties.outgoingBearingDeg).toBe(40);
  expect(pp.properties.PULL_ft).toBe(12.34);

    const s = fc.features.find(f => f.geometry.type === 'LineString' && f.properties.id === 'S2');
    if (!s) throw new Error('S2 span not found');
    const ss = /** @type {any} */ (s);
    expect(ss.properties.incomingBearingDeg).toBe(123);
    expect(ss.properties.outgoingBearingDeg).toBe(234);
    expect(ss.properties.PULL_ft).toBe(56);
  });
});
