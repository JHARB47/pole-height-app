import React, { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import SafeLink from "./SafeLink.jsx";
import site from "../../content/site.json";
import { stackbitData, stackbitObjectId } from "../utils/stackbit.js";
import "./SiteChrome.css";
import { getPreviewFlags } from "../utils/previewEnv.js";

const siteObjectId = stackbitObjectId("content/site.json");
const THEME_STORAGE_KEY = "ph-theme";

const getSystemTheme = () => {
  const win = globalThis.window;
  if (!win) return "light";
  const mql = win.matchMedia?.("(prefers-color-scheme: dark)");
  if (!mql) return "light";
  return mql.matches ? "dark" : "light";
};

const getInitialTheme = () => {
  if (!globalThis.window) return "system";
  try {
    const stored = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system")
      return stored;
  } catch {
    /* ignore storage errors */
  }
  return "system";
};

export default function SiteChrome() {
  const title = site?.siteTitle || "Pole Plan Pro";
  const logo = site?.logo || "/pwa-192.png";
  const nav =
    Array.isArray(site?.navigation) && site.navigation.length > 0
      ? site.navigation
      : [
          { label: "Home", url: "/" },
          { label: "App", url: "/app" },
        ];

  const { hideAuthButtons, previewHost, disablePreviewAuth } =
    getPreviewFlags();
  const [hidePreviewBanner, setHidePreviewBanner] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState(getSystemTheme);

  // Persist banner dismissal for the current session
  useEffect(() => {
    try {
      const hostname = globalThis.window?.location?.hostname ?? "";
      const key = `previewBannerDismissed:${hostname}`;
      const dismissed = globalThis.sessionStorage?.getItem(key);
      if (dismissed === "1") setHidePreviewBanner(true);
    } catch {
      /* no-op: sessionStorage may be unavailable */
    }
  }, []);

  function dismissPreviewBanner() {
    setHidePreviewBanner(true);
    try {
      const hostname = globalThis.window?.location?.hostname ?? "";
      const key = `previewBannerDismissed:${hostname}`;
      globalThis.sessionStorage?.setItem(key, "1");
    } catch {
      /* ignore */
    }
  }

  // Apply theme preference to document root
  useEffect(() => {
    const root = document.documentElement;
    if (!root) return;

    if (theme === "light" || theme === "dark") {
      root.dataset.theme = theme;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        /* ignore */
      }
      setResolvedTheme(theme);
    } else {
      delete root.dataset.theme;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, "system");
      } catch {
        /* ignore */
      }
      setResolvedTheme(getSystemTheme());
    }
  }, [theme]);

  // Keep resolved theme in sync with system changes when in system mode
  useEffect(() => {
    const win = globalThis.window;
    if (!win) return undefined;
    const mql = win.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mql) return undefined;
    const handler = () => {
      if (theme === "system") {
        setResolvedTheme(mql.matches ? "dark" : "light");
      }
    };

    // Safari < 14 uses addListener/removeListener.
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      handler();
      return () => mql.removeEventListener("change", handler);
    }

    // AI: rationale — avoid deprecated MediaQueryList typings while keeping legacy support
    const legacyMql = /** @type {any} */ (mql);
    legacyMql.addListener(handler);
    handler();
    return () => legacyMql.removeListener(handler);
  }, [theme]);

  const cycleTheme = () => {
    setTheme((current) => {
      if (current === "light") return "dark";
      if (current === "dark") return "system";
      return "light";
    });
  };

  const themeLabel = useMemo(() => {
    if (theme === "system")
      return resolvedTheme === "dark" ? "System (Dark)" : "System (Light)";
    return theme === "dark" ? "Dark" : "Light";
  }, [theme, resolvedTheme]);

  const themeIcon = (() => {
    if (theme === "system") return resolvedTheme === "dark" ? "🌙" : "☀️";
    return theme === "dark" ? "🌙" : "☀️";
  })();
  const filteredNav = nav.filter((item) => {
    // If we ever add auth/login routes to content-driven nav, gate them here
    if (
      hideAuthButtons &&
      /login|signin|auth/gi.test(item.label + " " + item.url)
    )
      return false;
    return true;
  });

  const mainOffsetPx = previewHost && !hidePreviewBanner ? 44 + 36 : 44;

  return (
    <div {...stackbitData(siteObjectId)}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header role="banner" className="top-nav" aria-label="Primary">
        <SafeLink to="/" className="brand" aria-label={`${title} home`}>
          <img
            src={logo}
            alt=""
            width="24"
            height="24"
            {...stackbitData(siteObjectId, "logo#@src")}
          />
          <span
            className="brand-title"
            {...stackbitData(siteObjectId, "siteTitle")}
          >
            {title}
          </span>
        </SafeLink>
        <nav aria-label="Primary navigation" className="nav-links">
          {filteredNav.map((item, i) => {
            const navObjectId = stackbitObjectId(
              "content/site.json",
              `navigation[${i}]`,
            );
            return (
              <SafeLink key={i} to={item.url} {...stackbitData(navObjectId)}>
                <span {...stackbitData(navObjectId, "label")}>
                  {item.label}
                </span>
              </SafeLink>
            );
          })}
        </nav>
        <div className="nav-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={cycleTheme}
            aria-label={`Toggle theme (current: ${themeLabel})`}
            title={`Theme: ${themeLabel}`}
          >
            <span aria-hidden="true">{themeIcon}</span>
            <span className="theme-toggle-label">{themeLabel}</span>
          </button>
        </div>
      </header>
      {previewHost && !hidePreviewBanner && (
        <div className="preview-banner" role="status" aria-live="polite">
          <span>
            Preview mode: deploy preview or branch deploy.{" "}
            {disablePreviewAuth ? "Auth is gated in previews." : ""}
          </span>
          <button
            type="button"
            className="preview-banner-dismiss"
            onClick={dismissPreviewBanner}
            aria-label="Dismiss preview mode banner"
          >
            Dismiss
          </button>
        </div>
      )}
      <main id="main-content" role="main" style={{ paddingTop: mainOffsetPx }}>
        <Outlet />
      </main>
    </div>
  );
}
