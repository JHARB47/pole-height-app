// @ts-nocheck
/**
 * Error Monitoring and Recovery Utilities
 * Provides centralized error tracking and graceful degradation
 */

class ErrorMonitor {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.listeners = [];
  }

  /**
   * Log an error with context
   * @param {Error|string} error - Error to log
   * @param {Object} context - Additional context
   */
  logError(error, context = {}) {
    const errorEntry = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    this.errors.push(errorEntry);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(errorEntry);
      } catch (e) {
        console.error("Error listener failed:", e);
      }
    });

    // Log to console in development
    if (import.meta?.env?.DEV) {
      console.error("[ErrorMonitor]", errorEntry);
    }

    return errorEntry;
  }

  /**
   * Add error listener
   * @param {Function} listener - Callback function
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove error listener
   * @param {Function} listener - Callback function to remove
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get recent errors
   * @param {number} count - Number of errors to retrieve
   * @returns {Array} Recent errors
   */
  getRecentErrors(count = 10) {
    return this.errors.slice(-count);
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getStats() {
    const now = Date.now();
    const last5Minutes = this.errors.filter(
      (e) => now - new Date(e.timestamp).getTime() < 5 * 60 * 1000,
    );

    const last1Hour = this.errors.filter(
      (e) => now - new Date(e.timestamp).getTime() < 60 * 60 * 1000,
    );

    return {
      total: this.errors.length,
      last5Minutes: last5Minutes.length,
      lastHour: last1Hour.length,
      errorRate: last5Minutes.length / 5, // Errors per minute
    };
  }

  /**
   * Alias for getStats for backward compatibility
   */
  getErrorStats() {
    return this.getStats();
  }

  /**
   * Subscribe to error events (alias for addListener)
   */
  subscribe(listener) {
    this.addListener(listener);
  }

  /**
   * Unsubscribe from error events (alias for removeListener)
   */
  unsubscribe(listener) {
    this.removeListener(listener);
  }
}

// Global instance
export const errorMonitor = new ErrorMonitor();

/**
 * Wrap async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {Object} options - Options
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, options = {}) {
  const { context = {}, onError, fallback } = options;

  return async function wrapped(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      const errorEntry = errorMonitor.logError(error, {
        ...context,
        functionName: fn.name,
        args: args.length > 0 ? "present" : "none",
      });

      if (onError) {
        onError(error, errorEntry);
      }

      if (fallback !== undefined) {
        return fallback;
      }

      throw error;
    }
  };
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of function
 */
export async function withRetry(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        if (onRetry) {
          onRetry(error, attempt, delay);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Graceful degradation wrapper
 * Tries preferred function with timeout, falls back on failure
 * @param {Function} preferredFn - Preferred function
 * @param {Function} fallbackFn - Fallback function
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 * @param {Object} context - Additional context for logging
 * @returns {Promise} Result from preferred or fallback function
 */
export async function withFallback(
  preferredFn,
  fallbackFn,
  timeout = 5000,
  context = {},
) {
  try {
    // Try preferred function with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeout),
    );

    const resultPromise = preferredFn();

    return await Promise.race([resultPromise, timeoutPromise]);
  } catch (error) {
    errorMonitor.logError(error, {
      ...context,
      message: "Falling back to alternative implementation",
      preferredFunction: preferredFn.name,
      fallbackFunction: fallbackFn.name,
    });

    return fallbackFn();
  }
}

/**
 * Circuit breaker pattern
 */
export class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  async execute(fn, ...args) {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error(`Circuit breaker is open for ${this.name}`);
      }
    }

    try {
      const result = await fn(...args);

      if (this.state === "HALF_OPEN") {
        this.state = "CLOSED";
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = "OPEN";
        errorMonitor.logError(error, {
          message: `Circuit breaker opened for ${this.name}`,
          failureCount: this.failureCount,
        });
      }

      throw error;
    }
  }

  reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === "undefined") return;

  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    errorMonitor.logError(event.reason, {
      type: "unhandledRejection",
      promise: event.promise,
    });
  });

  // Global errors
  window.addEventListener("error", (event) => {
    errorMonitor.logError(event.error || event.message, {
      type: "globalError",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Console error tracking (optional)
  const originalConsoleError = console.error;
  console.error = function (...args) {
    errorMonitor.logError(args.join(" "), {
      type: "consoleError",
    });
    originalConsoleError.apply(console, args);
  };
}

/**
 * Health check function
 * @returns {Object} Health status
 */
export function checkHealth() {
  const stats = errorMonitor.getStats();
  const isHealthy = stats.errorRate < 1; // Less than 1 error per minute

  return {
    status: isHealthy ? "healthy" : "degraded",
    errorRate: stats.errorRate,
    recentErrors: stats.last5Minutes,
    totalErrors: stats.total,
    timestamp: new Date().toISOString(),
  };
}
