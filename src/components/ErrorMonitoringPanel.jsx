// @ts-nocheck
/**
 * Error Monitoring Dashboard Component
 * Displays error statistics and health status (dev/admin only)
 */

import React, { useState, useEffect } from "react";
import { errorMonitor, checkHealth } from "../utils/errorMonitoring.js";

export function ErrorMonitoringPanel({ onClose }) {
  const [health, setHealth] = useState(checkHealth());
  const [stats, setStats] = useState(errorMonitor.getErrorStats());
  const [errors, setErrors] = useState(errorMonitor.errors.slice(-20));

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(checkHealth());
      setStats(errorMonitor.getErrorStats());
      setErrors(errorMonitor.errors.slice(-20));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const clearErrors = () => {
    errorMonitor.clearErrors();
    setErrors([]);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        width: 400,
        maxHeight: "80vh",
        overflow: "auto",
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 9999,
        padding: 16,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          Error Monitoring
        </h3>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: 20,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Health Status */}
      <div
        style={{
          padding: 12,
          borderRadius: 6,
          background: health.status === "healthy" ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${health.status === "healthy" ? "#86efac" : "#fca5a5"}`,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
          Status:{" "}
          <span
            style={{
              color: health.status === "healthy" ? "#16a34a" : "#dc2626",
            }}
          >
            {health.status.toUpperCase()}
          </span>
        </div>
        {health.message && (
          <div style={{ fontSize: 12, color: "#6b7280" }}>{health.message}</div>
        )}
      </div>

      {/* Error Statistics */}
      <div
        style={{
          padding: 12,
          background: "#f9fafb",
          borderRadius: 6,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          Error Statistics
        </div>
        <div style={{ fontSize: 13, display: "grid", gap: 4 }}>
          <div>Last 5 min: {stats.last5Minutes} errors</div>
          <div>Last hour: {stats.lastHour} errors</div>
          <div>Error rate: {stats.errorRate.toFixed(2)}/min</div>
          <div>Total tracked: {errorMonitor.errors.length}</div>
        </div>
      </div>

      {/* Recent Errors */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            Recent Errors ({errors.length})
          </div>
          <button
            onClick={clearErrors}
            style={{
              fontSize: 12,
              padding: "4px 8px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
        <div style={{ maxHeight: 300, overflow: "auto" }}>
          {errors.length === 0 ? (
            <div
              style={{
                padding: 12,
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              No errors logged
            </div>
          ) : (
            errors.reverse().map((err, idx) => (
              <div
                key={idx}
                style={{
                  padding: 8,
                  marginBottom: 8,
                  background: "#fef2f2",
                  border: "1px solid #fca5a5",
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                <div
                  style={{ fontWeight: 600, marginBottom: 4, color: "#dc2626" }}
                >
                  {err.message}
                </div>
                <div
                  style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}
                >
                  {new Date(err.timestamp).toLocaleTimeString()}
                </div>
                {err.context && Object.keys(err.context).length > 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      fontFamily: "monospace",
                    }}
                  >
                    {JSON.stringify(err.context, null, 2)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Keyboard shortcut moved to src/hooks/useErrorMonitoringShortcut.js to fix fast-refresh
