import { getPool } from './db/pool.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Running GitHub OAuth Migration...\n');

try {
  const pool = getPool();
  
  // Read the migration SQL
  const migrationPath = join(__dirname, 'migrations/002_add_github_oauth.sql');
  const sql = await readFile(migrationPath, 'utf-8');
  
  console.log('📝 Executing migration SQL...');
  await pool.query(sql);
  console.log('✅ Migration executed successfully!\n');
  
  // Verify the column was added
  const result = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'github_id'
  `);
  
  if (result.rows.length > 0) {
    const col = result.rows[0];
    console.log('✅ Verified: github_id column exists');
    console.log(`   Type: ${col.data_type}`);
    console.log(`   Nullable: ${col.is_nullable}`);
  } else {
    console.log('⚠️  Warning: github_id column not found');
  }
  
  // Check index
  const indexResult = await pool.query(`
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'idx_users_github_id'
  `);
  
  if (indexResult.rows.length > 0) {
    console.log('✅ Index idx_users_github_id created');
  }
  
  console.log('\n🎉 GitHub OAuth migration complete!');
  
  await pool.end();
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('❌ Migration failed!\n');
  console.error('Error:', message);
  
  if (message.includes('already exists')) {
    console.log('\n✅ Column already exists - migration previously applied');
    process.exit(0);
  }
  
  process.exit(1);
}
