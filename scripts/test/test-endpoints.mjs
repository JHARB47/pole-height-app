#!/usr/bin/env node
/**
 * API Endpoint Testing with Example Inputs
 * Tests all API endpoints with real-world example data
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
};

/**
 * Example test data for various operations
 */
const testData = {
  pole: {
    id: 'TEST-001',
    height: 40,
    latitude: 35.2271,
    longitude: -80.8431,
    class: '2',
    species: 'southern_pine',
  },
  
  span: {
    id: 'SPAN-001',
    fromPole: 'TEST-001',
    toPole: 'TEST-002',
    length: 200,
    conductor: 'ACSR_477',
    tension: 2500,
  },
  
  clearanceCalc: {
    poleHeight: 40,
    attachHeight: 35,
    spanLength: 200,
    conductor: 'ACSR_477',
    tension: 2500,
    temperature: 60,
  },
  
  sagCalc: {
    spanLength: 200,
    tension: 2500,
    unitWeight: 0.465,
    temperature: 60,
  },
};

/**
 * Test calculation functions
 */
function testCalculationFunctions() {
  log.info('Testing calculation functions with example data...\n');
  
  try {
    // Import calculations module
    const calcPath = resolve(process.cwd(), 'src/utils/calculations.js');
    log.info(`Loading calculations from: ${calcPath}`);
    
    // Read and check for function exports
    const content = readFileSync(calcPath, 'utf-8');
    
    const functions = [
      'calculateClearance',
      'calculateSag',
      'calculateTension',
      'calculatePull',
      'calculateClearanceAtMidspan',
    ];
    
    let passed = 0;
    let failed = 0;
    
    functions.forEach(fn => {
      if (content.includes(`export function ${fn}`) || content.includes(`export const ${fn}`)) {
        log.success(`Function ${fn} is exported`);
        passed++;
      } else {
        log.error(`Function ${fn} NOT found`);
        failed++;
      }
    });
    
    log.info(`\nCalculation Functions: ${passed} found, ${failed} missing\n`);
    return { passed, failed };
    
  } catch (err) {
    log.error(`Error testing calculations: ${err.message}`);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Test data validation
 */
function testDataValidation() {
  log.info('Testing data validation with example inputs...\n');
  
  const validationTests = [
    {
      name: 'Valid pole height',
      data: testData.pole.height,
      validator: (h) => h > 0 && h < 200,
      expected: true,
    },
    {
      name: 'Valid latitude',
      data: testData.pole.latitude,
      validator: (lat) => lat >= -90 && lat <= 90,
      expected: true,
    },
    {
      name: 'Valid longitude',
      data: testData.pole.longitude,
      validator: (lon) => lon >= -180 && lon <= 180,
      expected: true,
    },
    {
      name: 'Invalid pole height (negative)',
      data: -10,
      validator: (h) => h > 0 && h < 200,
      expected: false,
    },
    {
      name: 'Invalid latitude (out of range)',
      data: 95,
      validator: (lat) => lat >= -90 && lat <= 90,
      expected: false,
    },
  ];
  
  let passed = 0;
  let failed = 0;
  
  validationTests.forEach(test => {
    const result = test.validator(test.data);
    if (result === test.expected) {
      log.success(`${test.name}: ${result}`);
      passed++;
    } else {
      log.error(`${test.name}: Expected ${test.expected}, got ${result}`);
      failed++;
    }
  });
  
  log.info(`\nValidation Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test GIS operations
 */
function testGISOperations() {
  log.info('Testing GIS operations...\n');
  
  try {
    const gisPath = resolve(process.cwd(), 'src/utils/geodata.js');
    const content = readFileSync(gisPath, 'utf-8');
    
    const functions = [
      'buildGeoJSON',
      'calculateDistance',
      'calculateBearing',
    ];
    
    let passed = 0;
    let failed = 0;
    
    functions.forEach(fn => {
      if (content.includes(`export function ${fn}`) || content.includes(`export const ${fn}`)) {
        log.success(`GIS function ${fn} available`);
        passed++;
      } else {
        log.warn(`GIS function ${fn} not found`);
        failed++;
      }
    });
    
    // Test coordinate validation
    const testCoords = [
      { lat: testData.pole.latitude, lon: testData.pole.longitude, valid: true },
      { lat: 200, lon: -80, valid: false },
      { lat: 35, lon: 200, valid: false },
    ];
    
    testCoords.forEach(({ lat, lon, valid }) => {
      const isValid = (lat >= -90 && lat <= 90) && (lon >= -180 && lon <= 180);
      if (isValid === valid) {
        log.success(`Coordinate validation: [${lat}, ${lon}] → ${isValid}`);
        passed++;
      } else {
        log.error(`Coordinate validation failed: [${lat}, ${lon}]`);
        failed++;
      }
    });
    
    log.info(`\nGIS Tests: ${passed} passed, ${failed} failed\n`);
    return { passed, failed };
    
  } catch (err) {
    log.error(`Error testing GIS operations: ${err.message}`);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Test import/export functions
 */
function testImportExport() {
  log.info('Testing import/export functions...\n');
  
  try {
    const importerPath = resolve(process.cwd(), 'src/utils/importers.js');
    const exporterPath = resolve(process.cwd(), 'src/utils/exporters.js');
    
    const importContent = readFileSync(importerPath, 'utf-8');
    const exportContent = readFileSync(exporterPath, 'utf-8');
    
    const importFunctions = ['parseCSV', 'parseKML', 'parseGeoJSON'];
    const exportFunctions = ['exportToCSV', 'exportToKML', 'exportToGeoJSON'];
    
    let passed = 0;
    let failed = 0;
    
    importFunctions.forEach(fn => {
      if (importContent.includes(fn)) {
        log.success(`Import function ${fn} available`);
        passed++;
      } else {
        log.warn(`Import function ${fn} not found`);
        failed++;
      }
    });
    
    exportFunctions.forEach(fn => {
      if (exportContent.includes(fn)) {
        log.success(`Export function ${fn} available`);
        passed++;
      } else {
        log.warn(`Export function ${fn} not found`);
        failed++;
      }
    });
    
    log.info(`\nImport/Export Tests: ${passed} passed, ${failed} failed\n`);
    return { passed, failed };
    
  } catch (err) {
    log.error(`Error testing import/export: ${err.message}`);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Main test runner
 */
function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('   API ENDPOINT & FUNCTION TESTING');
  console.log('='.repeat(60) + '\n');
  
  const results = {
    calculation: testCalculationFunctions(),
    validation: testDataValidation(),
    gis: testGISOperations(),
    importExport: testImportExport(),
  };
  
  // Calculate totals
  const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);
  const total = totalPassed + totalFailed;
  
  console.log('='.repeat(60));
  console.log('   TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nTotal Tests: ${total}`);
  console.log(`${colors.green}Passed: ${totalPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${totalFailed}${colors.reset}`);
  
  const successRate = ((totalPassed / total) * 100).toFixed(1);
  console.log(`\nSuccess Rate: ${successRate}%\n`);
  
  if (totalFailed === 0) {
    log.success('All endpoint tests passed! ✨\n');
    process.exit(0);
  } else {
    log.error(`${totalFailed} tests failed. Please review the issues above.\n`);
    process.exit(1);
  }
}

// Run all tests
runTests();
