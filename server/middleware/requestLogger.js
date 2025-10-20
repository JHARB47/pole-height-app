// @ts-nocheck
/**
 * Request Logging Middleware
 * Lightweight wrapper delegating to central Logger + Metrics.
 */
import { Logger } from '../services/logger.js';
import { MetricsService } from '../services/metrics.js';

// Default singletons; can be replaced via setRequestLoggerMetrics for tests
const logger = new Logger();
let metrics = new MetricsService();

export function setRequestLoggerMetrics(instance) {
  if (instance) metrics = instance;
}

export function requestLogger(req, res, next) {
  const start = performance.now ? performance.now() : Date.now();

  // Attach simple request id if not present
  if (!req.id) {
    req.id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  }

  res.on('finish', () => {
    const end = performance.now ? performance.now() : Date.now();
    const duration = Math.round(end - start);

    // Log structured line
    logger.httpLog(req, res, duration);

    // Record metrics (path is normalized inside logger/metrics helpers)
    try {
      metrics.recordHttpRequest(req.method, req.originalUrl, res.statusCode, duration);
    } catch (e) {
      logger.debug('Failed to record HTTP metrics', { error: e.message });
    }

    // Slow request warning threshold (configurable via env)
    const slowMs = parseInt(process.env.SLOW_REQUEST_THRESHOLD_MS || '1500', 10);
    if (duration > slowMs) {
      logger.warn('Slow request', {
        path: req.originalUrl,
        method: req.method,
        duration_ms: duration,
        threshold_ms: slowMs,
        requestId: req.id
      });
    }
  });

  next();
}