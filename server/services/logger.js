// @ts-nocheck
import pino from "pino";

const nodeEnv = process.env.NODE_ENV || "development";
const logLevel = process.env.LOG_LEVEL || "info";
const serviceName = process.env.SERVICE_NAME || "poleplan-pro-api";

const baseLogger = pino({
  name: serviceName,
  level: logLevel,
  transport:
    nodeEnv === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

function enrich(meta = {}) {
  const enriched = { environment: nodeEnv, service: serviceName, ...meta };
  if (enriched.timestamp == null) {
    enriched.timestamp = new Date().toISOString();
  }
  return enriched;
}

export class Logger {
  constructor(bindings = {}) {
    this.logger = baseLogger.child(bindings);
  }

  info(message, meta = {}) {
    this.logger.info(enrich(meta), message);
  }

  warn(message, meta = {}) {
    this.logger.warn(enrich(meta), message);
  }

  error(message, error = null, meta = {}) {
    const errorMeta = enrich(meta);
    if (error) {
      errorMeta.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }
    this.logger.error(errorMeta, message);
  }

  debug(message, meta = {}) {
    this.logger.debug(enrich(meta), message);
  }

  auditLog(action, userId, resource, details = {}) {
    this.logger.info(
      enrich({
        audit: true,
        action,
        userId,
        resource,
        details,
      }),
      "AUDIT",
    );
  }

  securityLog(event, details = {}) {
    this.logger.warn(
      enrich({
        security: true,
        event,
        details,
      }),
      "SECURITY",
    );
  }

  performanceLog(operation, duration, details = {}) {
    this.logger.info(
      enrich({
        performance: true,
        operation,
        duration_ms: duration,
        details,
      }),
      "PERFORMANCE",
    );
  }

  httpLog(req, res, responseTime) {
    const payload = enrich({
      http: true,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      response_time_ms: responseTime,
      ip: req.ip,
      user_agent: req.get?.("User-Agent"),
      user_id: req.user?.id,
    });

    if (res.statusCode >= 400) {
      this.logger.warn(payload, "HTTP_ERROR");
    } else {
      this.logger.info(payload, "HTTP_REQUEST");
    }
  }
}

export const logger = new Logger();
