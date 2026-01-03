// @ts-nocheck
/**
 * Global Error Monitoring Setup
 * Initialize error monitoring for the entire application
 */

import {
  errorMonitor,
  setupGlobalErrorHandlers,
  checkHealth,
} from "./errorMonitoring.js";

/**
 * Initialize error monitoring for the application
 */
export function initializeErrorMonitoring() {
  // Setup global error handlers
  setupGlobalErrorHandlers();

  // Log initialization
  console.log("Error monitoring initialized");

  // Subscribe to errors for development debugging
  if (import.meta.env.DEV) {
    errorMonitor.subscribe((error) => {
      console.warn("[ErrorMonitor]", error);
    });
  }

  // Periodic health check (every 5 minutes)
  setInterval(
    () => {
      const health = checkHealth();
      if (health.status !== "healthy") {
        console.warn("[Health Check]", health);
      }
    },
    5 * 60 * 1000,
  );

  // Report health status on visibility change (when user returns to tab)
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        const health = checkHealth();
        if (health.status !== "healthy") {
          console.warn("[Health Check on Tab Focus]", health);
        }
      }
    });
  }
}

/**
 * Get current error monitoring status
 */
export function getErrorMonitoringStatus() {
  const stats = errorMonitor.getErrorStats();
  const health = checkHealth();

  return {
    health,
    stats,
    totalErrors: errorMonitor.errors.length,
    recentErrors: errorMonitor.errors.slice(-10),
  };
}

/**
 * Clear error history (useful for testing or after recovery)
 */
export function clearErrorHistory() {
  errorMonitor.clearErrors();
  console.log("Error history cleared");
}
