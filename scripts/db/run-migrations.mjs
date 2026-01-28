#!/usr/bin/env node
import { config } from "dotenv";
import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, "../../server/.env") });

const DATABASE_URL =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is required");
  process.exit(1);
}

console.log("🔧 Database Migration Runner");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
console.log(
  "📊 Connection:",
  DATABASE_URL.includes("pooler") ? "Pooled" : "Unpooled (Direct)",
);

const pool = new Pool({ connectionString: DATABASE_URL });

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("✅ Migrations tracking table ready\n");
}

async function getAppliedMigrations() {
  const result = await pool.query(
    "SELECT version FROM schema_migrations ORDER BY version",
  );
  return result.rows.map((row) => row.version);
}

function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, "../../server/migrations");
  if (!fs.existsSync(migrationsDir)) {
    console.log("ℹ️  No migrations directory found");
    return [];
  }
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

function parseMigrationFile(filename) {
  // Support two formats:
  // 1. Timestamp format: 20250101120000_migration_name.sql (14 digits)
  // 2. Simple format: 001_migration_name.sql (3+ digits)

  const timestampMatch = filename.match(/^(\d{14})_(.+)\.sql$/);
  if (timestampMatch) {
    return {
      version: timestampMatch[1],
      name: timestampMatch[2].replace(/_/g, " "),
      filename,
    };
  }

  const simpleMatch = filename.match(/^(\d+)_(.+)\.sql$/);
  if (simpleMatch) {
    return {
      version: simpleMatch[1].padStart(3, "0"),
      name: simpleMatch[2].replace(/_/g, " "),
      filename,
    };
  }

  throw new Error(
    `Invalid migration filename: ${filename}. Expected format: 001_name.sql or 20250101120000_name.sql`,
  );
}

async function runMigration(migration) {
  const filepath = path.join(
    __dirname,
    "../../server/migrations",
    migration.filename,
  );
  const sql = fs.readFileSync(filepath, "utf8");

  console.log(`🔄 Running: ${migration.name} (${migration.version})`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(
      "INSERT INTO schema_migrations (version, name) VALUES ($1, $2)",
      [migration.version, migration.name],
    );
    await client.query("COMMIT");
    console.log(`   ✅ Success\n`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`   ❌ Failed: ${error.message}\n`);
    throw error;
  } finally {
    client.release();
  }
}

async function migrate() {
  try {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();
    const allMigrations = getMigrationFiles().map(parseMigrationFile);
    const pending = allMigrations.filter((m) => !applied.includes(m.version));

    console.log("📋 Migration Status:");
    console.log(`   Applied: ${applied.length}`);
    console.log(`   Pending: ${pending.length}`);
    console.log(`   Total: ${allMigrations.length}\n`);

    if (pending.length === 0) {
      console.log("✅ Database is up to date!\n");
      return;
    }

    console.log("🚀 Running pending migrations...\n");
    for (const migration of pending) {
      await runMigration(migration);
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ All migrations completed successfully!`);
    console.log(`📊 ${pending.length} migration(s) applied\n`);
  } catch (error) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ Migration failed:", error.message);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
