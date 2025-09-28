const path = require('path');
require('dotenv').config({ path: process.env.ENV_FILE || '.env' });

const databaseUrl = process.env.DATABASE_URL || (process.env.NODE_ENV === 'test' ? 'pgmem://test-suite' : undefined);

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set before running migrations');
}

module.exports = {
  databaseUrl,
  dir: path.resolve(__dirname, 'migrations'),
  direction: 'up',
  migrationsTable: 'pgmigrations',
  schema: process.env.DATABASE_SCHEMA || 'public',
  count: Infinity,
  createSchema: true,
};
