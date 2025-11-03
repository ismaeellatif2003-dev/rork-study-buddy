#!/usr/bin/env node

/**
 * Quick migration runner - connects to Railway database and runs AI learning tables migration
 * Usage: node database/run-migration-now.js
 * 
 * Requires DATABASE_URL environment variable (Railway provides this automatically)
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.log('\n💡 Options:');
    console.log('  1. Run this from Railway one-off command: npm run db:ai-migration');
    console.log('  2. Set DATABASE_URL locally: export DATABASE_URL="your-railway-db-url"');
    console.log('  3. Run SQL directly in Railway dashboard (see MIGRATION_INSTRUCTIONS.md)');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database\n');

    console.log('🔄 Reading migration file...');
    const migrationPath = path.join(__dirname, 'run-migration-sql.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Running migration...\n');
    
    // Execute migration
    const result = await pool.query(migrationSQL);
    
    console.log('\n✅ Migration completed successfully!');
    
    // Verify tables
    console.log('\n📊 Verifying tables...');
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('note_embeddings', 'user_questions', 'user_knowledge_profiles')
      ORDER BY table_name
    `;
    
    const verifyResult = await pool.query(verifyQuery);
    const createdTables = verifyResult.rows.map(row => row.table_name);
    
    console.log('\n✅ Tables Status:');
    const expectedTables = ['note_embeddings', 'user_questions', 'user_knowledge_profiles'];
    let allGood = true;
    
    for (const table of expectedTables) {
      const exists = createdTables.includes(table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
      if (!exists) allGood = false;
    }
    
    if (allGood) {
      console.log('\n🎉 All AI Learning tables are ready!');
      console.log('✅ Personalized AI chat feature is now fully enabled!');
    } else {
      console.log('\n⚠️  Some tables may be missing. Check the output above.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    // Check if it's because tables already exist
    if (error.code === '42P07' || error.message?.includes('already exists')) {
      console.log('\n💡 Tables may already exist. Checking current status...');
      
      const checkQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('note_embeddings', 'user_questions', 'user_knowledge_profiles')
      `;
      
      try {
        const checkResult = await pool.query(checkQuery);
        if (checkResult.rows.length > 0) {
          console.log('\n✅ Tables already exist:');
          checkResult.rows.forEach(row => console.log(`  • ${row.table_name}`));
          console.log('\n✅ Migration not needed - tables are already present!');
          process.exit(0);
        }
      } catch (checkError) {
        console.error('Error checking tables:', checkError.message);
      }
    }
    
    console.error('\nFull error details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✅ Migration process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration process failed:', error);
    process.exit(1);
  });
