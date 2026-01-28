/**
 * Real Performance Benchmark Tests
 * Measures actual import/export performance with various dataset sizes
 */

import { describe, it, expect } from "vitest";
import { parsePolesCSV, parseSpansCSV } from "../importers.js";
import { buildPolesCSV, buildSpansCSV } from "../exporters.js";

// Generate test data
function generateTestPoles(count) {
  const poles = [];
  for (let i = 0; i < count; i++) {
    poles.push({
      id: `POLE-${i}`,
      height: 40 + (i % 10),
      latitude: 35.2271 + i * 0.0001,
      longitude: -80.8431 + i * 0.0001,
      class: String((i % 4) + 1),
      species: ["southern_pine", "douglas_fir", "western_red_cedar"][i % 3],
      source: "test_data",
    });
  }
  return poles;
}

function generateTestSpans(count) {
  const spans = [];
  for (let i = 0; i < count; i++) {
    spans.push({
      id: `SPAN-${i}`,
      from: `POLE-${i}`,
      to: `POLE-${i + 1}`,
      length: 200 + (i % 100),
      conductor: "ACSR_477",
      tension: 2500,
    });
  }
  return spans;
}

describe("Performance Benchmarks", () => {
  // Define performance targets from executive summary
  const TARGETS = {
    poles100: 50, // ms
    poles1000: 450, // ms
    poles5000: 3000, // ms (reasonable estimate)
  };

  describe("CSV Import Performance", () => {
    it("should import 100 poles in < 50ms", () => {
      const poles = generateTestPoles(100);
      const csv = buildPolesCSV(poles);

      const start = performance.now();
      const result = parsePolesCSV(csv, {});
      const duration = performance.now() - start;

      console.log(
        `  ⏱ 100 poles: ${duration.toFixed(2)}ms (target: <${TARGETS.poles100}ms)`,
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(100);
      expect(duration).toBeLessThan(TARGETS.poles100);
    });

    it("should import 1000 poles in < 450ms", () => {
      const poles = generateTestPoles(1000);
      const csv = buildPolesCSV(poles);

      const start = performance.now();
      const result = parsePolesCSV(csv, {});
      const duration = performance.now() - start;

      console.log(
        `  ⏱ 1000 poles: ${duration.toFixed(2)}ms (target: <${TARGETS.poles1000}ms)`,
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(1000);
      expect(duration).toBeLessThan(TARGETS.poles1000);
    });

    it("should import 5000 poles in < 3s (stress test)", () => {
      const poles = generateTestPoles(5000);
      const csv = buildPolesCSV(poles);

      const start = performance.now();
      const result = parsePolesCSV(csv, {});
      const duration = performance.now() - start;

      console.log(
        `  ⏱ 5000 poles: ${duration.toFixed(2)}ms (target: <${TARGETS.poles5000}ms)`,
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(5000);
      expect(duration).toBeLessThan(TARGETS.poles5000);
    });
  });

  describe("CSV Export Performance", () => {
    it("should export 1000 poles in < 500ms", () => {
      const poles = generateTestPoles(1000);

      const start = performance.now();
      const result = buildPolesCSV(poles);
      const duration = performance.now() - start;

      console.log(`  ⏱ Export 1000 poles: ${duration.toFixed(2)}ms`);

      expect(result).toBeDefined();
      expect(result.split("\n").length).toBeGreaterThan(1000);
      expect(duration).toBeLessThan(500);
    });
  });

  describe("Batch Operations Performance", () => {
    it("should handle batch span import efficiently", () => {
      const spans = generateTestSpans(500);
      const csv = buildSpansCSV(spans);

      const start = performance.now();
      const result = parseSpansCSV(csv, {});
      const duration = performance.now() - start;

      console.log(`  ⏱ 500 spans: ${duration.toFixed(2)}ms`);

      expect(result).toBeDefined();
      expect(result.length).toBe(500);
      expect(duration).toBeLessThan(300);
    });
  });

  describe("Memory Efficiency", () => {
    it("should not leak memory during large imports", () => {
      if (typeof globalThis.gc === "function") {
        globalThis.gc();
      }

      const processRef =
        typeof globalThis.process !== "undefined" ? globalThis.process : null;
      const initialMemory = processRef ? processRef.memoryUsage().heapUsed : 0;

      // Import large dataset
      const poles = generateTestPoles(1000);
      const csv = buildPolesCSV(poles);
      parsePolesCSV(csv, {});

      if (typeof globalThis.gc === "function") {
        globalThis.gc();
      }

      const finalMemory = processRef
        ? processRef.memoryUsage().heapUsed
        : initialMemory;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;

      console.log(`  📊 Memory increase: ${memoryIncrease.toFixed(2)}MB`);

      // Should not increase by more than 10MB for 1000 poles
      expect(memoryIncrease).toBeLessThan(10);
    });
  });
});
