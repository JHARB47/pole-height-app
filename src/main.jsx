import * as Sentry from "@sentry/react";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
// @ts-ignore - allow jsx resolution in JS project
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ContentPage from "./routes/ContentPage.jsx";
import SiteChrome from "./components/SiteChrome.jsx";
import NotFoundPage from "./components/NotFoundPage.jsx";
import { handleWebVitalMetric, reportWebVitals } from "./utils/performance.js";

// Only initialize Sentry if a valid DSN is provided
if (
  import.meta.env.VITE_SENTRY_DSN &&
  import.meta.env.VITE_SENTRY_DSN !== "${VITE_SENTRY_DSN}"
) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation: React.useLocation,
        useNavigationType: React.useNavigationType,
        createRoutesFromChildren: React.createRoutesFromChildren,
        matchRoutes: React.matchRoutes,
      }),
    ],
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || "1.0.0",
    // Only send errors in production, but allow all in development
    beforeSend: (event, hint) => {
      if (import.meta.env.DEV) {
        console.error("Sentry Error:", event, hint);
      }
      return event;
    },
  });
} else {
  console.warn("Sentry DSN not configured, error tracking disabled");
}

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <SiteChrome />,
      children: [
        {
          index: true,
          element: <App />,
        },
        {
          path: "home",
          element: <ContentPage slug="home" />,
        },
        {
          path: ":slug",
          element: <ContentPage />,
        },
        {
          path: "*",
          element: <NotFoundPage />,
        },
      ],
    },
  ],
  {
    future: { v7_startTransition: true },
  },
);

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </ErrorBoundary>
  </StrictMode>,
);

// Initialize performance monitoring
reportWebVitals(handleWebVitalMetric);

// Register service worker and show a user-facing update toast when a new version is available
const swEnabled =
  typeof navigator !== "undefined" &&
  "serviceWorker" in navigator &&
  import.meta.env.PROD &&
  import.meta.env.VITE_ENABLE_SW !== "false";

if (swEnabled) {
  const showUpdateToast = (reg) => {
    // Create toast container
    const container = document.createElement("div");
    container.setAttribute("role", "alert");
    container.style.cssText = [
      "position:fixed",
      "right:16px",
      "bottom:16px",
      "z-index:9999",
      "background:#0f172a",
      "color:#fff",
      "padding:12px 16px",
      "border-radius:8px",
      "box-shadow:0 4px 12px rgba(0,0,0,0.25)",
      "font:14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    ].join(";");
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;max-width:360px">
        <span style="flex:1">An update is available. Reload to get the latest version.</span>
        <button id="ph-update-now" style="background:#22c55e;color:#0b1220;border:0;border-radius:6px;padding:6px 10px;cursor:pointer">Update now</button>
        <button id="ph-update-dismiss" style="background:transparent;color:#93c5fd;border:1px solid #334155;border-radius:6px;padding:6px 10px;cursor:pointer">Dismiss</button>
      </div>`;
    document.body.appendChild(container);

    const cleanup = () => {
      try {
        container.remove();
      } catch (e) {
        if (import.meta?.env?.DEV) console.warn("Cleanup toast failed", e);
      }
    };
    const updateBtn = container.querySelector("#ph-update-now");
    const dismissBtn = container.querySelector("#ph-update-dismiss");

    const triggerUpdate = () => {
      if (!reg.waiting) {
        cleanup();
        return;
      }
      // Disable buttons to prevent double clicks
      updateBtn.setAttribute("disabled", "true");
      dismissBtn.setAttribute("disabled", "true");
      try {
        reg.waiting.postMessage("SKIP_WAITING");
      } catch (e) {
        if (import.meta?.env?.DEV)
          console.warn("Failed to postMessage to SW", e);
      }
      const onControllerChange = () => {
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        onControllerChange,
        { once: true },
      );
      // Safety fallback: reload after short delay if controllerchange didn’t fire
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    };

    updateBtn?.addEventListener("click", triggerUpdate);
    dismissBtn?.addEventListener("click", cleanup);
  };

  // Ensure we register at root scope to control the entire app
  navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .then((reg) => {
      if (reg.waiting) {
        showUpdateToast(reg);
      }
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && reg.waiting) {
            showUpdateToast(reg);
          }
        });
      });
    })
    .catch((e) => {
      if (import.meta?.env?.DEV)
        console.warn("Service worker registration failed", e);
    });
}
