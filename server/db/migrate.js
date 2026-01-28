import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { runner as pgMigrate } from "node-pg-migrate";
import { ENV } from "../config/env.js";
import { log } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @param {unknown} msg
 */
function formatLogMsg(msg) {
  if (typeof msg === "string") return msg;
  if (msg instanceof Error) return msg.stack || msg.message;
  try {
    return JSON.stringify(msg);
  } catch {
    return "[unserializable]";
  }
}

// AI: rationale — avoid logging raw DATABASE_URL (may contain credentials)
/** @param {string} databaseUrl */
function maskDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    if (url.username) url.username = "***";
    if (url.password) url.password = "***";
    return url.toString();
  } catch {
    return "[invalid DATABASE_URL]";
  }
}

/**
 * @param {{
 *   direction?: 'up' | 'down';
 *   databaseUrl?: string;
 *   schema?: string;
 *   migrationsTable?: string;
 * }} [opts]
 */
export async function runMigrations({
  direction = "up",
  databaseUrl = ENV.databaseUrl,
  schema = ENV.databaseSchema,
  migrationsTable = "pgmigrations",
} = {}) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for migrations");
  }
  if (direction !== "up" && direction !== "down") {
    throw new Error(`Invalid migration direction: ${formatLogMsg(direction)}`);
  }
  log.debug(
    `Running migrations ${direction} on ${maskDatabaseUrl(databaseUrl)}`,
  );
  return pgMigrate({
    dir: resolve(__dirname, "migrations"),
    direction,
    count: Infinity,
    databaseUrl,
    schema,
    migrationsTable,
    createSchema: true,
    logger: {
      /** @param {unknown} msg */
      info: (msg) => log.debug(formatLogMsg(msg)),
      /** @param {unknown} msg */
      warn: (msg) => log.warn(formatLogMsg(msg)),
      /** @param {unknown} msg */
      error: (msg) => log.error(formatLogMsg(msg)),
    },
  });
}
