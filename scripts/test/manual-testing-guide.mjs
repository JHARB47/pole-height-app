#!/usr/bin/env node
/**
 * Manual Testing Script for Phase 2 Enhancements
 * Run this script to create sample data and test new features
 */

import { BUILT_IN_TEMPLATES, saveTemplate, getAllTemplates } from '../src/utils/exportTemplates.js';
import { validatePoleCoordinates } from '../src/utils/gisValidation.js';

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║  PHASE 2 ENHANCEMENTS - MANUAL TESTING GUIDE              ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// ============================================================================
// 1. Test Export Templates
// ============================================================================

console.log('📋 TESTING EXPORT TEMPLATES\n');

console.log('Built-in Templates Available:');
Object.values(BUILT_IN_TEMPLATES).forEach(template => {
  console.log(`  ✓ ${template.name} (${template.framework})`);
  console.log(`    - ${template.description}`);
  console.log(`    - Columns: ${template.columns.length}`);
});

console.log('\n✨ Creating Sample User Templates...\n');

// Sample template 1: Utility Company Standard
const utilityTemplate = {
  name: 'Utility Standard',
  description: 'Standard template for utility company reports',
  framework: 'NESC',
  columns: ['id', 'height', 'latitude', 'longitude', 'groundLineClearance', 'midspanClearance'],
  options: {
    useTickMarks: true,
    decimalPrecision: 2
  }
};

const result1 = saveTemplate(utilityTemplate);
console.log(`${result1.success ? '✅' : '❌'} Utility Standard: ${result1.success ? 'Created' : result1.error}`);

// Sample template 2: Field Survey Quick Export
const fieldTemplate = {
  name: 'Field Survey Quick',
  description: 'Quick export for field surveys',
  framework: 'CUSTOM',
  columns: ['id', 'latitude', 'longitude', 'height', 'notes'],
  options: {
    useTickMarks: false,
    decimalPrecision: 6
  }
};

const result2 = saveTemplate(fieldTemplate);
console.log(`${result2.success ? '✅' : '❌'} Field Survey Quick: ${result2.success ? 'Created' : result2.error}`);

// Sample template 3: Compliance Review
const complianceTemplate = {
  name: 'Compliance Review',
  description: 'For regulatory compliance reviews',
  framework: 'NESC',
  columns: ['id', 'height', 'groundLineClearance', 'midspanClearance', 'verticalClearance', 'horizontalClearance'],
  options: {
    useTickMarks: true,
    decimalPrecision: 1
  }
};

const result3 = saveTemplate(complianceTemplate);
console.log(`${result3.success ? '✅' : '❌'} Compliance Review: ${result3.success ? 'Created' : result3.error}`);

console.log(`\n📊 Total Templates: ${getAllTemplates().length} (${Object.keys(BUILT_IN_TEMPLATES).length} built-in + ${getAllTemplates().length - Object.keys(BUILT_IN_TEMPLATES).length} user)\n`);

// ============================================================================
// 2. Test GIS Validation (Sample Coordinates)
// ============================================================================

console.log('🗺️  TESTING GIS VALIDATION\n');

const testCoordinates = [
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194, expected: 'valid' },
  { name: 'New York City', lat: 40.7128, lon: -74.0060, expected: 'valid' },
  { name: 'Invalid Latitude', lat: 91, lon: -122.4194, expected: 'error' },
  { name: 'Invalid Longitude', lat: 37.7749, lon: -181, expected: 'error' },
  { name: 'Null Island', lat: 0, lon: 0, expected: 'warning' },
  { name: 'Near Null Island', lat: 0.0001, lon: 0.0001, expected: 'warning' },
];

testCoordinates.forEach(coord => {
  const validation = validatePoleCoordinates(coord.lat, coord.lon);
  const status = !validation.valid ? '❌ ERROR' : 
                 validation.warnings.length > 0 ? '⚠️  WARN' : '✅ VALID';
  
  console.log(`${status} ${coord.name}: (${coord.lat}, ${coord.lon})`);
  if (validation.errors.length > 0) {
    validation.errors.forEach(err => console.log(`        ${err}`));
  }
  if (validation.warnings.length > 0) {
    validation.warnings.forEach(warn => console.log(`        ${warn}`));
  }
});

// ============================================================================
// 3. Sample Data for Pagination Testing
// ============================================================================

