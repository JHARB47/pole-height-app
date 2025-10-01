#!/usr/bin/env node
/**
 * Dependency Security Validation for Production Verification
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🔍 Validating Dependencies for Production...\n');

let hasErrors = false;

// 1. Check npm audit
console.log('📋 Running npm audit...');
try {
  execSync('npm audit --audit-level=high --omit dev', { stdio: 'inherit' });
  console.log('✅ No high/critical vulnerabilities found');
} catch (error) {
  console.error('❌ High/critical vulnerabilities detected');
  hasErrors = true;
}

// 2. Validate browserslist
console.log('\n🌐 Validating browser targets...');
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  if (packageJson.browserslist) {
    console.log('✅ Browserslist configured:', packageJson.browserslist);
  } else {
    console.error('❌ Missing browserslist configuration');
    hasErrors = true;
  }
} catch (error) {
  console.error('❌ Error validating browserslist:', error.message);
  hasErrors = true;
}

console.log('\n�� Dependency validation', hasErrors ? '❌ FAILED' : '✅ PASSED');
process.exit(hasErrors ? 1 : 0);
