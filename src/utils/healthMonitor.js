/**
 * Enhanced Application Health Monitor
 * Provides real-time health checks for all application subsystems
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import process from "process";

const projectRoot = process.cwd();

/**
 * Health Check Status
 */
export const HealthStatus = {
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  UNHEALTHY: "unhealthy",
  UNKNOWN: "unknown",
};

/**
 * Health Check Categories
 */
export const HealthCategory = {
  CRITICAL: "critical",
  IMPORTANT: "important",
  OPTIONAL: "optional",
};

/**
 * Health Check Registry
 */
class HealthCheckRegistry {
  constructor() {
    this.checks = new Map();
    this.results = new Map();
  }

  /**
   * Register a health check
   */
  register(name, checkFn, category = HealthCategory.IMPORTANT) {
    this.checks.set(name, { checkFn, category });
  }

  /**
   * Run a single health check
   */
  async runCheck(name) {
    const check = this.checks.get(name);
    if (!check) {
      return {
        status: HealthStatus.UNKNOWN,
        message: "Check not found",
        category: HealthCategory.OPTIONAL,
      };
    }

    const startTime = Date.now();
    try {
      const result = await check.checkFn();
      const duration = Date.now() - startTime;

      return {
        ...result,
        category: check.category,
        duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: error.message,
        category: check.category,
        error: error.stack,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Run all health checks
   */
  async runAll() {
    const results = {};

    for (const [name, _check] of this.checks) {
      results[name] = await this.runCheck(name);
    }

    this.results = results;
    return results;
  }

  /**
   * Get overall health status
   */
  getOverallStatus(results = this.results) {
    if (Object.keys(results).length === 0) {
      return HealthStatus.UNKNOWN;
    }

    const criticalChecks = Object.entries(results).filter(
      ([, result]) => result.category === HealthCategory.CRITICAL,
    );

    const importantChecks = Object.entries(results).filter(
      ([, result]) => result.category === HealthCategory.IMPORTANT,
    );

    // If any critical check is unhealthy, overall is unhealthy
    if (
      criticalChecks.some(
        ([, result]) => result.status === HealthStatus.UNHEALTHY,
      )
    ) {
      return HealthStatus.UNHEALTHY;
    }

    // If any important check is unhealthy, overall is degraded
    if (
      importantChecks.some(
        ([, result]) => result.status === HealthStatus.UNHEALTHY,
      )
    ) {
      return HealthStatus.DEGRADED;
    }

    // If all checks are healthy or only optional checks are degraded
    return HealthStatus.HEALTHY;
  }

  /**
   * Get health summary
   */
  getSummary(results = this.results) {
    const summary = {
      overallStatus: this.getOverallStatus(results),
      timestamp: new Date().toISOString(),
      checks: {
        total: Object.keys(results).length,
        healthy: 0,
        degraded: 0,
        unhealthy: 0,
        unknown: 0,
      },
      categories: {
        critical: { total: 0, healthy: 0 },
        important: { total: 0, healthy: 0 },
        optional: { total: 0, healthy: 0 },
      },
      details: results,
    };

    Object.entries(results).forEach(([, result]) => {
      summary.checks[result.status]++;

      const cat = result.category;
      summary.categories[cat].total++;
      if (result.status === HealthStatus.HEALTHY) {
        summary.categories[cat].healthy++;
      }
    });

    return summary;
  }
}

// Create global registry
export const healthRegistry = new HealthCheckRegistry();

/**
 * Core health checks
 */

// Check if calculations module loads
healthRegistry.register(
  "calculations_module",
  async () => {
    try {
      const calcPath = resolve(projectRoot, "src/utils/calculations.js");
      if (!existsSync(calcPath)) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: "Calculations module not found",
        };
      }

      const content = readFileSync(calcPath, "utf-8");
      const functionCount = (content.match(/export function/g) || []).length;

      if (functionCount > 0) {
        return {
          status: HealthStatus.HEALTHY,
          message: `Calculations module loaded (${functionCount} functions)`,
          metadata: { functionCount },
        };
      }

      return {
        status: HealthStatus.DEGRADED,
        message: "Calculations module has no exported functions",
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Failed to load calculations: ${error.message}`,
      };
    }
  },
  HealthCategory.CRITICAL,
);

// Check if store is accessible
healthRegistry.register(
  "state_store",
  async () => {
    try {
      const storePath = resolve(projectRoot, "src/utils/store.js");
      if (!existsSync(storePath)) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: "Store module not found",
        };
      }

      return {
        status: HealthStatus.HEALTHY,
        message: "Store module available",
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Store check failed: ${error.message}`,
      };
    }
  },
  HealthCategory.CRITICAL,
);

// Check if geodata functions exist
healthRegistry.register(
  "geodata_module",
  async () => {
    try {
      const geodataPath = resolve(projectRoot, "src/utils/geodata.js");
      if (!existsSync(geodataPath)) {
        return {
          status: HealthStatus.DEGRADED,
          message: "Geodata module not found",
        };
      }

      const content = readFileSync(geodataPath, "utf-8");
      if (content.includes("buildGeoJSON")) {
        return {
          status: HealthStatus.HEALTHY,
          message: "Geodata module operational",
        };
      }

      return {
        status: HealthStatus.DEGRADED,
        message: "Geodata module incomplete",
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Geodata check failed: ${error.message}`,
      };
    }
  },
  HealthCategory.IMPORTANT,
);

// Check import/export modules
healthRegistry.register(
  "import_export",
  async () => {
    try {
      const importerPath = resolve(projectRoot, "src/utils/importers.js");
      const exporterPath = resolve(projectRoot, "src/utils/exporters.js");

      const importerExists = existsSync(importerPath);
      const exporterExists = existsSync(exporterPath);

      if (importerExists && exporterExists) {
        return {
          status: HealthStatus.HEALTHY,
          message: "Import/Export modules available",
        };
      } else if (importerExists || exporterExists) {
        return {
          status: HealthStatus.DEGRADED,
          message: "Some import/export modules missing",
        };
      }

      return {
        status: HealthStatus.UNHEALTHY,
        message: "Import/Export modules not found",
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Import/Export check failed: ${error.message}`,
      };
    }
  },
  HealthCategory.IMPORTANT,
);

// Check build configuration
healthRegistry.register(
  "build_config",
  async () => {
    try {
      const viteConfigPath = resolve(projectRoot, "vite.config.js");
      if (!existsSync(viteConfigPath)) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: "Vite config not found",
        };
      }

      return {
        status: HealthStatus.HEALTHY,
        message: "Build configuration present",
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Build config check failed: ${error.message}`,
      };
    }
  },
  HealthCategory.CRITICAL,
);

// Check deployment configuration
healthRegistry.register(
  "deployment_config",
  async () => {
    try {
      const netlifyPath = resolve(projectRoot, "netlify.toml");
      if (!existsSync(netlifyPath)) {
        return {
          status: HealthStatus.DEGRADED,
          message: "Netlify config not found",
        };
      }

      const content = readFileSync(netlifyPath, "utf-8");
      if (content.includes("[build]") && content.includes("command")) {
        return {
          status: HealthStatus.HEALTHY,
          message: "Deployment configuration complete",
        };
      }

      return {
        status: HealthStatus.DEGRADED,
        message: "Deployment configuration incomplete",
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Deployment config check failed: ${error.message}`,
      };
    }
  },
  HealthCategory.IMPORTANT,
);

