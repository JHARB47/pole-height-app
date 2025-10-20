# Auth Preview Configuration

This document explains how to configure OAuth return URLs and preview environment behavior for branch deploys and custom domains.

## Environment variables

- APP_PRIMARY_DOMAIN
  - Default: `poleplanpro.com`
  - Used to allow apex and subdomains for safe redirects.

- APP_PRIMARY_ORIGIN
  - Optional full origin (e.g., `https://example.com`). When set, this is used as the default redirect origin after OAuth when no returnUrl is provided or allowed.

- NETLIFY_SITE_BASE
  - Default: `poleplanpro.netlify.app`
  - Used to recognize Netlify base site and branch deploy hosts (pattern: `<branch>--<site>.netlify.app`).

- OAUTH_ALLOWED_ORIGINS
  - Optional, comma-separated list of additional allowed origins or host patterns.
  - Examples:
    - Full origins: `https://partners.example.com,https://demo.example.org`
    - Host patterns with `*` wildcard (matches host only): `*.customer.example.com,staging-*.example.org`

- DISABLE_PREVIEW_AUTH
  - When `true`/`1`/`yes`, blocks initiating OAuth on preview hosts (Netlify branch deploys and custom branch subdomains).
  - Requests to `/auth/google`, `/auth/azure`, `/auth/github` on preview hosts will return HTTP 403 with `{ code: "PREVIEW_AUTH_DISABLED" }`.

Frontend (Vite) equivalents for UI gating:

- VITE_APP_PRIMARY_DOMAIN, VITE_NETLIFY_SITE_BASE
- VITE_DISABLE_PREVIEW_AUTH
  - When `true`, the UI can hide login/auth buttons on preview hosts.
  - Helper: `src/utils/previewEnv.js` exports `shouldHideAuthButtons()` and `getPreviewFlags()` used in `SiteChrome.jsx`.

## Safe returnUrl support

- The `/auth/{provider}` routes accept an optional `returnUrl` query param. If the origin of `returnUrl` is allowed, it is encoded in the OAuth `state` and respected after login.
- Allowed origins include:
  - `localhost` (non-production only)
  - Apex and subdomains of `APP_PRIMARY_DOMAIN`
  - Netlify base and branch deploys for `NETLIFY_SITE_BASE`
  - Any additional entries in `OAUTH_ALLOWED_ORIGINS`

## Callback defaulting

- If no allowed `returnUrl` is present in state, the server redirects to `{DEFAULT_ORIGIN}/auth/callback` where `DEFAULT_ORIGIN` is:
  - `APP_PRIMARY_ORIGIN` if set
  - Otherwise `https://{APP_PRIMARY_DOMAIN}` in production
  - Otherwise `http://localhost:3000` in non-production

## Examples

- Allow an external QA site and a partner subdomain:

  OAUTH_ALLOWED_ORIGINS="https://qa.example.net,*.partners.example.com"

- Disable auth on branch previews:

  DISABLE_PREVIEW_AUTH=true

  And to hide login buttons on the frontend in previews:

  VITE_DISABLE_PREVIEW_AUTH=true

## Notes

- Only `http` and `https` schemes are accepted for `returnUrl`.
- Wildcards in `OAUTH_ALLOWED_ORIGINS` are matched against the host portion only, not full URLs.
- For Netlify branch deploys, hosts in the form `<branch>--<site>.netlify.app` are treated as previews.
