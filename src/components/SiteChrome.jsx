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
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getInitialTheme = () => {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
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
      const key = `previewBannerDismissed:${typeof window !== "undefined" ? window.location.hostname : ""}`;
      const dismissed = sessionStorage.getItem(key);
      if (dismissed === "1") setHidePreviewBanner(true);
    } catch {
      /* no-op: sessionStorage may be unavailable */
    }
  }, []);

  function dismissPreviewBanner() {
    setHidePreviewBanner(true);
    try {
      const key = `previewBannerDismissed:${typeof window !== "undefined" ? window.location.hostname : ""}`;
      sessionStorage.setItem(key, "1");
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
      root.removeAttribute("data-theme");
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
    if (typeof window === "undefined") return undefined;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        setResolvedTheme(mql.matches ? "dark" : "light");
      }
    };
    mql.addEventListener("change", handler);
    handler();
    return () => mql.removeEventListener("change", handler);
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

  const themeIcon =
    theme === "system"
      ? resolvedTheme === "dark"
        ? "🌙"
        : "☀️"
      : theme === "dark"
        ? "🌙"
        : "☀️";
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
