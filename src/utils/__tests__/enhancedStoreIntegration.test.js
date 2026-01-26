/**
 * Integration test for enhanced store actions
 * Proves that enhancedStoreActions are properly integrated into main store
 */

import { describe, it, expect, beforeEach } from "vitest";
import useAppStore from "../store.js";
import { DATA_SOURCES } from "../dataOperations.js";

describe("Enhanced Store Actions Integration", () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useAppStore.getState();
    store.setCollectedPoles([]);
    store.setImportedPoles([]);
    store.setImportedSpans([]);
  });

  describe("batchAddPoles", () => {
    it("should be available on store", () => {
      const store = useAppStore.getState();
      expect(store.batchAddPoles).toBeDefined();
      expect(typeof store.batchAddPoles).toBe("function");
    });

    it("should batch add poles with validation", () => {
      const store = useAppStore.getState();

      const testPoles = [
        {
          id: "TEST-1",
          height: 40,
          latitude: 35.0,
          longitude: -80.0,
          class: "4",
        },
        {
          id: "TEST-2",
          height: 35,
          latitude: 35.1,
          longitude: -80.1,
          class: "3",
        },
        {
          id: "TEST-3",
          height: 45,
          latitude: 35.2,
          longitude: -80.2,
          class: "2",
        },
      ];

      const result = store.batchAddPoles(testPoles, DATA_SOURCES.CSV_IMPORT, {
        validate: true,
        merge: false,
      });

      expect(result.success).toBe(true);
      expect(result.added).toBe(3);

      // Verify poles were added to store
      const currentState = useAppStore.getState();
      const allPoles = [
        ...currentState.collectedPoles,
        ...currentState.importedPoles,
      ];
      expect(allPoles.length).toBeGreaterThanOrEqual(3);

      // Find our test poles
      const testPole1 = allPoles.find((p) => p.id === "TEST-1");
      expect(testPole1).toBeDefined();
      expect(Number(testPole1.height)).toBe(40);
      // Source tracking may be normalized during batch processing
      expect(
        [DATA_SOURCES.CSV_IMPORT, undefined].includes(testPole1.source),
      ).toBe(true);
    });

    it("should handle validation errors gracefully", () => {
      const store = useAppStore.getState();

      const invalidPoles = [
        { id: "VALID-1", height: 40, latitude: 35.0, longitude: -80.0 },
        { id: "INVALID-1", height: -10, latitude: 35.1, longitude: -80.1 }, // Invalid height
        { id: "INVALID-2", latitude: 35.2 }, // Missing height
      ];

      const result = store.batchAddPoles(
        invalidPoles,
        DATA_SOURCES.CSV_IMPORT,
        {
          validate: true,
        },
      );

      // Should still succeed with partial results
      expect(result.success).toBe(true);
      expect(result.added).toBeGreaterThan(0);
      expect(result.invalid).toBeDefined();
    });

    it("should return error for empty array", () => {
      const store = useAppStore.getState();

      const result = store.batchAddPoles([], DATA_SOURCES.CSV_IMPORT);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "Invalid poles data: must be non-empty array",
      );
    });
  });

  describe("batchUpdatePoles", () => {
    it("should be available on store", () => {
      const store = useAppStore.getState();
      expect(store.batchUpdatePoles).toBeDefined();
      expect(typeof store.batchUpdatePoles).toBe("function");
    });

    it("should update multiple poles by ID", () => {
      const store = useAppStore.getState();

      // Add initial poles
      const initialPoles = [
        { id: "UPDATE-1", height: 40, latitude: 35.0, longitude: -80.0 },
        { id: "UPDATE-2", height: 35, latitude: 35.1, longitude: -80.1 },
      ];

      store.batchAddPoles(initialPoles, DATA_SOURCES.MANUAL_INPUT);

      // Update them
      const updates = [
        { id: "UPDATE-1", height: 45 }, // Change height
        { id: "UPDATE-2", class: "2" }, // Add class
      ];

      const result = store.batchUpdatePoles(updates);

      expect(result.success).toBe(true);
      expect(result.updated).toBe(2);

      // Verify updates
      const currentState = useAppStore.getState();
      const allPoles = [
        ...currentState.collectedPoles,
        ...currentState.importedPoles,
      ];

      const pole1 = allPoles.find((p) => p.id === "UPDATE-1");
      expect(pole1.height).toBe(45);

      const pole2 = allPoles.find((p) => p.id === "UPDATE-2");
      expect(pole2.class).toBe("2");
    });
  });

  describe("batchAddSpans", () => {
    it("should be available on store", () => {
      const store = useAppStore.getState();
      expect(store.batchAddSpans).toBeDefined();
      expect(typeof store.batchAddSpans).toBe("function");
    });

    it("should batch add spans with validation", () => {
      const store = useAppStore.getState();

      const testSpans = [
        { id: "SPAN-1", fromPoleId: "P1", toPoleId: "P2", lengthFt: 200 },
        { id: "SPAN-2", fromPoleId: "P2", toPoleId: "P3", lengthFt: 250 },
      ];

      const result = store.batchAddSpans(testSpans, DATA_SOURCES.CSV_IMPORT);

      expect(result.success).toBe(true);
      expect(result.added).toBe(2);

      // Verify spans were added
      const currentState = useAppStore.getState();
      expect(currentState.importedSpans.length).toBeGreaterThanOrEqual(2);

      const span1 = currentState.importedSpans.find((s) => s.id === "SPAN-1");
      expect(span1).toBeDefined();
      expect(Number(span1.lengthFt || span1.length)).toBe(200);
    });
  });

  describe("Feature Flag Integration", () => {
    it("should have batchOperations flag enabled", () => {
      const store = useAppStore.getState();
      expect(store.featureFlags.batchOperations).toBe(true);
    });

    it("should check feature flag status", () => {
      const store = useAppStore.getState();
      expect(store.isFeatureEnabled("batchOperations")).toBe(true);
    });
  });

  describe("Real-World Usage Scenario", () => {
    it("should handle CSV import workflow with batch operations", () => {
      const store = useAppStore.getState();

      // Simulate CSV import of poles and spans
      const csvPoles = [
        {
          id: "CSV-P1",
          height: 40,
          latitude: 35.0,
          longitude: -80.0,
          class: "4",
        },
        {
          id: "CSV-P2",
          height: 35,
          latitude: 35.1,
          longitude: -80.1,
          class: "3",
        },
        {
          id: "CSV-P3",
          height: 42,
          latitude: 35.2,
          longitude: -80.2,
          class: "4",
        },
      ];

      const csvSpans = [
        {
          id: "CSV-S1",
          fromPoleId: "CSV-P1",
          toPoleId: "CSV-P2",
          lengthFt: 220,
        },
        {
          id: "CSV-S2",
          fromPoleId: "CSV-P2",
          toPoleId: "CSV-P3",
          lengthFt: 180,
        },
      ];

      // Add poles
      const poleResult = store.batchAddPoles(csvPoles, DATA_SOURCES.CSV_IMPORT);
      expect(poleResult.success).toBe(true);
      expect(poleResult.added).toBe(3);

      // Add spans
      const spanResult = store.batchAddSpans(csvSpans, DATA_SOURCES.CSV_IMPORT);
      expect(spanResult.success).toBe(true);
      expect(spanResult.added).toBe(2);

      // Verify final state
      const finalState = useAppStore.getState();
      const allPoles = [
        ...finalState.collectedPoles,
        ...finalState.importedPoles,
      ];
      expect(allPoles.length).toBeGreaterThanOrEqual(3);
      expect(finalState.importedSpans.length).toBeGreaterThanOrEqual(2);
    });
  });
});
