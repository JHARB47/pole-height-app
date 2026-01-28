#!/usr/bin/env node
/**
 * Check Database Migration Status
 * Shows which migrations are applied and which are pending
 */

import { config } from "dotenv";
import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, "../../server/.env") });

const DATABASE_URL =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function checkStatus() {
  try {
    console.log("🔍 Checking Migration Status\n");

    // Check if migrations table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'schema_migrations'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("⚠️  Migrations table does not exist yet");
      console.log("   Run: npm run db:migrate\n");
      return;
    }

    // Get applied migrations
    const applied = await pool.query(
      "SELECT version, name, applied_at FROM schema_migrations ORDER BY version",
    );

    // Get migration files
    const migrationsDir = path.join(__dirname, "../../server/migrations");
    let allFiles = [];

    if (fs.existsSync(migrationsDir)) {
      allFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort();
    }

    const appliedVersions = applied.rows.map((r) => r.version);
    const pending = allFiles.filter((file) => {
      const version = file.match(/^(\d{14})/)?.[1];
      return version && !appliedVersions.includes(version);
    });

    console.log("📊 Migration Summary:");
    console.log(`   Total migrations: ${allFiles.length}`);
    console.log(`   Applied: ${applied.rows.length}`);
    console.log(`   Pending: ${pending.length}\n`);

    if (applied.rows.length > 0) {
      console.log("✅ Applied Migrations:");
      applied.rows.forEach((row) => {
        const date = new Date(row.applied_at).toLocaleDateString();
        console.log(`   ${row.version} - ${row.name} (${date})`);
      });
      console.log();
    }

    if (pending.length > 0) {
      console.log("⏳ Pending Migrations:");
      pending.forEach((file) => {
        console.log(`   ${file}`);
      });
      console.log("\n💡 Run: npm run db:migrate\n");
    } else if (applied.rows.length > 0) {
      console.log("✅ Database is up to date!\n");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkStatus();
