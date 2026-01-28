import { getPool } from "./db/pool.js";

console.log("🔌 Testing Neon Database Connection...\n");

try {
  const pool = getPool();
  const result = await pool.query(`
    SELECT 
      NOW() as current_time,
      version() as postgres_version,
      current_database() as database_name,
      current_user as user_name
  `);

  const info = result.rows[0];

  console.log("✅ DATABASE CONNECTION SUCCESSFUL!\n");
  console.log("📊 Connection Details:");
  console.log("   Database:", info.database_name);
  console.log("   User:", info.user_name);
  console.log("   Time:", info.current_time);
  console.log(
    "   PostgreSQL:",
    info.postgres_version.match(/PostgreSQL [\d.]+/)[0],
  );
  console.log("\n🎉 Your Neon database is ready to use!");

  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("❌ CONNECTION FAILED!\n");
  console.error("Error:", message);
  console.error("\n📝 Troubleshooting:");
  console.error("   1. Check DATABASE_URL in server/.env");
  console.error("   2. Ensure SSL mode is enabled (?sslmode=require)");
  console.error("   3. Verify Neon database is active");
  console.error("   4. Check network/firewall settings");
  process.exit(1);
}
