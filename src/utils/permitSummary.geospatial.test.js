import { describe, it, expect } from 'vitest';
import { makePermitSummary } from './permitSummary';

describe('makePermitSummary geospatial', () => {
  it('includes midspan and endpoints from controlling cached midspan', () => {
    const env = 'wvHighway';
    const results = { span: { spanFt: 100, midspanFt: 15 }, attach: { proposedAttachFt: 20, recommendation: {} }, clearances: { groundClearance: 18 } };
    const job = { id: 'J', name: 'Job' };
    const profile = {};
    const store = { projectName: 'Job', applicantName: 'A', jobNumber: '1', jobOwner: 'Owner', poleHeight: 40, poleClass: 'C4', poleLatitude: '39', poleLongitude: '-80', existingPowerVoltage: 'distribution', existingPowerHeight: '30' };
    const cachedMidspans = [
      { environment: 'wvHighway', targetFt: 19, spanId: 's1', midLat: 39.001, midLon: -80.001, fromId: 'A', toId: 'B', fromLat: 39.0, fromLon: -80.0, toLat: 39.002, toLon: -80.002 },
      { environment: 'wvHighway', targetFt: 21, spanId: 's2', midLat: 39.01, midLon: -80.01, fromId: 'X', toId: 'Y', fromLat: 39.01, fromLon: -80.02, toLat: 39.02, toLon: -80.03 },
    ];
    const s = makePermitSummary({ env, results, job, effectiveProfile: profile, cachedMidspans, store });
    expect(s.span.targetFt).toBe(21);
    expect(s.span.midLatitude).toBe(39.01);
    expect(s.span.midLongitude).toBe(-80.01);
    expect(s.span.endpoints.from.id).toBe('X');
    expect(s.span.endpoints.to.id).toBe('Y');
    expect(s.span.endpoints.from.latitude).toBe(39.01);
    expect(s.span.endpoints.to.longitude).toBe(-80.03);
  });
});
