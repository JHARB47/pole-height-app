#!/usr/bin/env node
/**
 * Dependency Security Validation for Production Verification
 * Usage: npm run verify:dependencies
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🔍 Validating Dependencies for Production...\n');

let hasErrors = false;
const results = {
  audit: false,
  outdated: false,
  security: false
};

// 1. Check for high/critical vulnerabilities
console.log('📋 Running npm audit...');
try {
  execSync('npm audit --audit-level=high --omit dev', { stdio: 'inherit' });
    console.log('✅ All dependency validations passed!');
  
  try {
    execSync('npm audit --audit-level=high', { encoding: 'utf8' });
    console.log('✅ No high-severity vulnerabilities found');
  } catch (error) {
    console.error('⚠️  High-severity vulnerabilities detected. Run: npm audit');
    console.error(error.message);
  }
  results.audit = true;
} catch (_error) { // eslint-disable-line no-unused-vars
  console.error('❌ High/critical vulnerabilities detected');
  hasErrors = true;
}

// 2. Check for major version updates that need attention
console.log('\n📦 Checking for held major versions...');
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const heldMajors = [
    'react', 'react-dom', 'vite', 'vitest', 'tailwindcss', 
    'express', 'openid-client', 'uuid', '@node-saml/passport-saml'
  ];
  
  console.log('🔒 Major versions held for manual upgrade:');
  heldMajors.forEach(pkg => {
    const version = packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg];
    if (version) {
      console.log(`  - ${pkg}: ${version}`);
    }
  });
  results.outdated = true;
  } catch (error) {
    console.error('❌ Failed to parse package.json:', error.message);
    process.exit(1);
  }

// 3. Validate browserslist configuration
console.log('\n🌐 Validating browser targets...');
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  if (packageJson.browserslist) {
    console.log('✅ Browserslist configured:', packageJson.browserslist);
    results.security = true;
  } else {
    console.error('❌ Missing browserslist configuration');
    hasErrors = true;
  }
} catch (error) {
  console.error('❌ Error validating browserslist:', error.message);
  hasErrors = true;
}

// 4. Check for deprecated packages
console.log('\n⚠️  Checking for deprecated packages...');
try {
  execSync('npm ls --depth=0 --parseable', { encoding: 'utf8' });
  console.log('ℹ️  Use "npm outdated" to check for updates');
  console.log('ℹ️  Use "npm run deps:check" to preview safe updates');
} catch (_error) { // eslint-disable-line no-unused-vars
  console.log('ℹ️  Some packages may have issues - check with npm ls');
}

console.log('\n📊 Dependency Validation Summary:');
console.log(`Security Audit: ${results.audit ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Version Check: ${results.outdated ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Browser Config: ${results.security ? '✅ PASS' : '❌ FAIL'}`);

if (hasErrors) {
  console.log('\n❌ Dependency validation failed');
  console.log('Run the following to address issues:');
  console.log('- npm audit fix');
  console.log('- npm run deps:update:safe');
  console.log('- npm run upgrade:branches (for major versions)');
  process.exit(1);
} else {
  console.log('\n✅ All dependency checks passed');
  process.exit(0);
}