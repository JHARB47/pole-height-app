// @ts-nocheck
/**
 * Health Check and Monitoring Routes
 * Comprehensive system health reporting and metrics
 */
import express from "express";
import { db } from "../services/db.js";
import { Logger } from "../services/logger.js";
import { MetricsService } from "../services/metrics.js";

const router = express.Router();
const logger = new Logger();
const metrics = new MetricsService();

/**
 * Basic health check - always available
 */
router.get("/", async (req, res) => {
  try {
    const startTime = Date.now();

    // Basic system info
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "poleplan-pro-api",
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node_version: process.version,
    };

    // Quick database ping if available
    if (db.isInitialized) {
      try {
        await db.query("SELECT 1");
        healthData.database = { status: "connected" };
      } catch (error) {
        healthData.database = { status: "error", message: error.message };
        healthData.status = "degraded";
      }
    } else {
      healthData.database = { status: "not_initialized" };
    }

    const responseTime = Date.now() - startTime;
    healthData.response_time_ms = responseTime;

    // Set appropriate status code
    const statusCode = healthData.status === "healthy" ? 200 : 503;

    res.status(statusCode).json(healthData);
  } catch (error) {
    logger.error("Health check error:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * Detailed health check with all services
 */
router.get("/detailed", async (req, res) => {
  try {
    const startTime = Date.now();
    const checks = {};
    let overallStatus = "healthy";

    // Database health
    try {
      if (db.isInitialized) {
        const dbHealth = await db.getHealthStatus();
        checks.database = dbHealth;
        if (dbHealth.status !== "healthy") {
          overallStatus = "degraded";
        }
      } else {
        checks.database = {
          status: "not_initialized",
          message: "Database service not initialized",
        };
        overallStatus = "degraded";
      }
    } catch (error) {
      checks.database = {
        status: "unhealthy",
        error: error.message,
      };
      overallStatus = "unhealthy";
    }

    // System metrics
    const systemMetrics = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      load_average: require("os").loadavg(),
      platform: process.platform,
      arch: process.arch,
    };

    // Recent error rate (last 5 minutes)
    try {
      const errorRate = await metrics.getErrorRate(5);
      checks.error_rate = {
        status: errorRate > 0.1 ? "warning" : "healthy",
        rate: errorRate,
        threshold: 0.1,
      };

      if (errorRate > 0.1) {
        overallStatus = "degraded";
      }
    } catch (error) {
      checks.error_rate = {
        status: "unknown",
        error: error.message,
      };
    }

    // Check external services
    checks.external_services = await checkExternalServices();

    const responseTime = Date.now() - startTime;

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      service: "poleplan-pro-api",
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      system: systemMetrics,
      checks: checks,
    };

    const statusCode =
      overallStatus === "healthy"
        ? 200
        : overallStatus === "degraded"
          ? 200
          : 503;

    res.status(statusCode).json(healthData);
  } catch (error) {
    logger.error("Detailed health check error:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * Liveness probe for Kubernetes
 */
router.get("/live", (req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe for Kubernetes
 */
router.get("/ready", async (req, res) => {
  try {
    // Check if all critical services are ready
    const isReady = db.isInitialized;

    if (isReady) {
      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: "not_ready",
        timestamp: new Date().toISOString(),
        reason: "Database not initialized",
      });
    }
  } catch (error) {
    logger.error("Readiness check error:", error);
    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * System metrics endpoint
 */
router.get("/metrics", async (req, res) => {
  try {
    const metricsData = await metrics.getAllMetrics();

    // Format for Prometheus if requested
    const acceptHeader = req.get("Accept");
    if (acceptHeader && acceptHeader.includes("text/plain")) {
      const prometheusFormat = formatPrometheusMetrics(metricsData);
      res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
      res.send(prometheusFormat);
    } else {
      res.json(metricsData);
    }
  } catch (error) {
    logger.error("Metrics endpoint error:", error);
    res.status(500).json({
      error: "Failed to retrieve metrics",
      message: error.message,
    });
  }
});

/**
 * Database performance metrics
 */
router.get("/db-stats", async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `);

    const connections = await db.query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
    `);

    res.json({
      timestamp: new Date().toISOString(),
      table_stats: stats.rows,
      connection_stats: connections.rows[0],
    });
  } catch (error) {
    logger.error("DB stats error:", error);
    res.status(500).json({
      error: "Failed to retrieve database statistics",
      message: error.message,
    });
  }
});

/**
 * Check external service dependencies
 */
async function checkExternalServices() {
  const services = {};

  // Check if external APIs are accessible
  const externalChecks = [
    {
      name: "openstreetmap",
      url: "https://tile.openstreetmap.org/0/0/0.png",
      timeout: 5000,
    },
    {
      name: "unpkg_cdn",
      url: "https://unpkg.com/@mapbox/shp-write@latest/package.json",
      timeout: 5000,
    },
  ];

  for (const check of externalChecks) {
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), check.timeout);

      const response = await fetch(check.url, {
        signal: controller.signal,
        method: "HEAD",
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - start;

      services[check.name] = {
        status: response.ok ? "healthy" : "unhealthy",
        response_code: response.status,
        response_time_ms: responseTime,
      };
    } catch (error) {
      services[check.name] = {
        status: "unhealthy",
        error: error.message,
      };
    }
  }

  return services;
}

/**
 * Format metrics for Prometheus
 */
function formatPrometheusMetrics(metrics) {
  let output = "";

  // Add help and type information
  output += "# HELP poleplan_http_requests_total Total HTTP requests\n";
  output += "# TYPE poleplan_http_requests_total counter\n";

  // Add metrics data (simplified example)
  for (const [key, value] of Object.entries(metrics)) {
    if (typeof value === "number") {
      output += `poleplan_${key} ${value}\n`;
    }
  }

  return output;
}

export { router as healthRouter };
