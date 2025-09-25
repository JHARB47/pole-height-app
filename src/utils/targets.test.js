import { describe, it, expect } from 'vitest';
import { getEnvTarget, controllingGroundTarget, maxTargetFromCached } from './targets';
import { parsePolesCSVValidated, parseSpansCSVValidated } from './importers';
import { parsePolesCSVValidated, parseSpansCSVValidated } from './importers';

const profile = {
  envRoadFt: 15,
  envResidentialFt: 15.5,
  envPedestrianFt: 10,
  envFieldFt: 15,
  envResidentialYardFt: 15,
  envResidentialDrivewayFt: 15.5,
  envNonResidentialDrivewayFt: 16.5,
  envWaterwayFt: 17,
  envWVHighwayFt: 18,
  envInterstateFt: 18,
  envInterstateNewCrossingFt: 20,
  envRailroadFt: 27,
};

describe('targets utils', () => {
  it('getEnvTarget returns exact target for known envs', () => {
    expect(getEnvTarget(profile, 'road')).toBe(15);
    expect(getEnvTarget(profile, 'interstateNewCrossing')).toBe(20);
    expect(getEnvTarget(profile, 'railroad')).toBe(27);
  });

  it('controllingGroundTarget falls back to fallback env when no segments', () => {
    expect(controllingGroundTarget(profile, [], 'interstate')).toBe(18);
  });

  it('controllingGroundTarget returns max across segments', () => {
    const segs = [
      { env: 'road', portion: 40 },
      { env: 'nonResidentialDriveway', portion: 60 },
    ];
    expect(controllingGroundTarget(profile, segs, 'road')).toBe(16.5);
  });

  it('maxTargetFromCached falls back to env target when no cached entries', () => {
    expect(maxTargetFromCached([], 'interstateNewCrossing', profile)).toBe(20);
  });

  it('maxTargetFromCached returns max target for matching env', () => {
    const cached = [
      { environment: 'wvHighway', targetFt: 18 },
      { environment: 'wvHighway', targetFt: 19 },
      { environment: 'road', targetFt: 17 },
    ];
    expect(maxTargetFromCached(cached, 'wvHighway', profile)).toBe(19);
  });
  
  it('validation helpers provide structure (poles/spans) - extended', async () => {
    const POLES_CSV = `id,height,class,xfmr,latitude,longitude\nP1,40,3,yes,40.1,-80.1`;
    const SPANS_CSV = `id,from_id,to_id,length,attach\nS1,P1,P2,150,18`;
    const poles = await parsePolesCSVValidated(POLES_CSV, { id: 'id', height: 'height', class: 'class', hasTransformer: 'xfmr', latitude: 'latitude', longitude: 'longitude' });
    const spans = await parseSpansCSVValidated(SPANS_CSV, { id: 'id', fromId: 'from_id', toId: 'to_id', length: 'length', proposedAttach: 'attach' });
    expect(Array.isArray(poles.data)).toBe(true);
    expect(Array.isArray(spans.data)).toBe(true);
    expect(poles).toHaveProperty('errors');
    expect(spans).toHaveProperty('errors');
  });

  it('validation helpers return structure (poles/spans)', async () => {
    const POLES_CSV = `id,height,class,xfmr,latitude,longitude\nP1,40,3,yes,40.1,-80.1`;
    const SPANS_CSV = `id,from_id,to_id,length,attach\nS1,P1,P2,150,18`;
    const poles = await parsePolesCSVValidated(POLES_CSV, { id: 'id', height: 'height', class: 'class', hasTransformer: 'xfmr', latitude: 'latitude', longitude: 'longitude' });
    const spans = await parseSpansCSVValidated(SPANS_CSV, { id: 'id', fromId: 'from_id', toId: 'to_id', length: 'length', proposedAttach: 'attach' });
    expect(Array.isArray(poles.data)).toBe(true);
    expect(Array.isArray(spans.data)).toBe(true);
    expect(poles).toHaveProperty('errors');
    expect(spans).toHaveProperty('errors');
  });
});
