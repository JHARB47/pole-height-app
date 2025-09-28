#!/usr/bin/env node
import { Client } from 'pg';
import { loadEnv } from '../../server/config/env.js';
import { runMigrations } from '../../server/db/migrate.js';

const env = loadEnv();

async function reset() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required for db:reset');
  }
  if (env.databaseUrl.startsWith('pgmem://')) {
    await runMigrations({ direction: 'down' });
    await runMigrations({ direction: 'up' });
    return;
  }
  const client = new Client({ connectionString: env.databaseUrl });
  await client.connect();
  const schema = env.databaseSchema || 'public';
  await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await client.query(`CREATE SCHEMA ${schema}`);
  await client.end();
  await runMigrations({ direction: 'up' });
}

reset().then(() => {
  console.log('Database reset complete');
}).catch((err) => {
  console.error('Database reset failed', err);
  process.exitCode = 1;
});
