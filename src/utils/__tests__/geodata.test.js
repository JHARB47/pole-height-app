import { describe, it, expect } from 'vitest';
import { buildGeoJSON } from '../geodata';

describe('buildGeoJSON exports', () => {
  it('includes bearings and PULL on pole features', () => {
    const poles = [
      {
        id: 'p1',
        latitude: 34.1,
        longitude: -118.2,
        incomingBearingDeg: 10,
        outgoingBearingDeg: 40,
        PULL_ft: 12.34,
      },
    ];
    const fc = buildGeoJSON({ poles, spans: [], job: { id: 'job-1' } });
    expect(fc.features).toHaveLength(1);
    const f = fc.features[0];
    expect(f.geometry.type).toBe('Point');
    // @ts-ignore dynamic properties
    expect(f.properties.incomingBearingDeg).toBe(10);
    // @ts-ignore dynamic properties
    expect(f.properties.outgoingBearingDeg).toBe(40);
    // @ts-ignore dynamic properties
    expect(f.properties.PULL_ft).toBe(12.34);
  });

  it('includes bearings and PULL on span features when present', () => {
    const poles = [
      { id: 'a', latitude: 34.1, longitude: -118.2 },
      { id: 'b', latitude: 34.2, longitude: -118.25 },
    ];
    const spans = [
      {
        id: 's1',
        fromId: 'a',
        toId: 'b',
        incomingBearingDeg: 123,
        outgoingBearingDeg: 234,
        PULL_ft: 56,
      },
    ];
    const fc = buildGeoJSON({ poles, spans, job: { id: 'job-2' } });
    const spanFeature = fc.features.find((g) => g.geometry.type === 'LineString');
    expect(spanFeature).toBeTruthy();
    if (!spanFeature) throw new Error('LineString feature missing');
    // @ts-ignore dynamic properties
    expect(spanFeature.properties.incomingBearingDeg).toBe(123);
    // @ts-ignore dynamic properties
    expect(spanFeature.properties.outgoingBearingDeg).toBe(234);
    // @ts-ignore dynamic properties
    expect(spanFeature.properties.PULL_ft).toBe(56);
  });
});
import { describe, it, expect } from 'vitest';
import { buildGeoJSON } from '../geodata';

describe('buildGeoJSON exports', () => {
  it('includes bearings and PULL on pole features', () => {
    const poles = [
      {
        id: 'p1',
        latitude: 34.1,
        longitude: -118.2,
        incomingBearingDeg: 10,
        outgoingBearingDeg: 40,
        PULL_ft: 12.34,
      },
    ];
    const fc = buildGeoJSON({ poles, spans: [], job: { id: 'job-1' } });
    expect(fc.features).toHaveLength(1);
    const f = fc.features[0];
    expect(f.geometry.type).toBe('Point');
    expect(f.properties.incomingBearingDeg).toBe(10);
    expect(f.properties.outgoingBearingDeg).toBe(40);
    expect(f.properties.PULL_ft).toBe(12.34);
  });

  it('includes bearings and PULL on span features when present', () => {
    const poles = [
      { id: 'a', latitude: 34.1, longitude: -118.2 },
      { id: 'b', latitude: 34.2, longitude: -118.25 },
    ];
    const spans = [
      {
        id: 's1',
        fromId: 'a',
        toId: 'b',
        incomingBearingDeg: 123,
        outgoingBearingDeg: 234,
        PULL_ft: 56,
      },
    ];
    const fc = buildGeoJSON({ poles, spans, job: { id: 'job-2' } });
    const spanFeature = fc.features.find((g) => g.geometry.type === 'LineString');
    expect(spanFeature).toBeTruthy();
    // @ts-ignore dynamic properties
    expect(spanFeature.properties.incomingBearingDeg).toBe(123);
    // @ts-ignore dynamic properties
    expect(spanFeature.properties.outgoingBearingDeg).toBe(234);
    // @ts-ignore dynamic properties
    expect(spanFeature.properties.PULL_ft).toBe(56);
  });
});