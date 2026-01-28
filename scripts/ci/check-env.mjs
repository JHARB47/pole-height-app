#!/usr/bin/env node
import process from "node:process";

const required = [
  ["DATABASE_URL", "Postgres connection string"],
  ["JWT_SECRET", "JWT signing secret"],
  ["REFRESH_TOKEN_SECRET", "Refresh token secret"],
];

const missing = required
  .map(([key, description]) => ({ key, description, value: process.env[key] }))
  .filter(({ value }) => value == null || String(value).trim() === "");

const enforce = process.env.CI === "true" || process.env.REQUIRE_ENV === "true";

if (missing.length) {
  const heading = enforce
    ? "Missing required environment variables:"
    : "Warning: missing environment variables (verification not enforced)";
  console[enforce ? "error" : "warn"](heading);
  for (const item of missing) {
    console[enforce ? "error" : "warn"](` - ${item.key}: ${item.description}`);
  }
  if (enforce) {
    process.exit(1);
  }
}

if (process.env.CI === "true") {
  console.log("✓ Environment variables check complete for CI");
} else {
  console.log("Environment variables check complete");
}
