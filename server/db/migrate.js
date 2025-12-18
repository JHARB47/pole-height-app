import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { run as pgMigrate } from 'node-pg-migrate';
import { ENV } from '../config/env.js';
import { log } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runMigrations({ direction = 'up', databaseUrl = ENV.databaseUrl, schema = ENV.databaseSchema, migrationsTable = 'pgmigrations' } = {}) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for migrations');
  }
  log.debug(`Running migrations ${direction} on ${databaseUrl}`);
  return pgMigrate({
    dir: resolve(__dirname, 'migrations'),
    direction,
    count: Infinity,
    databaseUrl,
    schema,
    migrationsTable,
    createSchema: true,
    logFileName: undefined,
    logger: {
      /** @param {unknown} msg */
      info: (msg) => log.debug(String(msg)),
      /** @param {unknown} msg */
      warn: (msg) => log.warn(String(msg)),
      /** @param {unknown} msg */
      error: (msg) => log.error(String(msg)),
    },
  });
}
