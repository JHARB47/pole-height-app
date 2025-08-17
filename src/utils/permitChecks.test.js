import { describe, it, expect } from 'vitest';
import { detectPermitIssues } from './permitChecks';

describe('detectPermitIssues', () => {
  it('flags missing core fields', () => {
    const issues = detectPermitIssues({});
    expect(issues).toContain('Missing job.name');
    expect(issues).toContain('Missing job.jobNumber');
    expect(issues).toContain('Missing job.applicant');
    expect(issues).toContain('Missing pole.heightFt');
    expect(issues).toContain('Missing power.heightFt');
    expect(issues).toContain('Missing pole GPS coordinates');
    expect(issues).toContain('Missing span.lengthFt');
    expect(issues).toContain('Missing span.midspanFt');
    expect(issues).toContain('Missing span.targetFt');
  });

  it('returns empty when all good', () => {
    const issues = detectPermitIssues({
      job: { name: 'J', jobNumber: '1', applicant: 'A' },
      pole: { heightFt: 40, gps: { lat: '1', lon: '2' } },
      power: { heightFt: '35ft 0in' },
      span: { lengthFt: 100, midspanFt: 18, targetFt: 18 },
      environment: 'road',
      profile: { envRoadFt: 18, minCommAttachFt: 12 },
      attach: { proposedFt: 12 },
    });
    expect(issues.length).toBe(0);
  });

  it('flags railroad under-target and computed clearance below req', () => {
    const issues = detectPermitIssues({
      job: { name: 'J', jobNumber: '1', applicant: 'A' },
      pole: { heightFt: 40, gps: { lat: '1', lon: '2' } },
      power: { heightFt: '35ft 0in' },
      environment: 'railroad',
      profile: { envRailroadFt: 27 },
      span: { lengthFt: 100, midspanFt: 26, targetFt: 26, computedGroundClearanceFt: 26 },
      attach: { proposedFt: 30 },
    });
    expect(issues).toEqual(expect.arrayContaining([
      'Railroad ground clearance target below 27 ft',
      'Computed ground clearance below 27 ft',
    ]));
  });

  it('flags WV Highway below 18 ft and interstate new crossing below 21 ft', () => {
    const i1 = detectPermitIssues({
      job: { name: 'J', jobNumber: '1', applicant: 'A' },
      pole: { heightFt: 40, gps: { lat: '1', lon: '2' } },
      power: { heightFt: '35ft 0in' },
      environment: 'wvHighway',
      span: { lengthFt: 100, midspanFt: 17.9, targetFt: 17.9, computedGroundClearanceFt: 17.9 },
    });
    expect(i1.join('\n')).toMatch(/18 ft/);

    const i2 = detectPermitIssues({
      job: { name: 'J', jobNumber: '1', applicant: 'A' },
      pole: { heightFt: 40, gps: { lat: '1', lon: '2' } },
      power: { heightFt: '35ft 0in' },
      environment: 'interstateNewCrossing',
      span: { lengthFt: 100, midspanFt: 20.5, targetFt: 20.5, computedGroundClearanceFt: 20.5 },
    });
    expect(i2.join('\n')).toMatch(/21 ft/);
  });

  it('flags PA/OH/MD highway below 18 ft by default and respects profile overrides', () => {
    const pa = detectPermitIssues({
      job: { name: 'J', jobNumber: '1', applicant: 'A' },
      pole: { heightFt: 40, gps: { lat: '1', lon: '2' } },
      power: { heightFt: '35ft 0in' },
      environment: 'paHighway',
      span: { lengthFt: 100, midspanFt: 17.5, targetFt: 17.5, computedGroundClearanceFt: 17.5 },
    });
    expect(pa.join('\n')).toMatch(/18 ft/);

    const oh = detectPermitIssues({
      job: { name: 'J', jobNumber: '1', applicant: 'A' },
      pole: { heightFt: 40, gps: { lat: '1', lon: '2' } },
      power: { heightFt: '35ft 0in' },
      environment: 'ohHighway',
      profile: { envOHHighwayFt: 19 },
      span: { lengthFt: 100, midspanFt: 18.9, targetFt: 18.9, computedGroundClearanceFt: 18.9 },
    });
    expect(oh.join('\n')).toMatch(/19 ft/);

    const md = detectPermitIssues({
      job: { name: 'J', jobNumber: '1', applicant: 'A' },
      pole: { heightFt: 40, gps: { lat: '1', lon: '2' } },
      power: { heightFt: '35ft 0in' },
      environment: 'mdHighway',
      profile: { envMDHighwayFt: 18 },
      span: { lengthFt: 100, midspanFt: 17.99, targetFt: 17.99, computedGroundClearanceFt: 17.99 },
    });
    expect(md.join('\n')).toMatch(/18 ft/);
  });

  it('flags attach below minCommAttachFt', () => {
    const issues = detectPermitIssues({
      job: { name: 'J', jobNumber: '1', applicant: 'A' },
      pole: { heightFt: 40, gps: { lat: '1', lon: '2' } },
      power: { heightFt: '35ft 0in' },
      environment: 'road',
      profile: { minCommAttachFt: 12 },
      attach: { proposedFt: 11.5 },
      span: { lengthFt: 50, midspanFt: 15, targetFt: 15 },
    });
    expect(issues.join('\n')).toMatch(/below minimum 12 ft/);
  });
});
