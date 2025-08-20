import { describe, it, expect, vi } from 'vitest';
import * as importers from './importers.js';

describe('importers optional shapefile + geometry utils', () => {
  it('hasShapefileImportSupport returns false when module is missing', async () => {
    const spy = vi.spyOn(importers, 'dynamicImportOptional').mockResolvedValue(null);
    try {
      const has = await importers.hasShapefileImportSupport();
      expect(has).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  it('parseShapefile throws guided error when module is missing', async () => {
    const spy = vi.spyOn(importers, 'dynamicImportOptional').mockResolvedValue(null);
    const fakeFile = { name: 'shapes.zip', arrayBuffer: async () => new ArrayBuffer(0) };
    await expect(importers.parseShapefile(fakeFile)).rejects.toThrow(/requires optional dependency\s+"shpjs"/i);
    spy.mockRestore();
  });

  it('mapGeoJSONToAppData estimates length while ignoring invalid coordinates', () => {
    const fc = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            // first pair invalid -> ignored, second pair valid -> contributes positive length
            coordinates: [
              [NaN, NaN],
              [-80, 40],
              [-80.0005, 40.0005],
            ],
          },
          properties: {},
        },
      ],
    };
    const res = importers.mapGeoJSONToAppData(fc, {});
    expect(Array.isArray(res.spanTable)).toBe(true);
    expect(res.spanTable.length).toBe(1);
    expect(res.spanTable[0].length).toBeGreaterThan(0);
  });
});
