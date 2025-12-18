import { Pool } from 'pg';
import { newDb } from 'pg-mem';
import { ENV } from '../config/env.js';
import { log } from '../utils/logger.js';

/** @type {Pool | undefined} */
let pool;
let isPgMem = false;

export function getPool() {
  if (!pool) {
    const connectionString = ENV.databaseUrl;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required to initialize database pool');
    }
    if (connectionString.startsWith('pgmem://')) {
      isPgMem = true;
      const db = newDb({ autoCreateForeignKeyIndices: true });
      db.public.registerFunction({
        name: 'current_database',
        // @ts-expect-error pg-mem accepts string return type declarations
        returns: 'text',
        implementation: () => 'pgmem',
      });
      const adapter = db.adapters.createPg();
      pool = new adapter.Pool();
      log.debug('Using in-memory pg-mem database');
    } else {
      pool = new Pool({ connectionString });
    }
  }
  return pool;
}

export function isInMemoryDb() {
  return isPgMem;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
    isPgMem = false;
  }
}
