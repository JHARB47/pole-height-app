import React from "react";
import { Link, Outlet } from "react-router-dom";
import site from "../../content/site.json";
import { stackbitData, stackbitObjectId } from "../utils/stackbit.js";

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

  return (
    <div {...stackbitData(siteObjectId)}>
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
            {...stackbitData(siteObjectId, "logo#@src")}
          />
          <span
            className="brand-title"
            {...stackbitData(siteObjectId, "siteTitle")}
          >
            {title}
          </span>
        </Link>
        <nav aria-label="Primary navigation" className="nav-links">
          {nav.map((item, i) => {
            const navObjectId = stackbitObjectId(
              "content/site.json",
              `navigation[${i}]`,
            );
            return (
              <Link
                key={i}
                to={item.url}
                {...stackbitData(navObjectId, "url#@href")}
              >
                <span {...stackbitData(navObjectId, "label")}>
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
