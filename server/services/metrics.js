// @ts-nocheck
/**
 * Metrics and Monitoring Service
 * Collects application metrics, performance data, and system health
 */
import { Logger } from "./logger.js";
import { DatabaseService } from "./database.js";

export class MetricsService {
  constructor() {
    this.logger = new Logger();
    this.metrics = new Map();
    this.counters = new Map();
    this.timers = new Map();
    this.histograms = new Map();
    this.gauges = new Map();

    // Initialize default metrics
    this.initializeDefaultMetrics();
  }

  initializeDefaultMetrics() {
    // HTTP metrics
    this.counters.set("http_requests_total", 0);
    this.counters.set("http_errors_total", 0);
    this.histograms.set("http_request_duration", []);

    // Database metrics
    this.counters.set("db_queries_total", 0);
    this.counters.set("db_errors_total", 0);
    this.histograms.set("db_query_duration", []);

    // Application metrics
    this.counters.set("user_registrations_total", 0);
    this.counters.set("user_logins_total", 0);
    this.counters.set("projects_created_total", 0);
    this.counters.set("calculations_performed_total", 0);
    this.counters.set("exports_generated_total", 0);

    // System metrics
    this.gauges.set("active_connections", 0);
    this.gauges.set("memory_usage_bytes", 0);
    this.gauges.set("cpu_usage_percent", 0);
  }

  start() {
    // Start periodic metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds

    this.logger.info("Metrics service started");
  }

  stop() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    this.logger.info("Metrics service stopped");
  }

  // Counter methods
  incrementCounter(name, value = 1, labels = {}) {
    const key = this.getMetricKey(name, labels);
    const currentValue = this.counters.get(key) || 0;
    this.counters.set(key, currentValue + value);

    this.logger.debug(`Counter incremented: ${key} = ${currentValue + value}`);
  }

  getCounter(name, labels = {}) {
    const key = this.getMetricKey(name, labels);
    return this.counters.get(key) || 0;
  }

  // Gauge methods
  setGauge(name, value, labels = {}) {
    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, value);
  }

  getGauge(name, labels = {}) {
    const key = this.getMetricKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  // Histogram methods
  recordHistogram(name, value, labels = {}) {
    const key = this.getMetricKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }

    const values = this.histograms.get(key);
    values.push({
      value,
      timestamp: Date.now(),
    });

    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }

  getHistogramStats(name, labels = {}) {
    const key = this.getMetricKey(name, labels);
    const values = this.histograms.get(key) || [];

    if (values.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, p95: 0, p99: 0 };
    }

    const sortedValues = values.map((v) => v.value).sort((a, b) => a - b);
    const count = sortedValues.length;
    const min = sortedValues[0];
    const max = sortedValues[count - 1];
    const avg = sortedValues.reduce((sum, val) => sum + val, 0) / count;
    const p95 = sortedValues[Math.floor(count * 0.95)] || 0;
    const p99 = sortedValues[Math.floor(count * 0.99)] || 0;

    return { count, min, max, avg, p95, p99 };
  }

  // Timer methods
  startTimer(name, labels = {}) {
    const key = this.getMetricKey(name, labels);
    this.timers.set(key, Date.now());
    return key;
  }

  endTimer(timerKey) {
    const startTime = this.timers.get(timerKey);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.timers.delete(timerKey);

      // Also record in histogram
      const [name] = timerKey.split("|");
      this.recordHistogram(`${name}_duration`, duration);

      return duration;
    }
    return 0;
  }

  // HTTP metrics helpers
  recordHttpRequest(method, path, statusCode, duration) {
    const labels = {
      method,
      path: this.normalizePath(path),
      status: statusCode,
    };

    this.incrementCounter("http_requests_total", 1, labels);
    this.recordHistogram("http_request_duration", duration, labels);

    if (statusCode >= 400) {
      this.incrementCounter("http_errors_total", 1, labels);
    }
  }

  // Database metrics helpers
  recordDbQuery(operation, duration, success = true) {
    const labels = { operation };

    this.incrementCounter("db_queries_total", 1, labels);
    this.recordHistogram("db_query_duration", duration, labels);

    if (!success) {
      this.incrementCounter("db_errors_total", 1, labels);
    }
  }

  // Application event helpers
  recordUserRegistration(method = "local") {
    this.incrementCounter("user_registrations_total", 1, { method });
  }

  recordUserLogin(method = "local") {
    this.incrementCounter("user_logins_total", 1, { method });
  }

  recordProjectCreated() {
    this.incrementCounter("projects_created_total");
  }

  recordCalculationPerformed(type) {
    this.incrementCounter("calculations_performed_total", 1, { type });
  }

  recordExportGenerated(format) {
    this.incrementCounter("exports_generated_total", 1, { format });
  }

  // System metrics collection
  collectSystemMetrics() {
    try {
      const memUsage = process.memoryUsage();
      this.setGauge("memory_usage_bytes", memUsage.rss);
      this.setGauge("memory_heap_used_bytes", memUsage.heapUsed);
      this.setGauge("memory_heap_total_bytes", memUsage.heapTotal);

      // CPU usage (simplified)
      const cpuUsage = process.cpuUsage();
      this.setGauge("cpu_user_microseconds", cpuUsage.user);
      this.setGauge("cpu_system_microseconds", cpuUsage.system);

      // Process uptime
      this.setGauge("process_uptime_seconds", process.uptime());

      // Event loop lag (simplified)
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
        this.setGauge("event_loop_lag_milliseconds", lag);
      });
    } catch (error) {
      this.logger.error("Failed to collect system metrics:", error);
    }
  }

  // Get all metrics
  async getAllMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: {},
    };

    // Add histogram statistics
    for (const [key] of this.histograms) {
      const [name] = key.split("|");
      metrics.histograms[key] = this.getHistogramStats(name);
    }

    return metrics;
  }

  // Get error rate for a time window (in minutes)
  async getErrorRate(windowMinutes = 5) {
    try {
      const totalRequests = this.getCounter("http_requests_total");
      const totalErrors = this.getCounter("http_errors_total");

      if (totalRequests === 0) return 0;

      return totalErrors / totalRequests;
    } catch (error) {
      this.logger.error("Failed to calculate error rate:", error);
      return 0;
    }
  }

  // Helper methods
  getMetricKey(name, labels = {}) {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}="${value}"`)
      .join(",");

    return labelStr ? `${name}|${labelStr}` : name;
  }

  normalizePath(path) {
    // Normalize paths to reduce cardinality
    return path
      .replace(/\/\d+/g, "/:id") // Replace numeric IDs
      .replace(/\/[a-f0-9-]{36}/g, "/:uuid") // Replace UUIDs
      .replace(/\?.*/, ""); // Remove query parameters
  }

  // Health check method
  getHealthStatus() {
    const errorRate =
      this.getCounter("http_errors_total") /
      Math.max(this.getCounter("http_requests_total"), 1);
    const memoryUsage = this.getGauge("memory_usage_bytes");
    const maxMemory = 1024 * 1024 * 1024; // 1GB threshold

    return {
      status:
        errorRate < 0.1 && memoryUsage < maxMemory ? "healthy" : "degraded",
      error_rate: errorRate,
      memory_usage_mb: Math.round(memoryUsage / 1024 / 1024),
      uptime_seconds: this.getGauge("process_uptime_seconds"),
    };
  }
}
