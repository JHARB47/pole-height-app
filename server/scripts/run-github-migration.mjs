#!/usr/bin/env node
import { readFile } from "fs/promises";
import { Client } from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("✓ Connected");

    console.log("\nRunning migration: 002_add_github_oauth.sql");
    const migrationPath = join(
      __dirname,
      "../migrations/002_add_github_oauth.sql",
    );
    const sql = await readFile(migrationPath, "utf-8");

    await client.query(sql);
    console.log("✓ Migration completed successfully");

    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'github_id'
    `);

    if (result.rows.length > 0) {
      console.log("\n✓ Verified: github_id column exists");
      console.log(`  Type: ${result.rows[0].data_type}`);
    } else {
      console.log("\n⚠ Warning: github_id column not found after migration");
    }
  } catch (error) {
    console.error("\n✗ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n✓ Database connection closed");
  }
}

runMigration();
