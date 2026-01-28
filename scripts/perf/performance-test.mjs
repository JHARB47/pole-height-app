/* Node perf harness (moved from root) */
import { computeAnalysis } from "../../src/utils/calculations.js";
import {
  buildPolesCSV,
  buildSpansCSV,
  buildExistingLinesCSV,
} from "../../src/utils/exporters.js";

function generateLargeDataset(size = 1000) {
  const spans = [];
  const existingLines = [];
  for (let i = 0; i < size; i++) {
    spans.push({
      fromPoleId: `P${i}`,
      toPoleId: `P${i + 1}`,
      distanceFt: Math.round(50 + Math.random() * 200),
      environment: "road",
    });
    if (Math.random() > 0.7) {
      existingLines.push({
        id: `EL${i}`,
        type: "comm",
        companyName: "Test Company",
        height: `${(15 + Math.random() * 15).toFixed(1)}`,
        makeReady: Math.random() > 0.8,
        makeReadyHeight: `${(18 + Math.random() * 12).toFixed(1)}`,
      });
    }
  }
  return { spans, existingLines };
}

export function runPerformanceTest() {
  const testSizes = [100, 500, 1000, 2000];
  testSizes.forEach((size) => {
    const t0 = performance.now();
    const { spans, existingLines } = generateLargeDataset(size);
    const genMs = performance.now() - t0;
    const c0 = performance.now();
    const r = computeAnalysis({
      poleHeight: "35",
      poleClass: "Class 4",
      existingPowerHeight: "25",
      existingPowerVoltage: "distribution",
      spanDistance: "150",
      isNewConstruction: false,
      adjacentPoleHeight: "35",
      attachmentType: "standard",
      cableDiameter: "0.5",
      windSpeed: "85",
      spanEnvironment: "road",
      proposedLineHeight: "20",
      existingLines: existingLines.slice(0, Math.min(50, existingLines.length)),
      iceThicknessIn: "0.25",
      hasTransformer: false,
      presetProfile: "",
      powerReference: "auto",
    });
    const compMs = performance.now() - c0;
    const e0 = performance.now();
    const polesCsv = buildPolesCSV(
      spans.map((span, i) => ({
        id: span.fromPoleId,
        latitude: 40.123 + i * 0.001,
        longitude: -80.456 + i * 0.001,
        height: "35",
        class: "Class 4",
      })),
    );
    const spansCsv = buildSpansCSV(spans);
    const linesCsv = buildExistingLinesCSV(existingLines);
    const expMs = performance.now() - e0;
    console.log(
      `[perf] size=${size} gen=${genMs.toFixed(1)}ms compute=${compMs.toFixed(1)}ms export=${expMs.toFixed(1)}ms total=${(genMs + compMs + expMs).toFixed(1)}ms features=${Object.keys(r || {}).length} polesCSV=${polesCsv.length} spansCSV=${spansCsv.length} linesCSV=${linesCsv.length}`,
    );
  });
}

if (process.argv[1] && process.argv[1].includes("performance-test")) {
  runPerformanceTest();
}

export { generateLargeDataset };
