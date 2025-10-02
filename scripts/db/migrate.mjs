#!/usr/bin/env node#!/usr/bin/env node

/**/**

 * Database Migration Runner * Database Migration Management Script

 * Uses unpooled connection for optimal migration performance * Handles up/down migrations with rollback capabilities

 *  */

 * Usage:import { migrate } from 'node-pg-migrate';

 *   npm run db:migrate              # Run all pending migrationsimport dotenv from 'dotenv';

 *   node scripts/db/migrate.mjs     # Same as aboveimport path from 'path';

 */import { fileURLToPath } from 'url';



import { config } from 'dotenv';dotenv.config();

import { Pool } from 'pg';

import fs from 'fs';const __filename = fileURLToPath(import.meta.url);

import path from 'path';const __dirname = path.dirname(__filename);

import { fileURLToPath } from 'url';

class MigrationManager {

const __filename = fileURLToPath(import.meta.url);  constructor() {

const __dirname = path.dirname(__filename);    this.config = {

      databaseUrl: process.env.DATABASE_URL,

// Load environment variables      migrationsTable: 'pgmigrations',

config({ path: path.join(__dirname, '../../server/.env') });      dir: path.join(__dirname, '../../server/db/migrations'),

      direction: 'up',

// Use unpooled connection for migrations (better for long-running transactions)      count: Infinity,

const DATABASE_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;      ignorePattern: '.*\\.map$',

      schema: process.env.DATABASE_SCHEMA || 'public',

if (!DATABASE_URL) {      createSchema: true,

  console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED is required');      checkOrder: true,

  console.error('📝 Check server/.env file');      verbose: true,

  process.exit(1);      noLock: false,

}    };

  }

console.log('🔧 Database Migration Runner');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');  /**

console.log('📊 Connection:', DATABASE_URL.includes('pooler') ? 'Pooled' : 'Unpooled (Direct)');   * Run migrations up (apply new migrations)

