// Performance test for large dataset handling
import { computeAnalysis } from './src/utils/calculations.js';
import { buildPolesCSV, buildSpansCSV, buildExistingLinesCSV } from './src/utils/exporters.js';

// Generate large dataset for testing
function generateLargeDataset(size = 1000) {
  const spans = [];
  const existingLines = [];
  
  for (let i = 0; i < size; i++) {
    spans.push({
      fromPoleId: `P${i}`,
      toPoleId: `P${i + 1}`,
      distanceFt: Math.round(50 + Math.random() * 200),
      environment: 'road'
    });
    
    if (Math.random() > 0.7) {
      existingLines.push({
        id: `EL${i}`,
        type: 'comm',
        companyName: 'Test Company',
        height: `${(15 + Math.random() * 15).toFixed(1)}`,
        makeReady: Math.random() > 0.8,
        makeReadyHeight: `${(18 + Math.random() * 12).toFixed(1)}`
      });
    }
  }
  
  return { spans, existingLines };
}

// Performance test function
function runPerformanceTest() {
  console.log('Starting performance tests for large datasets...');
  
  const testSizes = [100, 500, 1000, 2000];
  
  testSizes.forEach(size => {
    console.log(`\nTesting with ${size} items:`);
    
    const startTime = performance.now();
    const { spans, existingLines } = generateLargeDataset(size);
    const generateTime = performance.now() - startTime;
    
    // Test computation
    const computeStart = performance.now();
    const result = computeAnalysis({
      poleHeight: '35',
      poleClass: 'Class 4',
      existingPowerHeight: '25',
      existingPowerVoltage: 'distribution',
      spanDistance: '150',
      isNewConstruction: false,
      adjacentPoleHeight: '35',
      attachmentType: 'standard',
      cableDiameter: '0.5',
      windSpeed: '85',
      spanEnvironment: 'road',
      proposedLineHeight: '20',
      existingLines: existingLines.slice(0, Math.min(50, existingLines.length)), // Limit for realistic test
      iceThicknessIn: '0.25',
      hasTransformer: false,
      presetProfile: '',
      powerReference: 'auto'
    });
    const computeTime = performance.now() - computeStart;
    
    // Test CSV export
    const exportStart = performance.now();
    const polesCSV = buildPolesCSV(spans.map((span, i) => ({
      id: span.fromPoleId,
      latitude: 40.123 + (i * 0.001),
      longitude: -80.456 + (i * 0.001),
      height: '35',
      class: 'Class 4'
    })));
    const spansCSV = buildSpansCSV(spans);
    const existingCSV = buildExistingLinesCSV(existingLines);
    const exportTime = performance.now() - exportStart;
    
    console.log(`  Generation: ${generateTime.toFixed(2)}ms`);
    console.log(`  Computation: ${computeTime.toFixed(2)}ms`);
    console.log(`  CSV Export: ${exportTime.toFixed(2)}ms`);
    console.log(`  Total: ${(generateTime + computeTime + exportTime).toFixed(2)}ms`);
    console.log(`  Memory usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`);
  });
}

// Run the test
if (process.argv[2] === 'run') {
  runPerformanceTest();
}

export { runPerformanceTest, generateLargeDataset };
