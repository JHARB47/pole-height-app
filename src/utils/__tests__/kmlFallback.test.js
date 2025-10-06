import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildGeoJSON, exportKML, exportKMZ } from "../geodata";

// Mock tokml so that calling the default export throws, triggering fallback logic
vi.mock("tokml", () => ({
  default: () => {
    throw new Error("tokml failure");
  },
}));

describe("KML/KMZ export fallbacks", () => {
  /** @type {Array<{ download?: string }>} */
  let createdAnchors = [];
  /** @type {typeof document.createElement} */
  let originalCreate;
  /** @type {typeof URL.createObjectURL} */
  let originalUrlCreate;
  /** @type {typeof URL.revokeObjectURL | undefined} */
  let originalUrlRevoke;

  beforeEach(() => {
    createdAnchors = [];
    originalCreate = document.createElement.bind(document);
    originalUrlCreate = URL.createObjectURL;
    originalUrlRevoke = URL.revokeObjectURL;
    URL.createObjectURL = () => "blob:stub";
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = originalCreate(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", {
          value: () => {},
          writable: false,
        });
        /** @type {{ download?: string }} */
        const record = {};
        Object.defineProperty(el, "download", {
          get() {
            return record.download;
          },
          set(v) {
            record.download = v;
          },
          configurable: true,
        });
        createdAnchors.push(record);
      }
      return el;
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    URL.createObjectURL = originalUrlCreate;
    URL.revokeObjectURL = originalUrlRevoke ?? (() => {});
  });

  it("falls back to GeoJSON for KML when tokml default throws", async () => {
    const fc = buildGeoJSON({
      poles: [{ id: "P1", latitude: 1, longitude: 2 }],
    });
    await exportKML(fc, "sample.kml");
    const dl = createdAnchors.find(
      (anchor) => anchor.download && anchor.download.endsWith(".geojson"),
    );
    expect(dl).toBeTruthy();
    expect(console.error).toHaveBeenCalled();
  });

  it("falls back to GeoJSON for KMZ when tokml default throws", async () => {
    const fc = buildGeoJSON({
      poles: [{ id: "P2", latitude: 3, longitude: 4 }],
    });
    await exportKMZ(fc, "sample.kmz");
    const dl = createdAnchors.find(
      (anchor) => anchor.download && anchor.download.endsWith(".geojson"),
    );
    expect(dl).toBeTruthy();
    expect(console.error).toHaveBeenCalled();
  });
});
