import React from "react";
import { Link, Outlet } from "react-router-dom";
import site from "../../content/site.json";
import { stackbitData, fieldPath } from "../utils/stackbit.js";

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

  return (
    <div {...stackbitData("site")}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header role="banner" className="top-nav" aria-label="Primary">
        <Link to="/" className="brand" aria-label={`${title} home`}>
          <img
            src={logo}
            alt=""
            width="24"
            height="24"
            {...stackbitData("site", fieldPath("site", "logo"))}
          />
          <span
            className="brand-title"
            {...stackbitData("site", fieldPath("site", "siteTitle"))}
          >
            {title}
          </span>
        </Link>
        <nav aria-label="Primary navigation" className="nav-links">
          {nav.map((item, i) => {
            const navPath = `site.navigation[${i}]`;
            return (
              <Link key={i} to={item.url} {...stackbitData(navPath)}>
                <span {...stackbitData(navPath, fieldPath(navPath, "label"))}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </header>
      <main id="main-content" role="main">
        <Outlet />
      </main>
    </div>
  );
}
