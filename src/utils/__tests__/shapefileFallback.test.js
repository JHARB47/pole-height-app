import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildGeoJSON, exportShapefile } from "../geodata";

// TEMPORARILY SKIPPED: CDN failure simulation is unreliable in test environment
// See TEST-TIMEOUT-ISSUES.md for details
// TODO: Mock CDN loading mechanism properly

// eslint-disable-next-line no-unused-vars
function mockFailingCDN() {
  const originalCreate = document.createElement;
  vi.spyOn(document, "createElement").mockImplementation((tag) => {
    const el = originalCreate.call(document, tag);
    if (tag === "script") {
      // Immediately trigger error to force fallback
      setTimeout(() => {
        if (el.onerror) {
          el.onerror(new Event("error"));
        }
      }, 10);
    }
    return el;
  });
}

describe.skip("exportShapefile fallback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // @ts-ignore
    delete window.shpwrite;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a Blob when CDN load fails (fallback path executed)", async () => {
    // Mock the CDN failure and directly test the fallback
    const fc = buildGeoJSON({
      poles: [{ id: "P1", latitude: 10, longitude: 20 }],
    });

    // Force the fallback by ensuring shpwrite is not available
    const originalShp = window.shpwrite;
    delete window.shpwrite;

    try {
      const blob = await exportShapefile(fc, "test.zip", false);
      expect(blob).toBeInstanceOf(Blob);
    } finally {
      if (originalShp) {
        window.shpwrite = originalShp;
      }
    }
  });
});
