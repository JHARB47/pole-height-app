#!/usr/bin/env node
// @ts-nocheck
// Reason: editor TS checkJs noise in Node scripts; CI does not typecheck these.
/**
 * Comprehensive Diagnostic System
 * Tests all application operations with example inputs to discover issues
 */

import { spawn } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import process from "process";

const projectRoot = resolve(process.cwd());

// Color codes for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) =>
    console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

// Diagnostic test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

/**
 * Run a command and return results
 */
async function runCommand(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd || projectRoot,
      stdio: options.silent ? "pipe" : "inherit",
      shell: true,
      ...options,
    });

    let stdout = "";
    let stderr = "";

    if (options.silent) {
      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });
      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });
    }

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Test a diagnostic check
 */
async function test(name, fn) {
  results.total++;
  log.info(`Running: ${name}`);

  try {
    const result = await fn();
    if (result.status === "pass") {
      results.passed++;
      log.success(result.message || name);
    } else if (result.status === "warn") {
      results.warnings++;
      log.warn(result.message || name);
    } else {
      results.failed++;
      log.error(result.message || name);
    }

    results.tests.push({ name, ...result });
  } catch (err) {
    results.failed++;
    log.error(`${name}: ${err.message}`);
    results.tests.push({ name, status: "fail", error: err.message });
  }
}

/**
 * Check file exists
 */
function checkFile(filePath) {
  return existsSync(resolve(projectRoot, filePath));
}

/**
 * Check package.json structure
 */
async function checkPackageJson() {
  await test("Package.json Validity", async () => {
    const pkgPath = join(projectRoot, "package.json");
    if (!checkFile("package.json")) {
      return { status: "fail", message: "package.json not found" };
    }

    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const required = ["name", "version", "scripts", "dependencies"];
      const missing = required.filter((k) => !pkg[k]);

      if (missing.length > 0) {
        return {
          status: "fail",
          message: `Missing fields: ${missing.join(", ")}`,
        };
      }

      return { status: "pass", message: "Package.json is valid" };
    } catch (err) {
      return { status: "fail", message: `Invalid JSON: ${err.message}` };
    }
  });
}

/**
 * Check critical files exist
 */
async function checkCriticalFiles() {
  const criticalFiles = [
    "vite.config.js",
    "netlify.toml",
    "src/main.jsx",
    "src/App.jsx",
    "server/index.js",
    "netlify/functions/health.js",
  ];

  for (const file of criticalFiles) {
    await test(`File exists: ${file}`, async () => {
      if (checkFile(file)) {
        return { status: "pass", message: `${file} exists` };
      }
      return { status: "fail", message: `${file} missing` };
    });
  }
}

/**
 * Check environment configuration
 */
async function checkEnvironment() {
  await test("Node version", async () => {
    const result = await runCommand("node", ["--version"], { silent: true });
    const version = result.stdout.trim();
    const major = parseInt(version.match(/v(\d+)/)?.[1] || "0", 10);

    if (major >= 20 && major < 23) {
      return { status: "pass", message: `Node ${version} (supported)` };
    }
    return {
      status: "warn",
      message: `Node ${version} (recommended: 20.x - 22.x)`,
    };
  });

  await test("NPM version", async () => {
    const result = await runCommand("npm", ["--version"], { silent: true });
    const version = result.stdout.trim();
    const major = parseInt(version.split(".")[0], 10);

    if (major >= 10) {
      return { status: "pass", message: `NPM ${version}` };
    }
    return { status: "warn", message: `NPM ${version} (recommended: >=10)` };
  });
}

/**
 * Run linting
 */
async function checkLinting() {
  await test("ESLint", async () => {
    const result = await runCommand("npm", ["run", "lint"], { silent: true });
    if (result.code === 0) {
      return { status: "pass", message: "No linting errors" };
    }
    const errorCount = (result.stdout.match(/error/gi) || []).length;
    return { status: "fail", message: `${errorCount} linting errors found` };
  });
}

/**
 * Run unit tests
 */
async function checkTests() {
  await test("Unit Tests", async () => {
    const result = await runCommand("npm", ["run", "test:ci"], {
      silent: true,
    });
    if (result.code === 0) {
      const passedMatch = result.stdout.match(/(\d+) passed/);
      const passed = passedMatch ? passedMatch[1] : "all";
      return { status: "pass", message: `${passed} tests passed` };
    }
    const failedMatch = result.stdout.match(/(\d+) failed/);
    const failed = failedMatch ? failedMatch[1] : "some";
    return { status: "fail", message: `${failed} tests failed` };
  });

  await test("API Tests", async () => {
    const result = await runCommand("npm", ["run", "test:api"], {
      silent: true,
    });
    if (result.code === 0) {
      return { status: "pass", message: "API tests passed" };
    }
    return { status: "fail", message: "API tests failed" };
  });
}

/**
 * Test build process
 */
async function checkBuild() {
  await test("Production Build", async () => {
    log.info("Building application (this may take a minute)...");
    const result = await runCommand("npm", ["run", "build"], { silent: true });

    if (result.code === 0) {
      // Check if dist directory was created
      if (checkFile("dist/index.html")) {
        return {
          status: "pass",
          message: "Build successful, dist/index.html created",
        };
      }
      return {
        status: "warn",
        message: "Build completed but dist/index.html not found",
      };
    }

    // Extract error info
    const errorLines = result.stderr
      .split("\n")
      .filter((line) => line.includes("error") || line.includes("Error"))
      .slice(0, 3);

    return {
      status: "fail",
      message: `Build failed: ${errorLines.join("; ") || "Unknown error"}`,
    };
  });

  await test("Bundle Size Check", async () => {
    const result = await runCommand("npm", ["run", "check:bundle"], {
      silent: true,
    });
    if (result.code === 0) {
      return { status: "pass", message: "Bundle size within limits" };
    }
    return {
      status: "warn",
      message: "Bundle size check failed or exceeded limits",
    };
  });
}

