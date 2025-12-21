/**
 * telemetry.js - Lightweight observability for workflow events
 *
 * Logs workflow telemetry (not project data) to help identify
 * where users get stuck and what errors occur.
 *
 * PRIVACY: Never log GPS, pole IDs, addresses, photos, job names,
 * or utility customer identifiers.
 */

// === Configuration ===
const SCHEMA_VERSION = 1;
const MAX_QUEUE_SIZE = 50;
const FLUSH_INTERVAL_MS = 30000; // 30 seconds
const MAX_ERROR_LENGTH = 500;
const MAX_RETRY_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1000;

// Telemetry endpoint (configure in env or use no-op for now)
const TELEMETRY_ENDPOINT = import.meta.env.VITE_TELEMETRY_ENDPOINT || null;

// Generate a session ID once per browser session
const SESSION_ID =
  crypto.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

// Detect environment
const ENV = import.meta.env.MODE === "production" ? "prod" : "dev";

// App version from package.json (injected at build time via Vite)
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "0.2.0";

// Build SHA for release correlation (injected at build time)
const BUILD_SHA = import.meta.env.VITE_BUILD_SHA || null;

/**
 * Get current route/path for context (works with React Router)
 * Normalizes trailing slashes and handles hash routing
 */
function getCurrentRoute() {
  if (typeof window === "undefined") return null;

  const { pathname, hash } = window.location;

  // Normalize: strip trailing slash (except for root)
  let route =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  // Handle hash routing (e.g., /#/outputs → /outputs)
  if (hash && hash.startsWith("#/")) {
    const hashPath = hash.slice(1); // Remove leading #
    route =
      hashPath.length > 1 && hashPath.endsWith("/")
        ? hashPath.slice(0, -1)
        : hashPath;
  }

  return route || "/";
}

// === Singleton state ===
let eventQueue = [];
let flushIntervalId = null;
let lifecycleListenersAttached = false;
let retryAttempts = 0;
let isRetrying = false;

// Device type detection (cached)
const DEVICE_TYPE = (() => {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) return "mobile";
  return "desktop";
})();

/**
 * Truncate error messages to prevent oversized payloads
 */
function truncateMessage(msg, maxLen = MAX_ERROR_LENGTH) {
  if (!msg || typeof msg !== "string") return msg;
  if (msg.length <= maxLen) return msg;
  return msg.slice(0, maxLen - 3) + "...";
}

/**
 * Build the common envelope for all events
 */
function buildEnvelope() {
  const envelope = {
    schemaVersion: SCHEMA_VERSION,
    ts: new Date().toISOString(),
    sessionId: SESSION_ID,
    appVersion: APP_VERSION,
    env: ENV,
    device: DEVICE_TYPE,
    route: getCurrentRoute(),
  };

  // Only include buildSha if available (keeps payloads smaller)
  if (BUILD_SHA) {
    envelope.buildSha = BUILD_SHA;
  }

  return envelope;
}

/**
 * Log an event with automatic envelope fields
 * @param {string} name - Event name (e.g., 'export_success', 'locked_step_tap')
 * @param {object} props - Event-specific properties
 */
export function logEvent(name, props = {}) {
  // Skip logging in test environment
  if (import.meta.env.MODE === "test") return;

  // Skip queuing entirely if no endpoint configured (reduces noise)
  if (!TELEMETRY_ENDPOINT) {
    // Still log to console in dev for debugging
    if (ENV === "dev") {
      console.debug("[Telemetry]", name, props);
    }
    return;
  }

  const event = {
    ...buildEnvelope(),
    event: name,
    ...props,
  };

  // Truncate any errorMessage field
  if (event.errorMessage) {
    event.errorMessage = truncateMessage(event.errorMessage);
  }

  // Add to queue
  eventQueue.push(event);

  // Log to console in dev only (never in prod - security/compliance)
  if (ENV === "dev") {
    console.debug("[Telemetry]", name, props);
  }

  // Prevent queue from growing unbounded
  if (eventQueue.length > MAX_QUEUE_SIZE) {
    eventQueue = eventQueue.slice(-MAX_QUEUE_SIZE);
  }
}

/**
 * Flush queued events to the telemetry endpoint
 * Uses sendBeacon for reliability, with fetch fallback
 * @param {boolean} isPageUnload - True if called during page unload (use sendBeacon only)
 */
export function flushEvents(isPageUnload = false) {
  if (eventQueue.length === 0) return;
  if (!TELEMETRY_ENDPOINT) return; // No-op if no endpoint

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  const payload = JSON.stringify({ events: eventsToSend });

  // During page unload, only use sendBeacon (fetch won't complete)
  if (isPageUnload) {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(TELEMETRY_ENDPOINT, payload);
      if (!sent) {
        // Re-queue for next attempt (page might not actually unload)
        requeue(eventsToSend);
      }
    }
    return;
  }

  // Normal flush: prefer sendBeacon, fallback to fetch with retry
  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(TELEMETRY_ENDPOINT, payload);
    if (!sent) {
      fetchWithRetry(payload, eventsToSend);
    } else {
      // Reset retry state on success
      retryAttempts = 0;
    }
  } else {
    fetchWithRetry(payload, eventsToSend);
  }
}

