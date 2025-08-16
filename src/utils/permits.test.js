import { describe, it, expect } from 'vitest';

// Lazy import to avoid bundling heavy deps in test startup
async function builders() {
  const m = await import('./permits.js');
  return m;
}

const mockSummary = {
  type: 'WVDOH MM109',
  job: { id: '1', name: 'Test Job', applicant: 'ACME', jobNumber: 'J-123', owner: 'Mon Power' },
  profile: { name: 'firstEnergy', label: 'FirstEnergy / Mon Power' },
  environment: 'wvHighway',
  pole: { heightFt: 40, class: 'Class 4', gps: { lat: '39.000000', lon: '-80.000000' } },
  power: { voltage: 'distribution', heightFt: '35ft 0in' },
  span: { lengthFt: 150, midspanFt: 20, targetFt: 18 },
  attach: { proposedFt: 22, basis: 'Power Clearance', detail: '40 in below lowest power' },
};

describe('permit pdf builders', () => {
  it('builds MM109 draft PDF bytes', async () => {
    const { buildMM109PDF } = await builders();
    const bytes = await buildMM109PDF(mockSummary);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it('builds CSX draft PDF bytes', async () => {
    const { buildCSXPDF } = await builders();
    const bytes = await buildCSXPDF({ ...mockSummary, type: 'CSX Railroad Crossing', environment: 'railroad' });
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(1000);
  });
});
