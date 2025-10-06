/**
 * Tests for GIS/GPS Validation
 */
import { describe, it, expect } from "vitest";
import {
  validateLatitude,
  validateLongitude,
  validateCoordinates,
  validatePointGeometry,
  validateLineStringGeometry,
  validateGeoJSONFeature,
  calculateDistance,
  validateDistanceBetweenPoints,
  validatePoleCoordinates,
  validatePoleBatch,
} from "../gisValidation.js";

describe("GIS Validation", () => {
  describe("validateLatitude", () => {
    it("accepts valid latitudes", () => {
      expect(validateLatitude(0)).toEqual({ valid: true, value: 0 });
      expect(validateLatitude(45.5)).toEqual({ valid: true, value: 45.5 });
      expect(validateLatitude(-45.5)).toEqual({ valid: true, value: -45.5 });
      expect(validateLatitude(90)).toEqual({ valid: true, value: 90 });
      expect(validateLatitude(-90)).toEqual({ valid: true, value: -90 });
      expect(validateLatitude("45.5")).toEqual({ valid: true, value: 45.5 });
    });

    it("rejects invalid latitudes", () => {
      expect(validateLatitude(91).valid).toBe(false);
      expect(validateLatitude(-91).valid).toBe(false);
      expect(validateLatitude("invalid").valid).toBe(false);
      expect(validateLatitude(NaN).valid).toBe(false);
    });
  });

  describe("validateLongitude", () => {
    it("accepts valid longitudes", () => {
      expect(validateLongitude(0)).toEqual({ valid: true, value: 0 });
      expect(validateLongitude(100.5)).toEqual({ valid: true, value: 100.5 });
      expect(validateLongitude(-100.5)).toEqual({ valid: true, value: -100.5 });
      expect(validateLongitude(180)).toEqual({ valid: true, value: 180 });
      expect(validateLongitude(-180)).toEqual({ valid: true, value: -180 });
      expect(validateLongitude("100.5")).toEqual({ valid: true, value: 100.5 });
    });

    it("rejects invalid longitudes", () => {
      expect(validateLongitude(181).valid).toBe(false);
      expect(validateLongitude(-181).valid).toBe(false);
      expect(validateLongitude("invalid").valid).toBe(false);
      expect(validateLongitude(NaN).valid).toBe(false);
    });
  });

  describe("validateCoordinates", () => {
    it("validates valid coordinate pairs", () => {
      const result = validateCoordinates(45.5, -122.6);
      expect(result.valid).toBe(true);
      expect(result.coordinates).toEqual([-122.6, 45.5]); // GeoJSON format
    });

    it("rejects invalid coordinate pairs", () => {
      const result1 = validateCoordinates(91, -122.6);
      expect(result1.valid).toBe(false);
      expect(result1.errors).toHaveLength(1);

      const result2 = validateCoordinates(45.5, 181);
      expect(result2.valid).toBe(false);
      expect(result2.errors).toHaveLength(1);

      const result3 = validateCoordinates(91, 181);
      expect(result3.valid).toBe(false);
      expect(result3.errors).toHaveLength(2);
    });
  });

  describe("validatePointGeometry", () => {
    it("validates valid Point geometry", () => {
      const point = {
        type: "Point",
        coordinates: [-122.6, 45.5],
      };
      const result = validatePointGeometry(point);
      expect(result.valid).toBe(true);
      expect(result.geometry).toEqual(point);
    });

    it("rejects invalid Point geometry", () => {
      expect(validatePointGeometry(null).valid).toBe(false);
      expect(validatePointGeometry({ type: "LineString" }).valid).toBe(false);
      expect(
        validatePointGeometry({ type: "Point", coordinates: [1] }).valid,
      ).toBe(false);
      expect(
        validatePointGeometry({ type: "Point", coordinates: [181, 45] }).valid,
      ).toBe(false);
    });
  });

  describe("validateLineStringGeometry", () => {
    it("validates valid LineString geometry", () => {
      const lineString = {
        type: "LineString",
        coordinates: [
          [-122.6, 45.5],
          [-122.5, 45.6],
        ],
      };
      const result = validateLineStringGeometry(lineString);
      expect(result.valid).toBe(true);
      expect(result.geometry.coordinates).toHaveLength(2);
    });

    it("rejects LineString with less than 2 points", () => {
      const lineString = {
        type: "LineString",
        coordinates: [[-122.6, 45.5]],
      };
      expect(validateLineStringGeometry(lineString).valid).toBe(false);
    });

    it("rejects LineString with invalid coordinates", () => {
      const lineString = {
        type: "LineString",
        coordinates: [
          [-122.6, 45.5],
          [181, 45.6], // Invalid longitude
        ],
      };
      expect(validateLineStringGeometry(lineString).valid).toBe(false);
    });
  });

  describe("validateGeoJSONFeature", () => {
    it("validates valid Feature", () => {
      const feature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [-122.6, 45.5],
        },
        properties: { name: "Test Pole" },
      };
      const result = validateGeoJSONFeature(feature);
      expect(result.valid).toBe(true);
    });

    it("rejects invalid Feature", () => {
      expect(validateGeoJSONFeature(null).valid).toBe(false);
      expect(validateGeoJSONFeature({ type: "Point" }).valid).toBe(false);
      expect(validateGeoJSONFeature({ type: "Feature" }).valid).toBe(false);
    });
  });

  describe("calculateDistance", () => {
    it("calculates distance between coordinates", () => {
      // Portland, OR to Seattle, WA (approximately 233 km)
      const portland = [-122.6765, 45.5231];
      const seattle = [-122.3321, 47.6062];
      const distance = calculateDistance(portland, seattle);

      expect(distance).toBeGreaterThan(230000); // > 230 km
      expect(distance).toBeLessThan(240000); // < 240 km
    });

    it("returns 0 for identical coordinates", () => {
      const coord = [-122.6765, 45.5231];
      expect(calculateDistance(coord, coord)).toBe(0);
    });
  });

  describe("validateDistanceBetweenPoints", () => {
    it("validates points within max distance", () => {
      const coord1 = [-122.6765, 45.5231];
      const coord2 = [-122.68, 45.525]; // Very close
      const result = validateDistanceBetweenPoints(coord1, coord2, 10000);

      expect(result.valid).toBe(true);
      expect(result.distance).toBeLessThan(10000);
    });

    it("rejects points exceeding max distance", () => {
      const portland = [-122.6765, 45.5231];
      const seattle = [-122.3321, 47.6062];
      const result = validateDistanceBetweenPoints(portland, seattle, 1000);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds maximum");
    });
  });

  describe("validatePoleCoordinates", () => {
    it("validates pole with valid coordinates", () => {
      const pole = {
        id: "pole1",
        latitude: 45.5231,
        longitude: -122.6765,
      };
      const result = validatePoleCoordinates(pole);
      expect(result.valid).toBe(true);
    });

    it("warns about missing coordinates", () => {
      const pole = { id: "pole1" };
      const result = validatePoleCoordinates(pole);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });

    it("warns about [0, 0] coordinates", () => {
      const pole = {
        id: "pole1",
        latitude: 0,
        longitude: 0,
      };
      const result = validatePoleCoordinates(pole);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        "Coordinates are at [0, 0] - this is likely unintentional",
      );
    });

    it("errors on partial coordinates", () => {
      const pole1 = {
        id: "pole1",
        latitude: 45.5231,
      };
      const result1 = validatePoleCoordinates(pole1);
      expect(result1.valid).toBe(false);
      expect(result1.errors).toContain("Latitude provided without longitude");

      const pole2 = {
        id: "pole2",
        longitude: -122.6765,
      };
      const result2 = validatePoleCoordinates(pole2);
      expect(result2.valid).toBe(false);
      expect(result2.errors).toContain("Longitude provided without latitude");
    });

    it("errors on invalid coordinates", () => {
      const pole = {
        id: "pole1",
        latitude: 91,
        longitude: -122.6765,
      };
      const result = validatePoleCoordinates(pole);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("validatePoleBatch", () => {
    it("validates batch of poles", () => {
      const poles = [
        { id: "pole1", latitude: 45.5231, longitude: -122.6765 },
        { id: "pole2", latitude: 45.524, longitude: -122.677 },
        { id: "pole3", latitude: 45.525, longitude: -122.678 },
      ];
      const result = validatePoleBatch(poles);

      expect(result.valid).toBe(true);
      expect(result.summary.total).toBe(3);
      expect(result.summary.valid).toBe(3);
      expect(result.summary.errors).toBe(0);
    });

    it("reports errors in batch", () => {
      const poles = [
        { id: "pole1", latitude: 45.5231, longitude: -122.6765 }, // Valid
        { id: "pole2", latitude: 91, longitude: -122.677 }, // Invalid
        { id: "pole3", latitude: 45.525 }, // Invalid (missing longitude)
      ];
      const result = validatePoleBatch(poles);

      expect(result.valid).toBe(false);
      expect(result.summary.total).toBe(3);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.errors).toBe(2);
    });
  });
});