/**
 * Re-queue events that failed to send (up to MAX_QUEUE_SIZE)
 */
function requeue(events) {
  // Prepend failed events to front of queue
  eventQueue = [...events, ...eventQueue].slice(0, MAX_QUEUE_SIZE);
}

/**
 * Fetch with exponential backoff retry for 429/5xx
 */
async function fetchWithRetry(payload, originalEvents) {
  if (isRetrying) return; // Prevent concurrent retries
  isRetrying = true;

  try {
    const response = await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true, // Allows request to survive navigation
    });

    if (response.ok) {
      retryAttempts = 0;
      isRetrying = false;
      return;
    }

    // Handle retryable errors (429 Too Many Requests, 5xx Server Errors)
    if (response.status === 429 || response.status >= 500) {
      handleRetry(originalEvents);
    }
    // For 4xx (except 429), don't retry - likely a client/config issue
  } catch {
    // Network error - retry
    handleRetry(originalEvents);
  } finally {
    isRetrying = false;
  }
}

/**
 * Handle retry with exponential backoff
 */
function handleRetry(events) {
  if (retryAttempts >= MAX_RETRY_ATTEMPTS) {
    // Max retries reached - drop events to prevent memory leak
    retryAttempts = 0;
    return;
  }

  retryAttempts++;
  requeue(events);

  // Exponential backoff with jitter: prevents thundering herd
  // Base: 1s, 2s, 4s; Jitter: ±20% (0.8 to 1.2 multiplier)
  const baseBackoffMs = BASE_BACKOFF_MS * Math.pow(2, retryAttempts - 1);
  const jitter = 0.8 + Math.random() * 0.4;
  const backoffMs = Math.round(baseBackoffMs * jitter);
  setTimeout(() => flushEvents(), backoffMs);
}

// === Convenience helpers for common events ===

/**
 * Log import success
 */
export function logImportSuccess({ format, rowCount, mappingMode }) {
  logEvent("import_success", {
    format,
    rowCount,
    mappingMode: mappingMode || "auto",
  });
}

/**
 * Log import error
 */
export function logImportError({
  format,
  errorType,
  fileSize,
  rowCount,
  mappingMode,
}) {
  logEvent("import_error", {
    format,
    errorType: truncateMessage(errorType),
    fileSize,
    rowCount,
    mappingMode: mappingMode || "auto",
  });
}

/**
 * Log export success
 */
export function logExportSuccess({ format, itemCount, durationMs }) {
  logEvent("export_success", {
    format,
    itemCount,
    durationMs: Math.round(durationMs),
  });
}

/**
 * Log export error
 */
export function logExportError({ format, errorMessage, durationMs }) {
  logEvent("export_error", {
    format,
    errorMessage,
    durationMs: durationMs ? Math.round(durationMs) : undefined,
  });
}

/**
 * Log locked step tap (mobile/desktop)
 */
export function logLockedStepTap({ stepId, requiresLabel }) {
  logEvent("locked_step_tap", {
    stepId,
    requiresLabel,
  });
}

/**
 * Log step completion with duration
 */
export function logStepComplete({ stepId, durationMs }) {
  logEvent("step_complete", {
    stepId,
    durationMs: Math.round(durationMs),
  });
}

/**
 * Log step entry (for funnel/drop-off analysis)
 */
export function logStepEnter({ stepId }) {
  logEvent("step_enter", {
    stepId,
  });
}

// === Lifecycle hooks ===

/**
 * Visibility change handler - flush when page becomes hidden
 */
function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    flushEvents(true);
  }
}

/**
 * Page hide handler - flush on navigation/close
 */
function handlePageHide() {
  flushEvents(true);
}

/**
 * Attach lifecycle listeners (idempotent)
 */
function attachLifecycleListeners() {
  if (lifecycleListenersAttached) return;
  if (typeof window === "undefined") return;

  window.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", handlePageHide);
  lifecycleListenersAttached = true;
}

/**
 * Detach lifecycle listeners
 */
function detachLifecycleListeners() {
  if (!lifecycleListenersAttached) return;
  if (typeof window === "undefined") return;

  window.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("pagehide", handlePageHide);
  lifecycleListenersAttached = false;
}

export function startTelemetry() {
  // Skip if no endpoint configured
  if (!TELEMETRY_ENDPOINT) return;

  // Idempotent - don't create multiple intervals
  if (flushIntervalId) return;

  flushIntervalId = setInterval(() => flushEvents(false), FLUSH_INTERVAL_MS);
  attachLifecycleListeners();
}

export function stopTelemetry() {
  if (flushIntervalId) {
    clearInterval(flushIntervalId);
    flushIntervalId = null;
  }
  detachLifecycleListeners();
  flushEvents(false); // Final flush
}

// Auto-start in production (only if endpoint is configured)
if (ENV === "prod" && TELEMETRY_ENDPOINT && typeof window !== "undefined") {
  startTelemetry();
}
