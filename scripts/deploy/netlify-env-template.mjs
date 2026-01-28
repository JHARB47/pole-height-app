#!/usr/bin/env node
/**
 * Prints the recommended Netlify environment variable setup for PolePlan Pro.
 * It can emit shell commands for the Netlify CLI or JSON suitable for automation.
 */

const REQUIRED_VARS = [
  {
    key: "DATABASE_URL",
    description: "Primary pooled database connection string (Neon/production).",
  },
  {
    key: "DATABASE_URL_UNPOOLED",
    description:
      "Unpooled connection string used for migrations and long-running jobs.",
  },
  {
    key: "JWT_SECRET",
    description: "64-byte hex secret for signing access tokens.",
  },
  {
    key: "REFRESH_TOKEN_SECRET",
    description: "64-byte hex secret for refresh tokens.",
  },
  {
    key: "REFRESH_TOKEN_TTL",
    description: "Refresh token lifetime, e.g. 7d.",
  },
  {
    key: "JWT_EXPIRES_IN",
    description: "Access token TTL, e.g. 15m.",
  },
  {
    key: "ALLOWED_ORIGINS",
    description: "Comma separated list of allowed frontend origins.",
  },
  {
    key: "SERVICE_NAME",
    description: "Identifier used in logging/observability.",
  },
];

const OPTIONAL_VARS = [
  {
    key: "STACKBIT_API_SECRET",
    description: "Enables Stackbit visual editor integration when present.",
  },
  {
    key: "GITHUB_APP_ID",
    description: "GitHub App identifier for enterprise auth flows.",
  },
  {
    key: "GITHUB_CLIENT_ID",
    description: "OAuth app client ID for GitHub sign-in fallback.",
  },
  {
    key: "GITHUB_CLIENT_SECRET",
    description: "OAuth app client secret.",
  },
  {
    key: "GOOGLE_CLIENT_ID",
    description: "Google OAuth client for SSO.",
  },
  {
    key: "GOOGLE_CLIENT_SECRET",
    description: "Google OAuth client secret.",
  },
  {
    key: "AZURE_AD_TENANT_ID",
    description: "Azure AD tenant for enterprise SSO.",
  },
  {
    key: "AZURE_AD_CLIENT_ID",
    description: "Azure AD application client ID.",
  },
  {
    key: "AZURE_AD_CLIENT_SECRET",
    description: "Azure AD application client secret.",
  },
];

const format = process.argv.includes("--json") ? "json" : "shell";

const toShellCommands = (entries) =>
  entries.map(({ key }) => `netlify env:set ${key} "<value>"`).join("\n");

const toJSON = (entries) =>
  entries.reduce(
    (acc, { key, description }) => ({
      ...acc,
      [key]: {
        description,
        value: "<value>",
      },
    }),
    {},
  );

if (format === "json") {
  const payload = {
    required: toJSON(REQUIRED_VARS),
    optional: toJSON(OPTIONAL_VARS),
  };
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log("### Required variables");
  console.log(toShellCommands(REQUIRED_VARS));
  console.log("\n### Optional variables");
  console.log(toShellCommands(OPTIONAL_VARS));
  console.log(
    "\n# Paste the commands above after replacing <value> with your secrets.",
  );
}
