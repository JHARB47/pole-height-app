// @ts-nocheck
/**
 * Audit Logging Middleware
 * Comprehensive audit trail for all API operations
 */
import { db } from "../services/db.js";
import { Logger } from "../services/logger.js";

const logger = new Logger();

/**
 * Audit Middleware - logs all API operations
 */
export const auditMiddleware = (req, res, next) => {
  // Store original res.json to capture response data
  const originalJson = res.json;
  let responseBody = null;
  let responseStatusCode = null;

  res.json = function (body) {
    responseBody = body;
    responseStatusCode = res.statusCode;
    return originalJson.call(this, body);
  };

  // Capture request start time
  const startTime = Date.now();

  // Continue with request processing
  res.on("finish", async () => {
    try {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Determine if this operation should be audited
      if (shouldAuditRequest(req)) {
        const auditData = {
          user_id: req.user?.id || null,
          action: extractAction(req),
          resource_type: extractResourceType(req),
          resource_id: extractResourceId(req),
          details: {
            method: req.method,
            path: req.originalUrl,
            query: req.query,
            body: sanitizeRequestBody(req.body),
            response_status: responseStatusCode,
            response_time_ms: duration,
            api_key_id:
              req.authMethod === "api_key" ? req.user?.api_key_id : null,
            user_agent: req.get("User-Agent"),
            referer: req.get("Referer"),
          },
          ip_address: req.ip,
          user_agent: req.get("User-Agent"),
        };

        // Log successful operations and errors differently
        if (responseStatusCode >= 400) {
          auditData.details.error = responseBody?.error || "Unknown error";
          auditData.details.error_code = responseBody?.code || "UNKNOWN_ERROR";
        }

        await db.logAuditEvent(auditData);

        // Also log to application logger for important events
        if (shouldLogToAppLogger(req, responseStatusCode)) {
          const logLevel = responseStatusCode >= 400 ? "warn" : "info";
          logger[logLevel](`Audit: ${auditData.action}`, {
            userId: auditData.user_id,
            resource: `${auditData.resource_type}:${auditData.resource_id}`,
            status: responseStatusCode,
            duration: duration,
          });
        }
      }
    } catch (error) {
      logger.error("Audit logging failed:", error);
      // Don't fail the request if audit logging fails
    }
  });

  next();
};

/**
 * Determine if request should be audited
 */
function shouldAuditRequest(req) {
  // Skip health checks and static resources
  const skipPaths = ["/health", "/api/health", "/favicon.ico", "/robots.txt"];

  if (skipPaths.some((path) => req.originalUrl.startsWith(path))) {
    return false;
  }

  // Skip GET requests to certain endpoints
  if (req.method === "GET") {
    const skipGetPaths = [
      "/api/v1/user/me", // User profile requests
      "/api/metrics", // Metrics requests
    ];

    if (skipGetPaths.some((path) => req.originalUrl.startsWith(path))) {
      return false;
    }
  }

  // Audit all other API requests
  return (
    req.originalUrl.startsWith("/api/") || req.originalUrl.startsWith("/auth/")
  );
}

/**
 * Extract action from request
 */
function extractAction(req) {
  const method = req.method.toLowerCase();
  const path = req.originalUrl.toLowerCase();

  // Authentication actions
  if (path.includes("/auth/login")) return "user_login";
  if (path.includes("/auth/register")) return "user_register";
  if (path.includes("/auth/logout")) return "user_logout";
  if (path.includes("/auth/refresh")) return "token_refresh";

  // Project actions
  if (path.includes("/projects")) {
    if (method === "post") return "project_create";
    if (method === "put" || method === "patch") return "project_update";
    if (method === "delete") return "project_delete";
    if (method === "get") return "project_read";
  }

  // User management actions
  if (path.includes("/users")) {
    if (method === "post") return "user_create";
    if (method === "put" || method === "patch") return "user_update";
    if (method === "delete") return "user_delete";
    if (method === "get") return "user_read";
  }

  // API key actions
  if (path.includes("/api-keys")) {
    if (method === "post") return "api_key_create";
    if (method === "put" || method === "patch") return "api_key_update";
    if (method === "delete") return "api_key_delete";
    if (method === "get") return "api_key_read";
  }

  // Export actions
  if (path.includes("/export")) {
    return "data_export";
  }

  // Import actions
  if (path.includes("/import")) {
    return "data_import";
  }

  // Calculations
  if (path.includes("/calculate")) {
    return "calculation_perform";
  }

  // Generic action based on HTTP method
  const methodActions = {
    get: "read",
    post: "create",
    put: "update",
    patch: "update",
    delete: "delete",
  };

  return methodActions[method] || "unknown_action";
}

