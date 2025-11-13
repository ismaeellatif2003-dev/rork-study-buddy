import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runAILearningMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Starting AI Learning tables migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_add_ai_learning_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await pool.query(migrationSQL);
    
    console.log('✅ AI Learning tables migration completed successfully!');
    
    // Verify tables were created
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('note_embeddings', 'user_questions', 'user_knowledge_profiles')
      ORDER BY table_name
    `;
    
    const result = await pool.query(tablesQuery);
    const createdTables = result.rows.map(row => row.table_name);
    
    console.log('\n📊 AI Learning Tables Status:');
    const expectedTables = ['note_embeddings', 'user_questions', 'user_knowledge_profiles'];
    for (const table of expectedTables) {
      const exists = createdTables.includes(table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }
    
    if (createdTables.length === expectedTables.length) {
      console.log('\n🎉 All AI Learning tables are ready!');
    } else {
      console.log('\n⚠️  Some tables may be missing. Check the migration output above.');
    }
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    
    // Check if it's because tables already exist
    if (error.code === '42P07' || error.message?.includes('already exists')) {
      console.log('\n💡 Tables may already exist. Checking current status...');
      
      const checkQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('note_embeddings', 'user_questions', 'user_knowledge_profiles')
      `;
      
      const checkResult = await pool.query(checkQuery);
      if (checkResult.rows.length > 0) {
        console.log('✅ Tables already exist:');
        checkResult.rows.forEach(row => console.log(`  • ${row.table_name}`));
        console.log('\n✅ Migration not needed - tables are already present.');
      }
    } else {
      throw error;
    }
  } finally {
    await pool.end();
  }
}

// Run migration
if (require.main === module) {
  runAILearningMigration()
    .then(() => {
      console.log('\n✅ Migration process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration process failed:', error);
      process.exit(1);
    });
}

export { runAILearningMigration };
