require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Running video analyses table migration...');
    const migrationSql = fs.readFileSync(path.join(__dirname, 'database/add-video-analyses-table.sql'), 'utf8');
    await pool.query(migrationSql);
    console.log('✅ Video analyses table migration completed successfully!');

    // Verify table was created
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'video_analyses'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 Video analyses table structure:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.column_name} (${row.data_type}) - nullable: ${row.is_nullable === 'YES' ? 'YES' : 'NO'}, default: ${row.column_default || 'none'}`);
    });

  } catch (error) {
    console.error('❌ Video analyses table migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);
