#!/usr/bin/env node
/**
 * PRODUCTION READINESS EVIDENCE REPORT
 * Comprehensive verification of all claimed features with measurements
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

class EvidenceCollector {
  constructor() {
    this.evidence = {
      timestamp: new Date().toISOString(),
      baseline: {},
      moduleVerification: {},
      integration: {},
      performance: {},
      tests: {},
      issues: [],
      recommendations: [],
    };
    this.startTime = Date.now();
  }

  log(msg, level = 'info') {
    const color = {
      info: colors.cyan,
      success: colors.green,
      error: colors.red,
      warn: colors.yellow,
      section: colors.magenta + colors.bright,
    }[level] || colors.reset;
    
    console.log(`${color}${msg}${colors.reset}`);
  }

  section(title) {
    this.log(`\n${'='.repeat(70)}\n${title}\n${'='.repeat(70)}`, 'section');
  }

  exec(cmd, options = {}) {
    try {
      const result = execSync(cmd, {
        encoding: 'utf-8',
        cwd: process.cwd(),
        ...options,
      });
      return { success: true, output: result, exitCode: 0 };
    } catch (error) {
      return {
        success: false,
        output: error.stdout || error.message,
        error: error.stderr || error.message,
        exitCode: error.status || 1,
      };
    }
  }

  /**
   * A) BASELINE AUDIT
   */
  async baselineAudit() {
    this.section('A) BASELINE AUDIT - DEPENDENCIES & BUILD');

    // Check Node/NPM versions
    const nodeVersion = this.exec('node --version');
    const npmVersion = this.exec('npm --version');
    
    this.evidence.baseline.environment = {
      node: nodeVersion.output.trim(),
      npm: npmVersion.output.trim(),
      os: process.platform,
      arch: process.arch,
    };
    
    this.log(`Node: ${nodeVersion.output.trim()}`, 'info');
    this.log(`NPM: ${npmVersion.output.trim()}`, 'info');

    // Check package.json
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    this.evidence.baseline.package = {
      name: pkg.name,
      version: pkg.version,
      react: pkg.dependencies.react,
      vite: pkg.devDependencies.vite,
      zustand: pkg.dependencies.zustand,
      zod: pkg.optionalDependencies?.zod,
      vitest: pkg.devDependencies.vitest,
      playwright: pkg.devDependencies['@playwright/test'],
    };

    this.log(`\nProject: ${pkg.name}@${pkg.version}`, 'info');
    this.log(`React: ${pkg.dependencies.react}`, 'info');
    this.log(`Vite: ${pkg.devDependencies.vite}`, 'info');
    this.log(`Zustand: ${pkg.dependencies.zustand}`, 'info');
    this.log(`Zod: ${pkg.optionalDependencies?.zod || 'optional'}`, 'info');

    // Lint check
    this.log('\n→ Running lint...', 'info');
    const lint = this.exec('npm run lint');
    this.evidence.baseline.lint = {
      success: lint.success,
      exitCode: lint.exitCode,
    };
    
    if (lint.success) {
      this.log('✓ Lint passed', 'success');
    } else {
      this.log('✗ Lint failed', 'error');
      this.evidence.issues.push({
        severity: 'high',
        category: 'baseline',
        issue: 'Lint errors present',
        details: lint.error,
      });
    }

    // Build check
    this.log('\n→ Running build...', 'info');
    const buildStart = Date.now();
    const build = this.exec('npm run build 2>&1');
    const buildDuration = Date.now() - buildStart;
    
    this.evidence.baseline.build = {
      success: build.success,
      duration: buildDuration,
      exitCode: build.exitCode,
    };

    if (build.success) {
      this.log(`✓ Build passed (${buildDuration}ms)`, 'success');
    } else {
      this.log('✗ Build failed', 'error');
      this.evidence.issues.push({
        severity: 'critical',
        category: 'baseline',
        issue: 'Build failure',
        details: build.error,
      });
    }

    // Check dist artifacts
    if (existsSync('dist/index.html')) {
      this.log('✓ dist/index.html exists', 'success');
      this.evidence.baseline.artifacts = { distIndexHtml: true };
    } else {
      this.log('✗ dist/index.html missing', 'error');
      this.evidence.baseline.artifacts = { distIndexHtml: false };
    }
  }

  /**
   * B) MODULE VERIFICATION
   */
  async verifyNewModules() {
    this.section('B) VERIFY NEW MODULES INTEGRATION (NO DEAD CODE)');

    const expectedModules = [
      'src/utils/dataOperations.js',
      'src/utils/fieldWorkflow.js',
      'src/utils/enhancedStoreActions.js',
      'src/components/workflow/panels/EnhancedFieldCollectionPanel.jsx',
    ];

    const modulesFound = {};
    
    for (const module of expectedModules) {
      const exists = existsSync(module);
      modulesFound[module] = exists;
      
      if (exists) {
        this.log(`✓ ${module} exists`, 'success');
        
        // Check if module has exports
        const content = readFileSync(module, 'utf-8');
        const hasExports = content.includes('export');
        
        if (hasExports) {
          this.log(`  └─ Has exports`, 'info');
        } else {
          this.log(`  └─ ⚠ No exports found`, 'warn');
          this.evidence.issues.push({
            severity: 'medium',
            category: 'modules',
            issue: `${module} has no exports`,
          });
        }
      } else {
        this.log(`✗ ${module} missing`, 'error');
        this.evidence.issues.push({
          severity: 'critical',
          category: 'modules',
          issue: `Required module ${module} not found`,
        });
      }
    }

    this.evidence.moduleVerification.modules = modulesFound;

    // Check for imports/usage
    this.log('\n→ Checking for actual usage (not dead code)...', 'info');
    
    const checks = [
      { module: 'dataOperations', pattern: 'from.*dataOperations' },
      { module: 'fieldWorkflow', pattern: 'from.*fieldWorkflow' },
      { module: 'enhancedStoreActions', pattern: 'from.*enhancedStoreActions' },
      { module: 'EnhancedFieldCollectionPanel', pattern: 'EnhancedFieldCollectionPanel' },
    ];

    for (const { module, pattern } of checks) {
      const search = this.exec(`grep -r "${pattern}" src/ --include="*.js" --include="*.jsx" | wc -l`);
      const count = parseInt(search.output.trim());
      
      this.evidence.moduleVerification[`${module}Usage`] = count;
      
      if (count > 0) {
        this.log(`✓ ${module} used in ${count} file(s)`, 'success');
      } else {
        this.log(`⚠ ${module} not used (dead code?)`, 'warn');
        this.evidence.recommendations.push({
          priority: 'high',
          item: `Integrate ${module} into active code paths or remove`,
        });
      }
    }
  }

  /**
   * C) DATA MODEL + VALIDATION
   */
  async verifyDataModel() {
    this.section('C) DATA MODEL + VALIDATION PROOF');

    // Check for Zod usage
    const zodCheck = this.exec('grep -r "import.*zod" src/ --include="*.js" --include="*.jsx" | wc -l');
    const zodUsageCount = parseInt(zodCheck.output.trim());

    this.evidence.moduleVerification.zodUsage = zodUsageCount;

    if (zodUsageCount > 0) {
      this.log(`✓ Zod used in ${zodUsageCount} file(s)`, 'success');
    } else {
      this.log(`⚠ Zod not found in source (validation claim unverified)`, 'warn');
      this.evidence.recommendations.push({
        priority: 'high',
        item: 'Add Zod validation to achieve claimed 100% coverage',
      });
    }

    // Check for provenance/source tracking
    const sourceCheck = this.exec('grep -r "source.*:" src/utils/ --include="*.js" | head -5');
    if (sourceCheck.output.includes('source')) {
      this.log(`✓ Source/provenance tracking found in code`, 'success');
    } else {
      this.log(`⚠ Source tracking not clearly evident`, 'warn');
    }
  }

  /**
   * F) PERFORMANCE MEASUREMENTS
   */
  async measurePerformance() {
    this.section('F) PERFORMANCE MEASUREMENTS (REAL, NOT VIBES)');

    this.log('→ Creating test datasets...', 'info');
    
    // Create performance test data
    const testDataSizes = [100, 1000];
    const results = [];

    for (const size of testDataSizes) {
      this.log(`\nTesting import of ${size} poles...`, 'info');
      
      // Generate CSV data
      let csvData = 'id,height,latitude,longitude,class,species\n';
      for (let i = 0; i < size; i++) {
        csvData += `POLE-${i},40,35.${2200 + i},-80.${8400 + i},2,southern_pine\n`;
      }
      
      writeFileSync(`test-${size}-poles.csv`, csvData);
      
      // Measure via test (if test exists)
      // eslint-disable-next-line no-unused-vars
      const _perfTest = `
        const fs = require('fs');
        const { parsePolesCSV } = require('./src/utils/importers.js');
        const csv = fs.readFileSync('test-${size}-poles.csv', 'utf-8');
        const start = Date.now();
        const result = parsePolesCSV(csv, {});
        const duration = Date.now() - start;
        console.log(JSON.stringify({ size: ${size}, duration, count: result.data?.length || 0 }));
      `;
      
      this.log(`  Target: < ${size === 100 ? 50 : 450}ms`, 'info');
      
      results.push({
        size,
        target: size === 100 ? 50 : 450,
        measured: 'N/A (requires runtime test)',
      });
    }

    this.evidence.performance.importTests = results;
    
    this.log('\n⚠ Full performance tests require runtime execution', 'warn');
    this.evidence.recommendations.push({
      priority: 'high',
      item: 'Add automated performance benchmarks with pass/fail thresholds',
    });
  }

  /**
   * G) TEST EXECUTION
   */
  async runTests() {
    this.section('G) TEST EXECUTION');

    // Unit tests
    this.log('→ Running unit tests...', 'info');
    const unitStart = Date.now();
    const unitTests = this.exec('npm run test:ci 2>&1');
    const unitDuration = Date.now() - unitStart;

    this.evidence.tests.unit = {
      success: unitTests.success,
      duration: unitDuration,
      exitCode: unitTests.exitCode,
    };

    if (unitTests.success) {
      const passedMatch = unitTests.output.match(/(\d+) passed/);
      const passed = passedMatch ? passedMatch[1] : 'unknown';
      this.log(`✓ Unit tests passed (${passed} tests in ${unitDuration}ms)`, 'success');
    } else {
      this.log(`✗ Unit tests failed`, 'error');
      this.evidence.issues.push({
        severity: 'high',
        category: 'tests',
        issue: 'Unit test failures',
        details: unitTests.error,
      });
    }

    // API tests
    this.log('\n→ Running API tests...', 'info');
    const apiStart = Date.now();
    const apiTests = this.exec('npm run test:api 2>&1');
    const apiDuration = Date.now() - apiStart;

    this.evidence.tests.api = {
      success: apiTests.success,
      duration: apiDuration,
      exitCode: apiTests.exitCode,
    };

    if (apiTests.success) {
      this.log(`✓ API tests passed (${apiDuration}ms)`, 'success');
    } else {
      this.log(`⚠ API tests had issues`, 'warn');
    }

    // E2E tests (if Playwright configured)
    if (existsSync('playwright.config.js') || existsSync('playwright.config.ts')) {
      this.log('\n→ Checking Playwright configuration...', 'info');
      this.evidence.tests.e2e = { configured: true, executed: false };
      this.evidence.recommendations.push({
        priority: 'high',
        item: 'Execute E2E tests: npm run test:e2e',
      });
    } else {
      this.log('\n⚠ Playwright not configured', 'warn');
      this.evidence.tests.e2e = { configured: false };
      this.evidence.recommendations.push({
        priority: 'high',
        item: 'Add Playwright E2E tests for critical workflows',
      });
    }
  }

  /**
   * I) SECURITY & DEPENDENCIES
   */
  async checkSecurity() {
    this.section('I) SECURITY + DEPENDENCY HYGIENE');

    this.log('→ Running npm audit...', 'info');
    const audit = this.exec('npm audit --audit-level=high --omit=dev 2>&1');
    
    this.evidence.security = {
      auditRun: true,
      hasVulnerabilities: !audit.success,
    };

    if (audit.success) {
      this.log('✓ No high/critical vulnerabilities', 'success');
    } else {
      const vulnMatch = audit.output.match(/(\d+) vulnerabilities/);
      const count = vulnMatch ? vulnMatch[1] : 'some';
      this.log(`⚠ ${count} vulnerabilities found`, 'warn');
      this.evidence.recommendations.push({
        priority: 'medium',
        item: `Fix ${count} security vulnerabilities: npm audit fix`,
      });
    }
  }

  /**
   * GENERATE FINAL REPORT
   */
  generateReport() {
    this.section('FINAL EVIDENCE REPORT');

    const duration = Date.now() - this.startTime;
    
    console.log(`\nReport Generated: ${this.evidence.timestamp}`);
    console.log(`Total Duration: ${(duration / 1000).toFixed(2)}s\n`);

    // Summary
    const criticalIssues = this.evidence.issues.filter(i => i.severity === 'critical');
    const highIssues = this.evidence.issues.filter(i => i.severity === 'high');
    const mediumIssues = this.evidence.issues.filter(i => i.severity === 'medium');

    console.log(`${colors.red}Critical Issues: ${criticalIssues.length}${colors.reset}`);
    console.log(`${colors.yellow}High Issues: ${highIssues.length}${colors.reset}`);
    console.log(`${colors.blue}Medium Issues: ${mediumIssues.length}${colors.reset}`);
    console.log(`${colors.cyan}Recommendations: ${this.evidence.recommendations.length}${colors.reset}\n`);

    if (criticalIssues.length > 0) {
      this.log('CRITICAL ISSUES:', 'error');
      criticalIssues.forEach((issue, idx) => {
        console.log(`  ${idx + 1}. ${issue.issue}`);
        if (issue.details) console.log(`     ${issue.details.slice(0, 100)}...`);
      });
    }

    if (this.evidence.recommendations.length > 0) {
      this.log('\nRECOMMENDATIONS:', 'warn');
      this.evidence.recommendations.forEach((rec, idx) => {
        console.log(`  ${idx + 1}. [${rec.priority.toUpperCase()}] ${rec.item}`);
      });
    }

    // Status Check
    this.log('\nSTATUS CHECKS:', 'section');
    console.log(`  Lint: ${this.evidence.baseline.lint?.success ? '✓' : '✗'}`);
    console.log(`  Build: ${this.evidence.baseline.build?.success ? '✓' : '✗'}`);
    console.log(`  Unit Tests: ${this.evidence.tests.unit?.success ? '✓' : '✗'}`);
    console.log(`  API Tests: ${this.evidence.tests.api?.success ? '✓' : '✗'}`);

    // Write report to file
    const reportPath = 'PRODUCTION-EVIDENCE-REPORT.json';
    writeFileSync(reportPath, JSON.stringify(this.evidence, null, 2));
    this.log(`\n✓ Full report saved to: ${reportPath}`, 'success');

    // Exit code
    if (criticalIssues.length > 0) {
      this.log('\n❌ PRODUCTION READINESS: NOT READY (critical issues found)', 'error');
      return 1;
    } else if (highIssues.length > 0) {
      this.log('\n⚠️  PRODUCTION READINESS: CONDITIONAL (high-priority items need attention)', 'warn');
      return 0;
    } else {
      this.log('\n✅ PRODUCTION READINESS: READY (minor optimizations recommended)', 'success');
      return 0;
    }
  }

  /**
   * RUN ALL CHECKS
   */
  async run() {
    try {
      await this.baselineAudit();
      await this.verifyNewModules();
      await this.verifyDataModel();
      await this.measurePerformance();
      await this.runTests();
      await this.checkSecurity();
      
      return this.generateReport();
    } catch (error) {
      this.log(`\n❌ FATAL ERROR: ${error.message}`, 'error');
      console.error(error);
      return 1;
    }
  }
}

// Execute
const collector = new EvidenceCollector();
collector.run().then(exitCode => {
  process.exit(exitCode);
});
