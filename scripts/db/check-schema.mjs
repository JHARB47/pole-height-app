#!/usr/bin/env node
import { config } from "dotenv";
import { Pool } from "pg";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../../server/.env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  console.log("📊 Database Schema Information\n");

  // Get tables
  const tables = await pool.query(`
    SELECT table_name, 
           (SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
    FROM information_schema.tables t
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);

  console.log("📋 Tables:");
  tables.rows.forEach((row) => {
    console.log(`   ✅ ${row.table_name} (${row.column_count} columns)`);
  });
  console.log(`\n📈 Total: ${tables.rows.length} tables\n`);

  // Get migration status
  const migrations = await pool.query(
    "SELECT version, name, applied_at FROM schema_migrations ORDER BY version",
  );

  if (migrations.rows.length > 0) {
    console.log("🔄 Applied Migrations:");
    migrations.rows.forEach((row) => {
      const date = new Date(row.applied_at).toLocaleString();
      console.log(`   ✅ ${row.version} - ${row.name} (${date})`);
    });
    console.log();
  }
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
} finally {
  await pool.end();
}