/**
 * Check dependencies
 */
async function checkDependencies() {
  await test("Dependencies Installed", async () => {
    if (checkFile("node_modules")) {
      const result = await runCommand("npm", ["list", "--depth=0"], {
        silent: true,
      });
      const packageCount = (result.stdout.match(/├─/g) || []).length;
      return { status: "pass", message: `${packageCount}+ packages installed` };
    }
    return {
      status: "fail",
      message: "node_modules not found - run npm install",
    };
  });

  await test("Audit Dependencies", async () => {
    const result = await runCommand("npm", ["audit", "--audit-level=high"], {
      silent: true,
    });
    if (result.code === 0) {
      return { status: "pass", message: "No high/critical vulnerabilities" };
    }
    const vulnMatch = result.stdout.match(/(\d+) vulnerabilities/);
    const vulns = vulnMatch ? vulnMatch[1] : "some";
    return { status: "warn", message: `${vulns} vulnerabilities found` };
  });
}

/**
 * Test sample calculations
 */
async function checkCalculations() {
  await test("Calculation Functions Available", async () => {
    const calcFile = join(projectRoot, "src/utils/calculations.js");
    if (!existsSync(calcFile)) {
      return { status: "fail", message: "calculations.js not found" };
    }

    const content = readFileSync(calcFile, "utf-8");
    const functions = [
      "calculateClearance",
      "calculateSag",
      "calculateTension",
      "calculatePull",
    ];

    const missing = functions.filter(
      (fn) => !content.includes(`export function ${fn}`),
    );
    if (missing.length > 0) {
      return {
        status: "fail",
        message: `Missing functions: ${missing.join(", ")}`,
      };
    }

    return {
      status: "pass",
      message: "All core calculation functions present",
    };
  });
}

/**
 * Check database schema
 */
async function checkDatabase() {
  await test("Database Schema", async () => {
    const schemaFile = join(projectRoot, "db/schema.ts");
    if (!existsSync(schemaFile)) {
      return { status: "warn", message: "db/schema.ts not found" };
    }

    const content = readFileSync(schemaFile, "utf-8");
    if (content.includes("pgTable")) {
      return { status: "pass", message: "Database schema defined" };
    }
    return {
      status: "warn",
      message: "Schema file exists but may be incomplete",
    };
  });
}

/**
 * Check git status
 */
async function checkGitStatus() {
  await test("Git Repository", async () => {
    if (!checkFile(".git")) {
      return { status: "warn", message: "Not a git repository" };
    }

    const result = await runCommand("git", ["status", "--porcelain"], {
      silent: true,
    });
    const changedFiles = result.stdout.split("\n").filter(Boolean).length;

    if (changedFiles === 0) {
      return { status: "pass", message: "Working directory clean" };
    }
    return { status: "warn", message: `${changedFiles} uncommitted changes` };
  });

  await test("Git Branch", async () => {
    const result = await runCommand("git", ["branch", "--show-current"], {
      silent: true,
    });
    const branch = result.stdout.trim();

    if (branch === "main" || branch === "master") {
      return { status: "pass", message: `On ${branch} branch` };
    }
    return { status: "warn", message: `On ${branch} branch (not main)` };
  });
}

/**
 * Print summary
 */
function printSummary() {
  log.section("═══════════════════════════════════════════════════════");
  log.section("                  DIAGNOSTIC SUMMARY                   ");
  log.section("═══════════════════════════════════════════════════════");

  console.log(`\nTotal Tests: ${results.total}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${results.warnings}${colors.reset}\n`);

  if (results.failed > 0) {
    log.section("Failed Tests:");
    results.tests
      .filter((t) => t.status === "fail")
      .forEach((t) => {
        log.error(`${t.name}: ${t.message || t.error}`);
      });
  }

  if (results.warnings > 0) {
    log.section("Warnings:");
    results.tests
      .filter((t) => t.status === "warn")
      .forEach((t) => {
        log.warn(`${t.name}: ${t.message}`);
      });
  }

  const healthScore = Math.round((results.passed / results.total) * 100);
  log.section(`Overall Health Score: ${healthScore}%`);

  if (healthScore >= 90) {
    log.success("Application is in excellent health! 🎉");
  } else if (healthScore >= 70) {
    log.warn("Application health is good, but some issues need attention.");
  } else {
    log.error("Application needs significant attention before production.");
  }

  log.section("═══════════════════════════════════════════════════════\n");

  return results.failed === 0 ? 0 : 1;
}

/**
 * Main diagnostic runner
 */
async function runDiagnostics() {
  log.section("🔍 COMPREHENSIVE APPLICATION DIAGNOSTIC");
  log.info("Starting comprehensive diagnostic scan...\n");

  const startTime = Date.now();

  // Run all diagnostic checks
  log.section("1. Environment & Configuration");
  await checkEnvironment();
  await checkPackageJson();

  log.section("2. Critical Files");
  await checkCriticalFiles();

  log.section("3. Dependencies");
  await checkDependencies();

  log.section("4. Code Quality");
  await checkLinting();

  log.section("5. Tests");
  await checkTests();

  log.section("6. Application Components");
  await checkCalculations();
  await checkDatabase();

  log.section("7. Build Process");
  await checkBuild();

  log.section("8. Version Control");
  await checkGitStatus();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  log.info(`\nDiagnostics completed in ${duration}s`);

  const exitCode = printSummary();
  process.exit(exitCode);
}

// Run diagnostics
runDiagnostics().catch((err) => {
  log.error(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
