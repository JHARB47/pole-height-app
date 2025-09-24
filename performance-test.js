// Legacy performance test stub – actual harness moved to scripts/perf/performance-test.mjs
export function generateLargeDataset() { return { poles: [], spans: [], existing: [] }; }
export function runPerformanceTest() { console.log('[perf] Stub harness. Use \
> pole-height-app@0.0.0 perf
> node ./scripts/perf/profile.mjs


=== computeAnalysis: iterations=50, existingLines=1000 ===
computeAnalysis: N=50 avg=0.60 ms p95=0.96 ms max=2.44 ms total=30.09 ms

=== exporters: items=1000 ===
buildPolesCSV: 0.81 ms
buildSpansCSV: 0.54 ms
buildExistingLinesCSV: 0.51 ms
buildGeoJSON: 0.28 ms
buildKML: 2.26 ms for full profiling.'); }
