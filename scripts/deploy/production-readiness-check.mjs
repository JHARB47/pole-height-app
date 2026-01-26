#!/usr/bin/env node
/**
 * Production Readiness Verification
 * Comprehensive check of all application systems before deployment
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import process from 'process';

const projectRoot = process.cwd();

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

class ProductionChecker {
  constructor() {
    this.checks = [];
    this.critical = [];
    this.warnings = [];
    this.passed = [];
  }

  log(msg, color = colors.reset) {
    console.log(`${color}${msg}${colors.reset}`);
  }

  section(title) {
    this.log(`\n${'='.repeat(70)}`, colors.cyan);
    this.log(`  ${title}`, colors.bright + colors.cyan);
    this.log('='.repeat(70), colors.cyan);
  }

  /**
   * Check if environment variables are properly set
   */
  checkEnvironmentVariables() {
    this.section('ENVIRONMENT VARIABLES');
    
    const requiredEnvVars = [
      { name: 'NODE_ENV', production: 'production', optional: false },
      { name: 'DATABASE_URL', production: null, optional: true },
      { name: 'JWT_SECRET', production: null, optional: true },
      { name: 'SENTRY_DSN', production: null, optional: true },
    ];
    
    requiredEnvVars.forEach(({ name, production, optional }) => {
      const value = process.env[name];
      
      if (!value && !optional) {
        this.critical.push(`Missing required env var: ${name}`);
        this.log(`  ✗ ${name}: Missing (CRITICAL)`, colors.red);
      } else if (!value && optional) {
        this.warnings.push(`Optional env var not set: ${name}`);
        this.log(`  ⚠ ${name}: Not set (optional)`, colors.yellow);
      } else if (production && value !== production) {
        this.warnings.push(`${name} is not set to ${production}`);
        this.log(`  ⚠ ${name}: ${value} (should be ${production} in production)`, colors.yellow);
      } else {
        this.passed.push(`${name} configured`);
        this.log(`  ✓ ${name}: Configured`, colors.green);
      }
    });
  }

  /**
   * Check build artifacts
   */
  checkBuildArtifacts() {
    this.section('BUILD ARTIFACTS');
    
    const distPath = join(projectRoot, 'dist');
    
    if (!existsSync(distPath)) {
      this.critical.push('dist/ directory not found - run build first');
      this.log('  ✗ dist/ directory: Missing (run npm run build)', colors.red);
      return;
    }
    
    const requiredFiles = [
      'index.html',
      'assets',
    ];
    
    requiredFiles.forEach(file => {
      const filePath = join(distPath, file);
      if (existsSync(filePath)) {
        this.passed.push(`dist/${file} exists`);
        this.log(`  ✓ dist/${file}: Present`, colors.green);
        
        // Check file size if it's a file
        if (file !== 'assets') {
          const stats = statSync(filePath);
          const sizeKB = (stats.size / 1024).toFixed(2);
          this.log(`    Size: ${sizeKB} KB`, colors.blue);
        }
      } else {
        this.critical.push(`dist/${file} missing`);
        this.log(`  ✗ dist/${file}: Missing`, colors.red);
      }
    });
    
    // Check for source maps (shouldn't be in production)
    try {
      const files = execSync('find dist -name "*.map" 2>/dev/null', { encoding: 'utf-8' });
      if (files.trim()) {
        this.warnings.push('Source maps found in dist/ (consider removing for production)');
        this.log('  ⚠ Source maps: Found (consider removing)', colors.yellow);
      } else {
        this.passed.push('No source maps in production build');
        this.log('  ✓ Source maps: None (good)', colors.green);
      }
    } catch {
      // find command might fail, that's okay
    }
  }

  /**
   * Check bundle size
   */
  checkBundleSize() {
    this.section('BUNDLE SIZE');
    
    const distPath = join(projectRoot, 'dist/assets');
    
    if (!existsSync(distPath)) {
      this.warnings.push('Cannot check bundle size - dist/assets not found');
      return;
    }
    
    try {
      const output = execSync(`du -sh ${distPath}`, { encoding: 'utf-8' });
      const size = output.split('\t')[0];
      
      this.log(`  Total bundle size: ${size}`, colors.blue);
      this.passed.push(`Bundle size: ${size}`);
      
      // Check if size exceeds 2MB (warning threshold)
      const sizeKB = parseInt(execSync(`du -sk ${distPath}`, { encoding: 'utf-8' }).split('\t')[0]);
      if (sizeKB > 2048) {
        this.warnings.push(`Bundle size (${size}) exceeds 2MB threshold`);
        this.log('  ⚠ Bundle larger than 2MB', colors.yellow);
      } else {
        this.log('  ✓ Bundle size acceptable', colors.green);
      }
    } catch {
      this.warnings.push('Could not determine bundle size');
    }
  }

  /**
   * Check security headers
   */
  checkSecurityConfig() {
    this.section('SECURITY CONFIGURATION');
    
    const netlifyToml = join(projectRoot, 'netlify.toml');
    
    if (existsSync(netlifyToml)) {
      const content = readFileSync(netlifyToml, 'utf-8');
      
      const securityHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy',
      ];
      
      securityHeaders.forEach(header => {
        if (content.includes(header)) {
          this.passed.push(`Security header ${header} configured`);
          this.log(`  ✓ ${header}: Configured`, colors.green);
        } else {
          this.warnings.push(`Security header ${header} not found`);
          this.log(`  ⚠ ${header}: Not configured`, colors.yellow);
        }
      });
    } else {
      this.warnings.push('netlify.toml not found');
    }
  }

  /**
   * Check for sensitive data
   */
  checkSensitiveData() {
    this.section('SENSITIVE DATA CHECK');
    
    const sensitivePatterns = [
      { pattern: /api[_-]?key/i, name: 'API keys' },
      { pattern: /password\s*=/i, name: 'Passwords' },
      { pattern: /secret\s*=/i, name: 'Secrets' },
      { pattern: /token\s*=/i, name: 'Tokens' },
    ];
    
    const distPath = join(projectRoot, 'dist');
    if (!existsSync(distPath)) {
      this.warnings.push('Cannot check for sensitive data - dist/ not found');
      return;
    }
    
    try {
      const jsFiles = execSync(`find ${distPath} -name "*.js" -type f`, { encoding: 'utf-8' })
        .split('\n')
        .filter(Boolean)
        .slice(0, 20); // Check first 20 files
      
      let foundSensitive = false;
      
      jsFiles.forEach(file => {
        const content = readFileSync(file, 'utf-8');
        sensitivePatterns.forEach(({ pattern, name }) => {
          if (pattern.test(content) && !content.includes('process.env')) {
            this.critical.push(`Potential ${name} hardcoded in ${file}`);
            this.log(`  ✗ ${name}: Potentially hardcoded`, colors.red);
            foundSensitive = true;
          }
        });
      });
      
      if (!foundSensitive) {
        this.passed.push('No obvious sensitive data in bundle');
        this.log('  ✓ No obvious sensitive data detected', colors.green);
      }
    } catch {
      this.warnings.push('Could not scan for sensitive data');
    }
  }

  /**
   * Check test coverage
   */
  checkTestCoverage() {
    this.section('TEST COVERAGE');
    
    const coveragePath = join(projectRoot, 'coverage/lcov.info');
    
    if (existsSync(coveragePath)) {
      try {
        const content = readFileSync(coveragePath, 'utf-8');
        const lines = content.split('\n');
        
        let totalLines = 0;
        let coveredLines = 0;
        
        lines.forEach(line => {
          if (line.startsWith('LF:')) {
            totalLines += parseInt(line.split(':')[1]);
          } else if (line.startsWith('LH:')) {
            coveredLines += parseInt(line.split(':')[1]);
          }
        });
        
        const coverage = ((coveredLines / totalLines) * 100).toFixed(2);
        
        this.log(`  Coverage: ${coverage}%`, colors.blue);
        
        if (coverage >= 80) {
          this.passed.push(`Test coverage: ${coverage}%`);
          this.log('  ✓ Coverage above 80%', colors.green);
        } else if (coverage >= 60) {
          this.warnings.push(`Test coverage (${coverage}%) below 80%`);
          this.log('  ⚠ Coverage below 80%', colors.yellow);
        } else {
          this.critical.push(`Test coverage (${coverage}%) critically low`);
          this.log('  ✗ Coverage below 60% (critical)', colors.red);
        }
      } catch {
        this.warnings.push('Could not parse coverage data');
      }
    } else {
      this.warnings.push('Coverage report not found - run npm run test:coverage');
      this.log('  ⚠ Coverage report not found', colors.yellow);
    }
  }

  /**
   * Check dependencies for vulnerabilities
   */
  checkDependencies() {
    this.section('DEPENDENCY SECURITY');
    
    try {
      execSync('npm audit --audit-level=high --omit=dev', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      this.passed.push('No high/critical vulnerabilities');
      this.log('  ✓ No high/critical vulnerabilities', colors.green);
    } catch (err) {
      const output = err.stdout || '';
      const vulnMatch = output.match(/(\d+) vulnerabilities/);
      
      if (vulnMatch) {
        const count = vulnMatch[1];
        this.warnings.push(`${count} vulnerabilities found`);
        this.log(`  ⚠ ${count} vulnerabilities found`, colors.yellow);
        this.log('    Run: npm audit fix', colors.blue);
      } else {
        this.warnings.push('Could not determine vulnerability status');
      }
    }
  }

  /**
   * Check git status
   */
  checkGitStatus() {
    this.section('VERSION CONTROL');
    
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf-8' });
      
      if (status.trim() === '') {
        this.passed.push('Working directory clean');
        this.log('  ✓ Working directory clean', colors.green);
      } else {
        this.warnings.push('Uncommitted changes in working directory');
        this.log('  ⚠ Uncommitted changes present', colors.yellow);
      }
      
      const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
      this.log(`  Current branch: ${branch}`, colors.blue);
      
      if (branch === 'main' || branch === 'master') {
        this.passed.push(`On ${branch} branch`);
      } else {
        this.warnings.push(`Not on main branch (on ${branch})`);
      }
    } catch {
      this.warnings.push('Not a git repository or git not available');
    }
  }

  /**
   * Check netlify configuration
   */
  checkNetlifyConfig() {
    this.section('NETLIFY CONFIGURATION');
    
    const netlifyToml = join(projectRoot, 'netlify.toml');
    
    if (!existsSync(netlifyToml)) {
      this.critical.push('netlify.toml not found');
      this.log('  ✗ netlify.toml: Missing', colors.red);
      return;
    }
    
    const content = readFileSync(netlifyToml, 'utf-8');
    
    const checks = [
      { pattern: /\[build\]/i, name: 'Build section' },
      { pattern: /command\s*=/i, name: 'Build command' },
      { pattern: /publish\s*=/i, name: 'Publish directory' },
      { pattern: /\[\[redirects\]\]/i, name: 'Redirects' },
      { pattern: /\[\[headers\]\]/i, name: 'Headers' },
    ];
    
    checks.forEach(({ pattern, name }) => {
      if (pattern.test(content)) {
        this.passed.push(`Netlify ${name} configured`);
        this.log(`  ✓ ${name}: Configured`, colors.green);
      } else {
        this.warnings.push(`Netlify ${name} not found`);
        this.log(`  ⚠ ${name}: Not configured`, colors.yellow);
      }
    });
  }

  /**
   * Print final report
   */
  printReport() {
    this.section('PRODUCTION READINESS REPORT');
    
    console.log(`\n${colors.green}Passed Checks: ${this.passed.length}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${this.warnings.length}${colors.reset}`);
    console.log(`${colors.red}Critical Issues: ${this.critical.length}${colors.reset}\n`);
    
    if (this.critical.length > 0) {
      this.log('CRITICAL ISSUES:', colors.red + colors.bright);
      this.critical.forEach(issue => {
        this.log(`  • ${issue}`, colors.red);
      });
      console.log();
    }
    
    if (this.warnings.length > 0) {
      this.log('WARNINGS:', colors.yellow + colors.bright);
      this.warnings.forEach(warning => {
        this.log(`  • ${warning}`, colors.yellow);
      });
      console.log();
    }
    
    // Overall status
    if (this.critical.length === 0 && this.warnings.length === 0) {
      this.log('✨ APPLICATION IS PRODUCTION READY! ✨', colors.green + colors.bright);
      this.log('\nYou can safely deploy to production.\n', colors.green);
      return 0;
    } else if (this.critical.length === 0) {
      this.log('⚠️  APPLICATION IS MOSTLY READY', colors.yellow + colors.bright);
      this.log(`\nThere are ${this.warnings.length} warnings. Review them before deploying.\n`, colors.yellow);
      return 0;
    } else {
      this.log('❌ APPLICATION NOT READY FOR PRODUCTION', colors.red + colors.bright);
      this.log(`\n${this.critical.length} critical issues must be fixed before deployment.\n`, colors.red);
      return 1;
    }
  }

  /**
   * Run all checks
   */
  runAll() {
    this.log('\n' + '█'.repeat(70), colors.magenta);
    this.log('  PRODUCTION READINESS VERIFICATION', colors.magenta + colors.bright);
    this.log('█'.repeat(70) + '\n', colors.magenta);
    
    this.checkEnvironmentVariables();
    this.checkBuildArtifacts();
    this.checkBundleSize();
    this.checkSecurityConfig();
    this.checkSensitiveData();
    this.checkTestCoverage();
    this.checkDependencies();
    this.checkGitStatus();
    this.checkNetlifyConfig();
    
    return this.printReport();
  }
}

// Run production checks
const checker = new ProductionChecker();
const exitCode = checker.runAll();
process.exit(exitCode);
