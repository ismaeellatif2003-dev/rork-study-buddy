const { Pool } = require('pg');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Running migration: Add auto_renew column to subscriptions table...');
    
    // Add auto_renew column
    await pool.query(`
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;
    `);
    
    // Update existing subscriptions
    await pool.query(`
      UPDATE subscriptions SET auto_renew = true WHERE auto_renew IS NULL;
    `);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the column was added
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' AND column_name = 'auto_renew';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ auto_renew column verified:', result.rows[0]);
    } else {
      console.log('❌ auto_renew column not found');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
