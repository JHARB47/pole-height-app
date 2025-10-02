#!/usr/bin/env node
import { config } from 'dotenv';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '../../server/.env') });

const DATABASE_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is required');
  process.exit(1);
}

console.log('�� Database Connection Status\n');
console.log('Connection:', DATABASE_URL.includes('pooler') ? '🔄 Pooled' : '🔗 Direct (Unpooled)');

const pool = new Pool({ connectionString: DATABASE_URL });

try {
  const result = await pool.query(`
    SELECT 
      current_database() as database,
      current_user as user,
      version() as version,
      NOW() as time
  `);
  
  const info = result.rows[0];
  console.log('Database:', info.database);
  console.log('User:', info.user);
  console.log('PostgreSQL:', info.version.match(/PostgreSQL [\d.]+/)[0]);
  console.log('Connected at:', info.time);
  console.log('\n✅ Database ready for migrations!\n');
  
} catch (error) {
  console.error('\n❌ Connection failed:', error.message);
  process.exit(1);
} finally {
  await pool.end();
}