console.log('\n📦 GENERATING SAMPLE DATA FOR PAGINATION TESTING\n');

// Generate sample project data
const sampleProjects = [];
const cities = ['San Francisco', 'New York', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin'];
// const clients = ['PG&E', 'ConEd', 'ComEd', 'CenterPoint', 'APS', 'PECO', 'CPS Energy', 'SDG&E', 'Oncor', 'Austin Energy'];

for (let i = 1; i <= 100; i++) {
  const city = cities[i % cities.length];
  // const client = clients[i % clients.length];
  
  sampleProjects.push({
    id: i,
    name: `${city} Line ${i}`,
    client_id: `client_${i % 10}`,
    organization_id: `org_${Math.floor(i / 25) + 1}`,
    user_id: 'test_user',
    project_data: {
      poles: [
        { id: `P${i}-1`, latitude: 37.7749 + (i * 0.01), longitude: -122.4194 + (i * 0.01), height: 40 },
        { id: `P${i}-2`, latitude: 37.7749 + (i * 0.01) + 0.001, longitude: -122.4194 + (i * 0.01) + 0.001, height: 45 },
      ]
    },
    created_at: new Date(2024, 0, i).toISOString(),
    updated_at: new Date(2024, 9, i).toISOString()
  });
}

console.log(`Generated ${sampleProjects.length} sample projects for testing`);
console.log(`  - Organizations: ${new Set(sampleProjects.map(p => p.organization_id)).size}`);
console.log(`  - Clients: ${new Set(sampleProjects.map(p => p.client_id)).size}`);
console.log(`  - Cities: ${cities.length}`);

// Save sample data to file for import
const fs = await import('fs');
const sampleDataPath = './scripts/test/sample-projects.json';
fs.writeFileSync(sampleDataPath, JSON.stringify(sampleProjects, null, 2));
console.log(`\n✅ Sample data saved to: ${sampleDataPath}`);

// ============================================================================
// 4. Test Instructions
// ============================================================================

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║  MANUAL TESTING INSTRUCTIONS                              ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('🔍 DEBOUNCED VALIDATION TEST:');
console.log('   1. Open the app in your browser');
console.log('   2. Navigate to Job Setup → GPS Coordinates');
console.log('   3. Type coordinates rapidly (e.g., "37.7749")');
console.log('   4. Watch for "🔄 Validating..." indicator');
console.log('   5. Validation should trigger 300ms after you stop typing\n');

console.log('📊 VALIDATION STATISTICS TEST:');
console.log('   1. Import multiple poles with mixed valid/invalid coordinates');
console.log('   2. Look for ValidationStatisticsPanel component');
console.log('   3. Should show aggregate counts (valid/warnings/errors)');
console.log('   4. Click "View Errors" or "View Warnings" to expand details\n');

console.log('💾 EXPORT TEMPLATES TEST:');
console.log('   1. Click "Custom CSV" button in Quick Export panel');
console.log('   2. Check template dropdown - should see 8 total:');
console.log('      - 5 built-in templates');
console.log('      - 3 user templates created by this script');
console.log('   3. Select "Utility Standard" template');
console.log('   4. Export should use pre-configured columns\n');

console.log('🔍 API PAGINATION TEST:');
console.log('   1. Import sample-projects.json into database');
console.log('   2. Test these API calls:');
console.log('      GET /api/projects?page=1&limit=10');
console.log('      GET /api/projects?page=2&limit=25');
console.log('      GET /api/projects?search=San Francisco');
console.log('      GET /api/projects?client_id=client_5&page=1');
console.log('   3. Check pagination metadata in response\n');

console.log('📝 API CURL EXAMPLES:');
console.log('   # Get first page (default 50 items)');
console.log('   curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/projects\n');
console.log('   # Search with pagination');
console.log('   curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/projects?search=San&page=1&limit=10"\n');
console.log('   # Filter by organization');
console.log('   curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/projects?organization_id=org_1"\n');

console.log('✅ EXPECTED RESULTS:');
console.log('   - Debounced validation: No lag during typing');
console.log('   - Statistics panel: Accurate counts with color coding');
console.log('   - Templates: One-click export setup');
console.log('   - Pagination: Fast responses (<100ms), correct metadata\n');

console.log('═══════════════════════════════════════════════════════════\n');
