import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildGeoJSON, exportKML, exportKMZ } from '../geodata';

// Mock tokml so that calling the default export throws, triggering fallback logic
vi.mock('tokml', () => ({ default: () => { throw new Error('tokml failure'); } }));

describe('KML/KMZ export fallbacks', () => {
  let createdAnchors = [];
  let originalCreate;
  let originalUrlCreate;

  beforeEach(() => {
    createdAnchors = [];
    originalCreate = document.createElement.bind(document);
    originalUrlCreate = URL.createObjectURL;
    URL.createObjectURL = () => {
      // minimal stub; return deterministic string
      return 'blob:stub';
    };
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreate(tag);
      if (tag === 'a') {
        Object.defineProperty(el, 'click', { value: () => {}, writable: false });
        const record = {};
        Object.defineProperty(el, 'download', {
          get() { return record.download; },
          set(v) { record.download = v; },
          configurable: true
        });
        createdAnchors.push(record);
      }
      return el;
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    URL.createObjectURL = originalUrlCreate;
  });

  it('falls back to GeoJSON for KML when tokml default throws', async () => {
    const fc = buildGeoJSON({ poles: [{ id: 'P1', latitude: 1, longitude: 2 }] });
    await exportKML(fc, 'sample.kml');
    const dl = createdAnchors.find(a => a.download && a.download.endsWith('.geojson'));
    expect(dl).toBeTruthy();
    expect(console.error).toHaveBeenCalled();
  });

  it('falls back to GeoJSON for KMZ when tokml default throws', async () => {
    const fc = buildGeoJSON({ poles: [{ id: 'P2', latitude: 3, longitude: 4 }] });
    await exportKMZ(fc, 'sample.kmz');
    const dl = createdAnchors.find(a => a.download && a.download.endsWith('.geojson'));
    expect(dl).toBeTruthy();
    expect(console.error).toHaveBeenCalled();
  });
});