// Check package.json
healthRegistry.register(
  "package_manifest",
  async () => {
    try {
      const packagePath = resolve(projectRoot, "package.json");
      const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));

      const requiredFields = ["name", "version", "scripts", "dependencies"];
      const missing = requiredFields.filter((field) => !pkg[field]);

      if (missing.length === 0) {
        return {
          status: HealthStatus.HEALTHY,
          message: `Package manifest valid (v${pkg.version})`,
          metadata: { version: pkg.version },
        };
      }

      return {
        status: HealthStatus.UNHEALTHY,
        message: `Package manifest missing: ${missing.join(", ")}`,
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Package manifest check failed: ${error.message}`,
      };
    }
  },
  HealthCategory.CRITICAL,
);

/**
 * Run health checks and print results
 */
export async function runHealthChecks() {
  console.log("\n🏥 Running Application Health Checks...\n");

  const results = await healthRegistry.runAll();
  const summary = healthRegistry.getSummary(results);

  // Print results
  Object.entries(results).forEach(([name, result]) => {
    const icon =
      result.status === HealthStatus.HEALTHY
        ? "✓"
        : result.status === HealthStatus.DEGRADED
          ? "⚠"
          : "✗";
    const color =
      result.status === HealthStatus.HEALTHY
        ? "\x1b[32m"
        : result.status === HealthStatus.DEGRADED
          ? "\x1b[33m"
          : "\x1b[31m";

    console.log(`${color}${icon} ${name}:\x1b[0m ${result.message}`);
    if (result.duration) {
      console.log(`  Duration: ${result.duration}ms`);
    }
  });

  console.log("\n" + "=".repeat(60));
  console.log(`Overall Status: ${summary.overallStatus.toUpperCase()}`);
  console.log(`Healthy: ${summary.checks.healthy}/${summary.checks.total}`);
  console.log(`Degraded: ${summary.checks.degraded}`);
  console.log(`Unhealthy: ${summary.checks.unhealthy}`);
  console.log("=".repeat(60) + "\n");

  return summary;
}

// Export for use in other modules
export default healthRegistry;
