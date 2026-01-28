#!/usr/bin/env node
/**
 * Performance Optimization Analysis
 * Identifies and reports on performance bottlenecks
 */

import { readFileSync, statSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const projectRoot = process.cwd();

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (title) =>
    console.log(
      `\n${colors.blue}${"=".repeat(60)}\n${title}\n${"=".repeat(60)}${colors.reset}\n`,
    ),
};

/**
 * Analyze bundle size
 */
function analyzeBundleSize() {
  log.section("BUNDLE SIZE ANALYSIS");

  const distPath = join(projectRoot, "dist/assets");

  try {
    const files = readdirSync(distPath);
    const jsFiles = files.filter((f) => f.endsWith(".js"));
    const cssFiles = files.filter((f) => f.endsWith(".css"));

    let totalSize = 0;
    const fileDetails = [];

    jsFiles.forEach((file) => {
      const filePath = join(distPath, file);
      const stats = statSync(filePath);
      totalSize += stats.size;
      fileDetails.push({
        name: file,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2),
        type: "js",
      });
    });

    cssFiles.forEach((file) => {
      const filePath = join(distPath, file);
      const stats = statSync(filePath);
      totalSize += stats.size;
      fileDetails.push({
        name: file,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2),
        type: "css",
      });
    });

    // Sort by size
    fileDetails.sort((a, b) => b.size - a.size);

    log.info(`Total files: ${jsFiles.length} JS, ${cssFiles.length} CSS`);
    log.info(`Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);

    log.info("Top 10 largest files:");
    fileDetails.slice(0, 10).forEach((file, idx) => {
      const icon = file.sizeKB > 100 ? "⚠" : "✓";
      console.log(`  ${idx + 1}. ${icon} ${file.name}: ${file.sizeKB} KB`);
    });

    // Recommendations
    const largeFiles = fileDetails.filter((f) => f.size > 100 * 1024);
    if (largeFiles.length > 0) {
      log.warn(
        `\n${largeFiles.length} files exceed 100KB - consider code splitting`,
      );
    } else {
      log.success("\nAll bundle chunks are optimally sized");
    }
  } catch (err) {
    log.error(`Bundle analysis failed: ${err.message}`);
  }
}

/**
 * Analyze source code complexity
 */
function analyzeCodeComplexity() {
  log.section("CODE COMPLEXITY ANALYSIS");

  const srcPath = join(projectRoot, "src");

  try {
    const files = execSync(`find ${srcPath} -name "*.jsx" -o -name "*.js"`, {
      encoding: "utf-8",
    })
      .split("\n")
      .filter(Boolean);

    let totalLines = 0;
    let totalFiles = files.length;
    const complexFiles = [];

    files.forEach((file) => {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n").length;
      totalLines += lines;

      if (lines > 300) {
        complexFiles.push({ file: file.replace(projectRoot + "/", ""), lines });
      }
    });

    log.info(`Total source files: ${totalFiles}`);
    log.info(`Total lines of code: ${totalLines.toLocaleString()}`);
    log.info(
      `Average lines per file: ${Math.round(totalLines / totalFiles)}\n`,
    );

    if (complexFiles.length > 0) {
      log.warn("Files exceeding 300 lines (consider refactoring):");
      complexFiles
        .sort((a, b) => b.lines - a.lines)
        .forEach(({ file, lines }) => {
          console.log(`  • ${file}: ${lines} lines`);
        });
    } else {
      log.success("All source files are reasonably sized");
    }
  } catch (err) {
    log.error(`Code complexity analysis failed: ${err.message}`);
  }
}

/**
 * Analyze dependencies
 */
function analyzeDependencies() {
  log.section("DEPENDENCY ANALYSIS");

  try {
    const packagePath = join(projectRoot, "package.json");
    const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));

    const prodDeps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});
    const optDeps = Object.keys(pkg.optionalDependencies || {});

    log.info(`Production dependencies: ${prodDeps.length}`);
    log.info(`Dev dependencies: ${devDeps.length}`);
    log.info(`Optional dependencies: ${optDeps.length}`);
    log.info(`Total: ${prodDeps.length + devDeps.length + optDeps.length}\n`);

    // Check for heavy dependencies
    const heavyDeps = ["@sentry/react", "@sentry/node", "react-dom", "zustand"];

    const foundHeavy = prodDeps.filter((dep) =>
      heavyDeps.some((heavy) => dep.includes(heavy)),
    );

    if (foundHeavy.length > 0) {
      log.info("Notable production dependencies:");
      foundHeavy.forEach((dep) => {
        console.log(`  • ${dep}: ${pkg.dependencies[dep]}`);
      });
    }
  } catch (err) {
    log.error(`Dependency analysis failed: ${err.message}`);
  }
}

/**
 * Analyze performance metrics
 */
function analyzePerformanceMetrics() {
  log.section("PERFORMANCE METRICS");

  const metrics = {
    buildTime: "N/A",
    testTime: "N/A",
    bundleSize: "N/A",
  };

  // Try to extract build time from dist
  try {
    const distPath = join(projectRoot, "dist");
    const stats = statSync(distPath);
    metrics.distCreated = stats.mtime.toISOString();
  } catch {
    // Ignore
  }

  log.info("Performance Summary:");
  Object.entries(metrics).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
}

/**
 * Suggest optimizations
 */
function suggestOptimizations() {
  log.section("OPTIMIZATION RECOMMENDATIONS");

  const recommendations = [
    {
      priority: "HIGH",
      item: "Enable code splitting for large components",
      impact: "Reduce initial bundle size by 20-30%",
    },
    {
      priority: "MEDIUM",
      item: "Implement lazy loading for routes",
      impact: "Faster initial page load",
    },
    {
      priority: "MEDIUM",
      item: "Optimize images and assets",
      impact: "Reduce bandwidth usage",
    },
    {
      priority: "LOW",
      item: "Consider using a CDN for static assets",
      impact: "Improved global performance",
    },
  ];

  recommendations.forEach(({ priority, item, impact }) => {
    const icon =
      priority === "HIGH" ? "🔴" : priority === "MEDIUM" ? "🟡" : "🟢";
    console.log(`${icon} [${priority}] ${item}`);
    console.log(`   Impact: ${impact}\n`);
  });
}

/**
 * Main analysis runner
 */
function runAnalysis() {
  console.log(`\n${colors.cyan}${"█".repeat(60)}`);
  console.log("  PERFORMANCE OPTIMIZATION ANALYSIS");
  console.log(`${"█".repeat(60)}${colors.reset}\n`);

  analyzeBundleSize();
  analyzeCodeComplexity();
  analyzeDependencies();
  analyzePerformanceMetrics();
  suggestOptimizations();

  log.section("ANALYSIS COMPLETE");
  log.success(
    "Review recommendations above to optimize application performance\n",
  );
}

// Run analysis
runAnalysis();
