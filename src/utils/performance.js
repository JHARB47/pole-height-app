// Performance monitoring utilities
export const handleWebVitalMetric = (metric) => {
  // Send to analytics service
  if (globalThis.gtag) {
    globalThis.gtag("event", metric.name, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(metric.value),
      non_interaction: true,
    });
  }

  // Send to Sentry if available
  if (globalThis.Sentry) {
    globalThis.Sentry.captureMessage(`Web Vital: ${metric.name}`, {
      level: "info",
      tags: {
        metric: metric.name,
        vital: "web-vitals",
      },
      extra: {
        value: metric.value,
        id: metric.id,
        delta: metric.delta,
      },
    });
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log("Web Vital:", metric);
  }
};

// Core Web Vitals measurement using modern web-vitals API
export const reportWebVitals = (onPerfEntry) => {
  if (typeof onPerfEntry !== "function") {
    return;
  }

  import("web-vitals")
    .then(({ onCLS, onFID, onLCP, onINP, onTTFB, onFCP }) => {
      if (typeof onCLS === "function") onCLS(onPerfEntry);
      if (typeof onFID === "function") onFID(onPerfEntry);
      if (typeof onLCP === "function") onLCP(onPerfEntry);
      if (typeof onINP === "function") onINP(onPerfEntry);
      if (typeof onTTFB === "function") onTTFB(onPerfEntry);
      if (typeof onFCP === "function") onFCP(onPerfEntry);
    })
    .catch((error) => {
      if (import.meta?.env?.DEV) {
        console.warn("Failed to load web-vitals", error);
      }
    });
};

// Function performance monitoring
export const measureFunctionPerformance = (
  functionName,
  startTime,
  endTime,
) => {
  const duration = endTime - startTime;

  if (globalThis.Sentry) {
    globalThis.Sentry.captureMessage(`Function Performance: ${functionName}`, {
      level: "info",
      tags: {
        type: "performance",
        function: functionName,
      },
      extra: {
        duration,
        startTime,
        endTime,
      },
    });
  }

  // Log slow functions
  if (duration > 1000) {
    // More than 1 second
    console.warn(`Slow function: ${functionName} took ${duration}ms`);
  }
};
