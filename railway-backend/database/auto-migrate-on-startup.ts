import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Auto-migration check - runs on startup if tables don't exist
 * This is safe to run on every startup - it uses IF NOT EXISTS
 */
export async function checkAndRunAIMigration(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('⚠️  No DATABASE_URL - skipping AI migration check');
    return;
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check if tables already exist
    const checkQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('note_embeddings', 'user_questions', 'user_knowledge_profiles')
    `;
    
    const checkResult = await pool.query(checkQuery);
    const existingTables = checkResult.rows.map(row => row.table_name);
    
    // If all tables exist, skip migration
    if (existingTables.length === 3) {
      console.log('✅ AI Learning tables already exist - skipping migration');
      return;
    }

    console.log('🔄 AI Learning tables missing - running migration...');
    
    // Read and execute migration
    const migrationPath = path.join(__dirname, 'run-migration-sql.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    await pool.query(migrationSQL);
    
    console.log('✅ AI Learning tables migration completed!');
    
  } catch (error: any) {
    // Don't fail startup if migration fails - just log it
    console.error('⚠️  AI migration check failed (non-fatal):', error.message);
  } finally {
    await pool.end();
  }
}
