import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import SafeLink from "./SafeLink.jsx";
import site from "../../content/site.json";
import { stackbitData, stackbitObjectId } from "../utils/stackbit.js";
import "./SiteChrome.css";
import { getPreviewFlags } from "../utils/previewEnv.js";

const siteObjectId = stackbitObjectId("content/site.json");

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

  const { hideAuthButtons, previewHost, disablePreviewAuth } = getPreviewFlags();
  const [hidePreviewBanner, setHidePreviewBanner] = useState(false);

  // Persist banner dismissal for the current session
  useEffect(() => {
    try {
      const key = `previewBannerDismissed:${typeof window !== 'undefined' ? window.location.hostname : ''}`;
      const dismissed = sessionStorage.getItem(key);
      if (dismissed === '1') setHidePreviewBanner(true);
    } catch {
      /* no-op: sessionStorage may be unavailable */
    }
  }, []);

  function dismissPreviewBanner() {
    setHidePreviewBanner(true);
    try {
      const key = `previewBannerDismissed:${typeof window !== 'undefined' ? window.location.hostname : ''}`;
      sessionStorage.setItem(key, '1');
    } catch {
      /* ignore */
    }
  }
  const filteredNav = nav.filter((item) => {
    // If we ever add auth/login routes to content-driven nav, gate them here
    if (hideAuthButtons && /login|signin|auth/gi.test(item.label + " " + item.url)) return false;
    return true;
  });

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
            const navObjectId = stackbitObjectId("content/site.json", `navigation[${i}]`);
            return (
              <SafeLink key={i} to={item.url} {...stackbitData(navObjectId)}>
                <span {...stackbitData(navObjectId, "label")}>
                  {item.label}
                </span>
              </SafeLink>
            );
          })}
        </nav>
      </header>
      {previewHost && !hidePreviewBanner && (
        <div className="preview-banner" role="status" aria-live="polite">
          <span>
            Preview mode: deploy preview or branch deploy. {disablePreviewAuth ? "Auth is gated in previews." : ""}
          </span>
          <button
            type="button"
            className="preview-banner__dismiss"
            onClick={dismissPreviewBanner}
            aria-label="Dismiss preview mode banner"
          >
            Dismiss
          </button>
        </div>
      )}
      <main id="main-content" role="main" style={{ marginTop: previewHost && !hidePreviewBanner ? 36 : 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
