import React from "react";
import { Link } from "react-router-dom";
import site from "../../content/site.json";

export default function SiteChrome({ children }) {
  const title = site?.siteTitle || "Pole Plan Pro";
  const logo = site?.logo || "/pwa-192.png";
  const nav =
    Array.isArray(site?.navigation) && site.navigation.length > 0
      ? site.navigation
      : [
          { label: "Home", url: "/" },
          { label: "App", url: "/app" },
        ];

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header role="banner" className="top-nav" aria-label="Primary">
        <Link to="/" className="brand" aria-label={`${title} home`}>
          <img src={logo} alt="" width="24" height="24" />
          <span className="brand-title">{title}</span>
        </Link>
        <nav aria-label="Primary navigation" className="nav-links">
          {nav.map((item, i) => (
            <Link key={i} to={item.url}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main id="main-content" role="main">
        {children}
      </main>
      <style>{`
        .skip-link{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden}
        .skip-link:focus{position:fixed;left:16px;top:16px;width:auto;height:auto;padding:8px 12px;background:#111827;color:#fff;border-radius:6px;z-index:10000}
        .top-nav{position:fixed;top:0;left:0;right:0;display:flex;gap:12px;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.8);backdrop-filter:saturate(180%) blur(6px);z-index:9999}
        .top-nav .brand{display:flex;align-items:center;gap:8px;color:#0f172a;text-decoration:none;font-weight:700}
        .top-nav .nav-links{display:flex;gap:12px;margin-left:auto}
        .top-nav a{color:#0f172a;text-decoration:none;font-weight:600}
        body{padding-top:44px}
      `}</style>
    </>
  );
}