/**
 * Extract resource type from request
 */
function extractResourceType(req) {
  const path = req.originalUrl.toLowerCase();

  if (path.includes("/projects")) return "project";
  if (path.includes("/users")) return "user";
  if (path.includes("/api-keys")) return "api_key";
  if (path.includes("/organizations")) return "organization";
  if (path.includes("/auth")) return "authentication";
  if (path.includes("/admin")) return "admin";
  if (path.includes("/health")) return "system";
  if (path.includes("/metrics")) return "metrics";

  return "unknown";
}

/**
 * Extract resource ID from request
 */
function extractResourceId(req) {
  // Try to get ID from URL parameters
  if (req.params.id) return req.params.id;
  if (req.params.projectId) return req.params.projectId;
  if (req.params.userId) return req.params.userId;
  if (req.params.keyId) return req.params.keyId;
  if (req.params.organizationId) return req.params.organizationId;

  // Try to get ID from request body
  if (req.body && typeof req.body === "object") {
    if (req.body.id) return req.body.id;
    if (req.body.project_id) return req.body.project_id;
    if (req.body.user_id) return req.body.user_id;
  }

  return null;
}

/**
 * Sanitize request body for audit logging
 */
function sanitizeRequestBody(body) {
  if (!body || typeof body !== "object") {
    return body;
  }

  const sanitized = { ...body };

  // Remove sensitive fields
  const sensitiveFields = [
    "password",
    "password_hash",
    "token",
    "refresh_token",
    "access_token",
    "api_key",
    "secret",
    "private_key",
    "credit_card",
    "ssn",
    "social_security",
  ];

  function removeSensitiveData(obj) {
    if (Array.isArray(obj)) {
      return obj.map((item) => removeSensitiveData(item));
    }

    if (obj && typeof obj === "object") {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some((field) => lowerKey.includes(field))) {
          cleaned[key] = "[REDACTED]";
        } else if (typeof value === "object") {
          cleaned[key] = removeSensitiveData(value);
        } else {
          cleaned[key] = value;
        }
      }
      return cleaned;
    }

    return obj;
  }

  return removeSensitiveData(sanitized);
}

/**
 * Determine if event should be logged to application logger
 */
function shouldLogToAppLogger(req, statusCode) {
  // Log all errors
  if (statusCode >= 400) return true;

  // Log important business events
  const importantActions = [
    "/auth/login",
    "/auth/register",
    "/auth/logout",
    "/api/projects",
    "/api/users",
    "/api/api-keys",
  ];

  return importantActions.some((path) => req.originalUrl.includes(path));
}

/**
 * Security Event Audit Middleware
 * Special handling for security-sensitive events
 */
export const securityAuditMiddleware = (eventType) => {
  return async (req, res, next) => {
    // Store original response methods
    const originalStatus = res.status;
    const originalJson = res.json;

    let statusCode = 200;
    let responseData = null;

    res.status = function (code) {
      statusCode = code;
      return originalStatus.call(this, code);
    };

    res.json = function (data) {
      responseData = data;
      return originalJson.call(this, data);
    };

    res.on("finish", async () => {
      try {
        // Log security events regardless of outcome
        await db.logAuditEvent({
          user_id: req.user?.id || null,
          action: `security_${eventType}`,
          resource_type: "security",
          resource_id: null,
          details: {
            event_type: eventType,
            ip_address: req.ip,
            user_agent: req.get("User-Agent"),
            status_code: statusCode,
            success: statusCode < 400,
            ...(statusCode >= 400 && { error: responseData?.error }),
          },
          ip_address: req.ip,
          user_agent: req.get("User-Agent"),
        });

        // Also log to security logger
        const logLevel = statusCode >= 400 ? "warn" : "info";
        logger.securityLog(
          `${eventType}_${statusCode < 400 ? "success" : "failure"}`,
          {
            userId: req.user?.id,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
            statusCode,
          },
        );
      } catch (error) {
        logger.error("Security audit logging failed:", error);
      }
    });

    next();
  };
};
