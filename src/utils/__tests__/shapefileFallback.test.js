import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildGeoJSON, exportShapefile } from '../geodata';

function mockFailingCDN() {
  const originalCreate = document.createElement;
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    const el = originalCreate.call(document, tag);
    if (tag === 'script') {
      setTimeout(() => {
        if (el.onerror) el.onerror(new Event('error'));
      }, 0);
    }
    return el;
  });
}

describe('exportShapefile fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // @ts-ignore
    delete window.shpwrite;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns GeoJSON blob when CDN load fails', async () => {
    mockFailingCDN();
    const fc = buildGeoJSON({ poles: [{ id: 'P1', latitude: 10, longitude: 20 }] });
    const blob = await exportShapefile(fc, 'test.zip', false);
    expect(blob).toBeInstanceOf(Blob);
    const text = await blob.text();
    const parsed = JSON.parse(text);
    expect(parsed.type).toBe('FeatureCollection');
    expect(parsed.features.length).toBe(1);
  });
});
