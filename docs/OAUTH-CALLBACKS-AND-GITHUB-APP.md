# OAuth callbacks and GitHub App integration

This one-pager summarizes callback URLs you must configure with each provider and how to wire the GitHub App webhook in Netlify.

## Environments

- Production domain: https://poleplanpro.com
- Netlify site base: https://poleplanpro.netlify.app
- Deploy previews / branch deploys: https://<branch>--poleplanpro.netlify.app and custom subdomains under .poleplanpro.com if configured

Server default origin logic: in production, defaults to https://poleplanpro.com; otherwise http://localhost:3000.

Preview gating: In Netlify previews/branch deploys, both server and client gate authentication by default via:

- Server: DISABLE_PREVIEW_AUTH=true
- Client: VITE_DISABLE_PREVIEW_AUTH=true

## OAuth provider callback URLs

These are the endpoints our server exposes (see `server/config/passport.js` and `server/routes/auth.js`). Use HTTPS in production.

- Google OAuth 2.0
  - Authorized redirect URI: https://poleplanpro.com/auth/google/callback
  - Local dev: http://localhost:8888/auth/google/callback (Netlify dev) or http://localhost:3000/auth/google/callback if you proxy to the server

- Azure AD OAuth 2.0
  - Redirect URI (Web): https://poleplanpro.com/auth/azure/callback
  - Local dev: http://localhost:8888/auth/azure/callback

- GitHub OAuth App
  - Authorization callback URL: https://poleplanpro.com/auth/github/callback
  - Local dev: http://localhost:8888/auth/github/callback

- SAML (if used)
  - Assertion Consumer Service (ACS): https://poleplanpro.com/auth/saml/callback

Notes:

- For deploy previews and branch deploys, callbacks should still point to the production domain to complete sign-in. We block starting auth from preview hosts unless DISABLE_PREVIEW_AUTH=false.
- Our start endpoints support an optional returnUrl param encoded via OAuth state. Allowed return origins are controlled by env: APP_PRIMARY_DOMAIN, NETLIFY_SITE_BASE, and OAUTH_ALLOWED_ORIGINS.

## Required environment variables

Server (Netlify)

- JWT_SECRET, REFRESH_TOKEN_SECRET
- DATABASE_URL or NETLIFY_DATABASE_URL(+\_UNPOOLED)
- APP_PRIMARY_DOMAIN=poleplanpro.com
- NETLIFY_SITE_BASE=poleplanpro.netlify.app
- APP_PRIMARY_ORIGIN=https://poleplanpro.com (optional, overrides default)
- OAUTH_ALLOWED_ORIGINS=comma-separated list of additional origins or host patterns (e.g., https://staging.poleplanpro.com,*.corp.example.com)
- DISABLE_PREVIEW_AUTH=true (set by netlify.toml for previews)
- Provider secrets: GOOGLE_CLIENT_ID/SECRET, AZURE_CLIENT_ID/SECRET[/AZURE_TENANT_ID], GITHUB_CLIENT_ID/SECRET

Client (Vite build)

- VITE_APP_PRIMARY_DOMAIN=poleplanpro.com
- VITE_NETLIFY_SITE_BASE=poleplanpro.netlify.app
- VITE_DISABLE_PREVIEW_AUTH=true (set by netlify.toml for previews)
- PREVIEW_DOMAIN_BASE: optional custom preview base (e.g., poleplanpro.com) to surface custom-domain preview links in Check Runs

## GitHub App setup

Use this to enrich PR previews or enforce repository rules.

1. Create a GitHub App

- Homepage URL: https://poleplanpro.com
- Webhook URL: https://<your-netlify-site>.netlify.app/.netlify/functions/github_webhook
- Webhook secret: generate and store as GITHUB_APP_WEBHOOK_SECRET in Netlify
- Permissions: Pull requests (Read & write) if you want to comment; Metadata (Read-only)
- Permissions: Pull requests (Read & write) if you want to comment; Checks (Read & write) to create Check Runs; Metadata (Read-only)
- Subscribe to events: Pull request, Check run (for "Retry" action handling)

1. Install the App on your repo and select the target repository (JHARB47/pole-height-app)

1. Netlify function configuration

- File: `netlify/functions/github_webhook.js` verifies the signature and handles PR events: opened, edited, synchronize
- Env vars:
  - GITHUB_APP_WEBHOOK_SECRET: required for signature validation
  - GITHUB_APP_ID: your GitHub App ID (numeric)
  - GITHUB_APP_PRIVATE_KEY: your GitHub App private key (PEM). If stored with \n escapes, the function will normalize it.
  - The function will authenticate as the App and use the PR payload’s installation.id to post comments without a PAT.
  - GITHUB_APP_TOKEN or GITHUB_TOKEN: optional fallback if App auth isn’t configured
  - GITHUB_WEBHOOK_COMMENT_TEMPLATE: optional; customize the posted message
- Behavior: The function creates or updates a GitHub Check Run ("Preview: Links") tied to the PR head SHA with summary and details_url set to the guessed preview link when available.
  - The Check Run starts as in_progress on PR events.
  - A Netlify deploy webhook completes it with conclusion=success once the preview is deployed.
- File: `netlify/functions/netlify_deploy_webhook.js` optionally receives Netlify deploy webhooks to complete the Check Run.
  - Env vars:
    - NETLIFY_DEPLOY_WEBHOOK_SECRET: optional HMAC secret to verify Netlify webhook (sent via x-webhook-signature)
    - GITHUB_APP_INSTALLATION_ID: optional override if installation id is not derivable (normally not needed)

## Local dry-run

You can simulate both webhooks locally to see the exact headers and bodies:

1. Start Netlify dev so the functions are available at $NETLIFY_DEV_URL (usually http://localhost:8888)
2. In a separate terminal, run:

```bash
# GitHub PR webhook (uses GITHUB_APP_WEBHOOK_SECRET to sign)
GITHUB_APP_WEBHOOK_SECRET=dev-secret npm run webhook:simulate:github

# Netlify deploy webhook (signs if NETLIFY_DEPLOY_WEBHOOK_SECRET is set)
NETLIFY_DEPLOY_WEBHOOK_SECRET=dev-secret npm run webhook:simulate:netlify

# Both
GITHUB_APP_WEBHOOK_SECRET=dev-secret NETLIFY_DEPLOY_WEBHOOK_SECRET=dev-secret npm run webhook:simulate:both
```

Copy the printed curl command to actually POST to your local Netlify function endpoint.

1. Optional: Custom domain

- If your site uses a custom domain for production and previews, keep the Webhook URL pointing to the Netlify default domain to avoid TLS or DNS propagation issues.

## Validation checklist

- Verify OAuth callbacks in each provider’s console match the production URLs above
- Ensure DISABLE_PREVIEW_AUTH and VITE_DISABLE_PREVIEW_AUTH are true for previews
- Run health: https://<site>/.netlify/functions/health
- Run DB test: https://<site>/.netlify/functions/db_test
- Trigger a PR on GitHub; verify Netlify function receives webhook (200) and optional comment posts

## Troubleshooting

- 401 from webhook: confirm GITHUB_APP_WEBHOOK_SECRET matches the App’s stored secret and signatures are signed with sha256
- OAuth redirect loops: confirm APP_PRIMARY_ORIGIN or production default is used; avoid starting OAuth from preview hosts when preview gating is enabled
- No PR comments: ensure GITHUB_APP_TOKEN has repo:issues scope or install the App with write permission to Pull requests
