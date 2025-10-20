// Performance monitoring utilities
export const reportWebVitals = (metric) => {
  // Send to analytics service
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.value),
      non_interaction: true,
    });
  }

  // Send to Sentry if available
  if (window.Sentry) {
    window.Sentry.captureMessage(`Web Vital: ${metric.name}`, {
      level: 'info',
      tags: {
        metric: metric.name,
        vital: 'web-vitals'
      },
      extra: {
        value: metric.value,
        id: metric.id,
        delta: metric.delta
      }
    });
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('Web Vital:', metric);
  }
};

// Core Web Vitals measurement
export const measureWebVitals = () => {
  // Dynamically import web-vitals library
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(reportWebVitals);
    getFID(reportWebVitals);
    getFCP(reportWebVitals);
    getLCP(reportWebVitals);
    getTTFB(reportWebVitals);
  }).catch((error) => {
    console.warn('Failed to load web-vitals:', error);
  });
};

// Function performance monitoring
export const measureFunctionPerformance = (functionName, startTime, endTime) => {
  const duration = endTime - startTime;

  if (window.Sentry) {
    window.Sentry.captureMessage(`Function Performance: ${functionName}`, {
      level: 'info',
      tags: {
        type: 'performance',
        function: functionName
      },
      extra: {
        duration,
        startTime,
        endTime
      }
    });
  }

  // Log slow functions
  if (duration > 1000) { // More than 1 second
    console.warn(`Slow function: ${functionName} took ${duration}ms`);
  }
};