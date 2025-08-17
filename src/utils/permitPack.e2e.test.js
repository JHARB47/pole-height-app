import { describe, it, expect } from 'vitest';

// Build a minimal permit ZIP using the same summary + PDF + fields builders used by the UI
import JSZip from 'jszip';

async function loadBuilders() {
  const { makePermitSummary } = await import('./permitSummary.js');
  const { buildMM109PDF, buildCSXPDF } = await import('./permits.js');
  const { buildMM109Fields, buildCSXFields } = await import('./formFields.js');
  return { makePermitSummary, buildMM109PDF, buildCSXPDF, buildMM109Fields, buildCSXFields };
}

function makeMockContext(overrides = {}) {
  const env = overrides.env || 'wvHighway';
  const job = overrides.job || {
    id: 'job-1',
    name: 'Sample Job',
    applicantName: 'ACME Fiber',
    jobNumber: 'J-100',
    jobOwner: 'Mon Power',
    commCompany: 'ACME Fiber',
    submissionProfileName: 'firstEnergy',
  };
  const store = overrides.store || {
    projectName: job.name,
    applicantName: job.applicantName,
    jobNumber: job.jobNumber,
    jobOwner: job.jobOwner,
    poleHeight: 40,
    poleClass: 'Class 4',
    poleLatitude: '39.000000',
    poleLongitude: '-80.000000',
    existingPowerVoltage: 'distribution',
    existingPowerHeight: '35ft 0in',
  };
  const results = overrides.results || {
    pole: { inputHeight: 40 },
    attach: { proposedAttachFt: 22, recommendation: { basis: 'Power Clearance', detail: '40 in below lowest power' } },
    span: { spanFt: 150, midspanFt: 20 },
    clearances: { groundClearance: 18, roadClearance: 16, minimumPoleTopSpace: 3 },
  };
  const effectiveProfile = overrides.effectiveProfile || { name: 'firstEnergy', label: 'FirstEnergy / Mon Power', manifestType: 'FE-Standard' };
  const cachedMidspans = overrides.cachedMidspans || [];
  return { env, job, store, results, effectiveProfile, cachedMidspans };
}

describe('permit pack generation (e2e-lite)', () => {
  it('builds WV Highway permit pack ZIP with expected files and values (cached target)', async () => {
    const { makePermitSummary, buildMM109PDF, buildMM109Fields } = await loadBuilders();
    const { env, job, store, results, effectiveProfile } = makeMockContext({ env: 'wvHighway' });
    const cachedMidspans = [
      { environment: 'wvHighway', targetFt: 19, spanId: 's1', spanFt: 140, midspanFt: 18, attachFt: 22, segments: [{ env: 'road', portion: '50%' }] },
      { environment: 'wvHighway', targetFt: 21, spanId: 's2', spanFt: 160, midspanFt: 20, attachFt: 22, segments: [{ env: 'road', portion: '100%' }] },
    ];

    const summary = makePermitSummary({ env, results, job, effectiveProfile, cachedMidspans, store });
    expect(summary.type).toBe('WVDOH MM109');
    expect(summary.span.targetSource).toBe('cachedMidspans');
    expect(summary.span.targetFt).toBe(21);
    expect(summary.job.submissionProfileName).toBe('firstEnergy');

    const fields = buildMM109Fields(summary);
    expect(fields.applicant).toBe('ACME Fiber');
    expect(fields.targetGroundClearanceFt).toBe(21);
    expect(fields.environment).toBe('wvHighway');

    const pdf = await buildMM109PDF(summary);
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(1000);

    // Build ZIP
    const zip = new JSZip();
    zip.file('permit/summary.json', JSON.stringify(summary, null, 2));
    zip.file('permit/fields.json', JSON.stringify(fields, null, 2));
    // cached midspans CSV
    const rows = [['spanId','environment','spanFt','midspanFt','targetFt','attachFt','segments']];
    for (const m of cachedMidspans) {
      rows.push([
        m.spanId ?? '', m.environment ?? '', m.spanFt ?? '', m.midspanFt ?? '', m.targetFt ?? '', m.attachFt ?? '',
        Array.isArray(m.segments) ? m.segments.map(x=>`${x.env}:${x.portion || ''}`).join('|') : '',
      ]);
    }
    const csv = rows.map(r => r.map(v => String(v).replaceAll('"','""')).map(v => v.includes(',') ? `"${v}"` : v).join(',')).join('\n');
    zip.file('permit/cached-midspans.csv', csv);
    // simple placeholders to keep scope minimal yet realistic
    zip.file('permit/plan-profile.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>' );
    zip.file('permit/README.txt', `Type: ${summary.type}\nEnvironment: ${env}`);
    zip.file('permit/checklist.txt', '# Pre-submission Checklist');
    zip.file('permit/mm109-draft.pdf', pdf);

    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    const unzip = await JSZip.loadAsync(buf);
    const files = Object.keys(unzip.files).sort();
    expect(files).toEqual(expect.arrayContaining([
      'permit/summary.json',
      'permit/fields.json',
      'permit/cached-midspans.csv',
      'permit/plan-profile.svg',
      'permit/README.txt',
      'permit/checklist.txt',
      'permit/mm109-draft.pdf',
    ]));

    // Validate summary and fields when read back
    const summaryStr = await unzip.file('permit/summary.json').async('string');
    const parsedSummary = JSON.parse(summaryStr);
    expect(parsedSummary.span.targetFt).toBe(21);
    const fieldsStr = await unzip.file('permit/fields.json').async('string');
    const parsedFields = JSON.parse(fieldsStr);
    expect(parsedFields.targetGroundClearanceFt).toBe(21);
  });

  it('builds Railroad permit pack ZIP and falls back to computed target when no cache', async () => {
    const { makePermitSummary, buildCSXPDF, buildCSXFields } = await loadBuilders();
    const results = { pole: { inputHeight: 45 }, attach: { proposedAttachFt: 24 }, span: { spanFt: 180, midspanFt: 22 }, clearances: { groundClearance: 27 } };
    const { job, store, effectiveProfile } = makeMockContext({});
    const env = 'railroad';
    const cachedMidspans = []; // none

    const summary = makePermitSummary({ env, results, job, effectiveProfile, cachedMidspans, store });
    expect(summary.type).toBe('CSX Railroad Crossing');
    expect(summary.span.targetSource).toBe('computed');
    expect(summary.span.targetFt).toBe(27);

    const fields = buildCSXFields(summary);
    expect(fields.crossingType).toBe('railroad');

    const pdf = await buildCSXPDF(summary);
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(1000);

    const zip = new JSZip();
    zip.file('permit/summary.json', JSON.stringify(summary));
    zip.file('permit/fields.json', JSON.stringify(fields));
    zip.file('permit/railroad-draft.pdf', pdf);
    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    const unzip = await JSZip.loadAsync(buf);
    expect(Object.keys(unzip.files)).toEqual(expect.arrayContaining(['permit/summary.json','permit/fields.json','permit/railroad-draft.pdf']));
  });
});
