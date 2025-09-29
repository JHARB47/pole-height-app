// @ts-nocheck
/**
 * Comprehensive Logging Service
 * Winston-based logging with multiple transports and structured logging
 */
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Logger {
  constructor() {
    this.logger = this.createLogger();
  }

  createLogger() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Custom format for structured logging
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const logEntry = {
          timestamp,
          level,
          message,
          service: 'poleplan-pro-api',
          environment: nodeEnv,
          ...(stack && { stack }),
          ...meta
        };
        return JSON.stringify(logEntry);
      })
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      })
    );

    const transports = [];

    // Console transport for all environments
    transports.push(new winston.transports.Console({
      level: logLevel,
      format: nodeEnv === 'production' ? logFormat : consoleFormat
    }));

    // File transports for production
    if (nodeEnv === 'production') {
      // Application logs
      transports.push(new winston.transports.File({
        filename: path.join(__dirname, '../logs/app.log'),
        level: 'info',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      }));

      // Error logs
      transports.push(new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      }));

      // Audit logs (separate file for compliance)
      transports.push(new winston.transports.File({
        filename: path.join(__dirname, '../logs/audit.log'),
        level: 'info',
        format: logFormat,
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 10,
        tailable: true
      }));
    }

    return winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
      // Don't exit on handled exceptions
      exitOnError: false
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    };
    this.logger.error(message, errorMeta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  // Specialized logging methods
  auditLog(action, userId, resource, details = {}) {
    this.logger.info('AUDIT', {
      audit: true,
      action,
      userId,
      resource,
      details,
      timestamp: new Date().toISOString()
    });
  }

  securityLog(event, details = {}) {
    this.logger.warn('SECURITY', {
      security: true,
      event,
      details,
      timestamp: new Date().toISOString()
    });
  }

  performanceLog(operation, duration, details = {}) {
    this.logger.info('PERFORMANCE', {
      performance: true,
      operation,
      duration_ms: duration,
      details,
      timestamp: new Date().toISOString()
    });
  }

  httpLog(req, res, responseTime) {
    const logData = {
      http: true,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      response_time_ms: responseTime,
      ip: req.ip,
      user_agent: req.get('User-Agent'),
      user_id: req.user?.id,
      timestamp: new Date().toISOString()
    };

    if (res.statusCode >= 400) {
      this.logger.warn('HTTP_ERROR', logData);
    } else {
      this.logger.info('HTTP_REQUEST', logData);
    }
  }
}