   */

const pool = new Pool({ connectionString: DATABASE_URL });  async up(count = Infinity) {

    console.log(`🔄 Running migrations UP${count !== Infinity ? ` (${count} steps)` : ''}...`);

/**    

 * Create migrations tracking table if it doesn't exist    try {

 */      const result = await migrate({

async function ensureMigrationsTable() {        ...this.config,

  const query = `        direction: 'up',

    CREATE TABLE IF NOT EXISTS schema_migrations (        count: count

      id SERIAL PRIMARY KEY,      });

      version VARCHAR(255) UNIQUE NOT NULL,      

      name VARCHAR(255) NOT NULL,      if (result.length === 0) {

      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP        console.log('✅ No new migrations to apply');

    );      } else {

  `;        console.log(`✅ Applied ${result.length} migration(s):`);

          result.forEach(migration => {

  await pool.query(query);          console.log(`   - ${migration.name}`);

  console.log('✅ Migrations tracking table ready\n');        });

}      }

      

/**      return result;

 * Get list of applied migrations    } catch (error) {

 */      console.error('❌ Migration UP failed:', error);

async function getAppliedMigrations() {      throw error;

  const result = await pool.query(    }

    'SELECT version FROM schema_migrations ORDER BY version'  }

  );

  return result.rows.map(row => row.version);  /**

}   * Run migrations down (rollback migrations)

   */

/**  async down(count = 1) {

 * Get list of migration files    console.log(`🔄 Rolling back ${count} migration(s)...`);

 */    

function getMigrationFiles() {    try {

  const migrationsDir = path.join(__dirname, '../../server/migrations');      const result = await migrate({

          ...this.config,

  if (!fs.existsSync(migrationsDir)) {        direction: 'down',

    console.log('ℹ️  No migrations directory found');        count: count

    return [];      });

  }      

        if (result.length === 0) {

  return fs.readdirSync(migrationsDir)        console.log('✅ No migrations to rollback');

    .filter(file => file.endsWith('.sql'))      } else {

    .sort();        console.log(`✅ Rolled back ${result.length} migration(s):`);

}        result.forEach(migration => {

          console.log(`   - ${migration.name}`);

/**        });

 * Parse migration filename to extract version and name      }

 */      

function parseMigrationFile(filename) {      return result;

  // Format: YYYYMMDDHHMMSS_migration_name.sql    } catch (error) {

  const match = filename.match(/^(\d{14})_(.+)\.sql$/);      console.error('❌ Migration DOWN failed:', error);

  if (!match) {      throw error;

    throw new Error(`Invalid migration filename: ${filename}`);    }

  }  }

  return {

    version: match[1],  /**

    name: match[2].replace(/_/g, ' '),   * Create a new migration file

    filename   */

  };  async create(name) {

}    if (!name) {

      throw new Error('Migration name is required');

/**    }

 * Run a single migration    

 */    console.log(`📝 Creating new migration: ${name}`);

async function runMigration(migration) {    

  const migrationsDir = path.join(__dirname, '../../server/migrations');    try {

  const filepath = path.join(migrationsDir, migration.filename);      const result = await migrate({

  const sql = fs.readFileSync(filepath, 'utf8');        ...this.config,

          direction: 'up',

  console.log(`🔄 Running: ${migration.name} (${migration.version})`);        count: 0,

          'create-migration': name

  const client = await pool.connect();      });

  try {      

    await client.query('BEGIN');      console.log(`✅ Created migration file: ${result}`);

          return result;

    // Run migration SQL    } catch (error) {

    await client.query(sql);      console.error('❌ Migration creation failed:', error);

          throw error;

    // Record migration    }

    await client.query(  }

      'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',

      [migration.version, migration.name]  /**

    );   * Show migration status

       */

    await client.query('COMMIT');  async status() {

    console.log(`   ✅ Success\n`);    console.log('📊 Checking migration status...');

        

  } catch (error) {    try {

    await client.query('ROLLBACK');      // This is a bit of a hack since node-pg-migrate doesn't have a built-in status command

    console.error(`   ❌ Failed: ${error.message}\n`);      const { Client } = await import('pg');

    throw error;      const client = new Client({ connectionString: this.config.databaseUrl });

  } finally {      

    client.release();      await client.connect();

  }      

}      // Check if migrations table exists

      const tableExists = await client.query(`

/**        SELECT EXISTS (

 * Main migration function          SELECT FROM information_schema.tables 

 */          WHERE table_schema = $1 AND table_name = $2

async function migrate() {        )

  try {      `, [this.config.schema, this.config.migrationsTable]);

    // Ensure migrations table exists      

    await ensureMigrationsTable();      if (!tableExists.rows[0].exists) {

            console.log('⚠️  No migration table found. Database not initialized.');

    // Get applied and pending migrations        await client.end();

    const applied = await getAppliedMigrations();        return;

    const allMigrations = getMigrationFiles().map(parseMigrationFile);      }

    const pending = allMigrations.filter(m => !applied.includes(m.version));      

          // Get applied migrations

    console.log('📋 Migration Status:');      const applied = await client.query(`

    console.log(`   Applied: ${applied.length}`);        SELECT name, run_on 

    console.log(`   Pending: ${pending.length}`);        FROM ${this.config.schema}.${this.config.migrationsTable} 

    console.log(`   Total: ${allMigrations.length}\n`);        ORDER BY run_on DESC

          `);

    if (pending.length === 0) {      

      console.log('✅ Database is up to date!\n');      console.log(`✅ Migration status (${applied.rows.length} applied):`);

      return;      if (applied.rows.length === 0) {

    }        console.log('   No migrations have been applied');

          } else {

    // Run pending migrations        applied.rows.forEach((row, index) => {

    console.log('🚀 Running pending migrations...\n');          const status = index === 0 ? ' (latest)' : '';

    for (const migration of pending) {          console.log(`   ✓ ${row.name} - ${row.run_on.toISOString()}${status}`);

      await runMigration(migration);        });

    }      }

          

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');      await client.end();

    console.log('✅ All migrations completed successfully!');      return applied.rows;

    console.log(`📊 ${pending.length} migration(s) applied\n`);      

        } catch (error) {

  } catch (error) {      console.error('❌ Status check failed:', error);

    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');      throw error;

    console.error('❌ Migration failed:', error.message);    }

    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');  }

    process.exit(1);

  } finally {  /**

    await pool.end();   * Reset database (rollback all migrations)

  }   */

}  async reset() {

    console.log('🔄 Resetting database (rolling back all migrations)...');

// Run migrations    

migrate();    try {

      const result = await migrate({
        ...this.config,
        direction: 'down',
        count: Infinity
      });
      
      console.log(`✅ Reset complete. Rolled back ${result.length} migration(s)`);
      return result;
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  const manager = new MigrationManager();
  
  try {
    switch (command) {
      case 'up':
        await manager.up(arg ? parseInt(arg) : undefined);
        break;
        
      case 'down':
        await manager.down(arg ? parseInt(arg) : 1);
        break;
        
      case 'create':
        if (!arg) {
          console.error('❌ Migration name is required');
          console.log('Usage: npm run db:create <migration-name>');
          process.exit(1);
        }
        await manager.create(arg);
        break;
        
      case 'status':
        await manager.status();
        break;
        
      case 'reset':
        console.log('⚠️  This will rollback ALL migrations. Continue? (y/N)');
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
          rl.question('', resolve);
        });
        rl.close();
        
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          await manager.reset();
        } else {
          console.log('❌ Reset cancelled');
        }
        break;
        
      default:
        console.log('Database Migration Manager');
        console.log('');
        console.log('Usage:');
        console.log('  npm run db:migrate up [count]    - Apply migrations');
        console.log('  npm run db:migrate down [count]  - Rollback migrations');
        console.log('  npm run db:migrate status        - Show migration status');
        console.log('  npm run db:migrate create <name> - Create new migration');
        console.log('  npm run db:migrate reset         - Rollback all migrations');
        console.log('');
        console.log('Examples:');
        console.log('  npm run db:migrate up            - Apply all pending migrations');
        console.log('  npm run db:migrate down 2        - Rollback last 2 migrations');
        console.log('  npm run db:migrate create add-user-table');
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MigrationManager };