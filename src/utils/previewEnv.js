// Client-side helpers for preview environment and auth feature flags
// Uses Vite env vars (prefix VITE_) to avoid leaking server env by default

const PRIMARY_DOMAIN =
  import.meta.env.VITE_APP_PRIMARY_DOMAIN || "poleplanpro.com";
const NETLIFY_SITE_BASE =
  import.meta.env.VITE_NETLIFY_SITE_BASE || "poleplanpro.netlify.app";
const SITE_SUBDOMAIN = NETLIFY_SITE_BASE.split(".")[0];
const DISABLE_PREVIEW_AUTH = /^(1|true|yes)$/i.test(
  String(import.meta.env.VITE_DISABLE_PREVIEW_AUTH || "false"),
);

export function computeIsPreviewHost(hostname, primaryDomain, netlifySiteBase) {
  if (!hostname) return false;
  const sub = (netlifySiteBase || "").split(".")[0];
  // Netlify branch deploy pattern
  if (sub && hostname.endsWith(`--${sub}.netlify.app`)) return true;
  // Custom branch subdomains (exclude apex)
  if (
    primaryDomain &&
    hostname !== primaryDomain &&
    hostname.endsWith(`.${primaryDomain}`)
  )
    return true;
  return false;
}

export function isPreviewHost(hostname) {
  return computeIsPreviewHost(hostname, PRIMARY_DOMAIN, NETLIFY_SITE_BASE);
}

export function isPreviewAuthDisabled() {
  return DISABLE_PREVIEW_AUTH === true;
}

export function shouldHideAuthButtons(
  hostname = typeof window !== "undefined" ? window.location.hostname : "",
) {
  return isPreviewAuthDisabled() && isPreviewHost(hostname);
}

export function computeHideAuthButtons(
  hostname,
  disablePreviewAuth,
  primaryDomain,
  netlifySiteBase,
) {
  if (!disablePreviewAuth) return false;
  return computeIsPreviewHost(hostname, primaryDomain, netlifySiteBase);
}

export function getPreviewFlags(
  hostname = typeof window !== "undefined" ? window.location.hostname : "",
) {
  const previewHost = isPreviewHost(hostname);
  const hideAuth = DISABLE_PREVIEW_AUTH && previewHost;
  return {
    previewHost,
    disablePreviewAuth: DISABLE_PREVIEW_AUTH,
    hideAuthButtons: hideAuth,
  };
}
