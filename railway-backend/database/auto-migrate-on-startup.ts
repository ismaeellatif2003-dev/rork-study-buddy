import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * SQL for tables that don't require pgvector extension
 */
const TABLES_WITHOUT_VECTOR = `
-- Table to track user questions and AI responses for learning
CREATE TABLE IF NOT EXISTS user_questions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  context_note_ids INTEGER[],
  topic_tags TEXT[],
  difficulty VARCHAR(20) DEFAULT 'medium',
  feedback_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table to store user knowledge profiles and learning patterns
CREATE TABLE IF NOT EXISTS user_knowledge_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  topics_studied JSONB DEFAULT '[]'::jsonb,
  weak_areas JSONB DEFAULT '[]'::jsonb,
  strong_areas JSONB DEFAULT '[]'::jsonb,
  study_preferences JSONB DEFAULT '{}'::jsonb,
  question_patterns JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_questions_user_id ON user_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_created_at ON user_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_questions_topic_tags ON user_questions USING GIN(topic_tags);

CREATE INDEX IF NOT EXISTS idx_user_knowledge_profiles_user_id ON user_knowledge_profiles(user_id);
`;

/**
 * SQL for note_embeddings table with vector support
 */
const NOTE_EMBEDDINGS_WITH_VECTOR = `
-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store embeddings for notes and questions
CREATE TABLE IF NOT EXISTS note_embeddings (
  id SERIAL PRIMARY KEY,
  note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) DEFAULT 'note',
  content_text TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(note_id, content_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_note_embeddings_user_id ON note_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_note_embeddings_note_id ON note_embeddings(note_id);
CREATE INDEX IF NOT EXISTS idx_note_embeddings_content_type ON note_embeddings(content_type);
-- Vector similarity index (using HNSW for fast approximate nearest neighbor search)
CREATE INDEX IF NOT EXISTS idx_note_embeddings_vector ON note_embeddings USING hnsw (embedding vector_cosine_ops);
`;

/**
 * SQL for note_embeddings table without vector support (fallback)
 */
const NOTE_EMBEDDINGS_WITHOUT_VECTOR = `
-- Table to store embeddings for notes and questions (without vector support)
-- Note: Vector similarity search will not be available without pgvector extension
CREATE TABLE IF NOT EXISTS note_embeddings (
  id SERIAL PRIMARY KEY,
  note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) DEFAULT 'note',
  content_text TEXT NOT NULL,
  embedding JSONB, -- Store as JSONB array instead of vector type
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(note_id, content_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_note_embeddings_user_id ON note_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_note_embeddings_note_id ON note_embeddings(note_id);
CREATE INDEX IF NOT EXISTS idx_note_embeddings_content_type ON note_embeddings(content_type);
`;

/**
 * Common SQL for triggers and functions
 */
const COMMON_SQL = `
-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at
DROP TRIGGER IF EXISTS update_note_embeddings_updated_at ON note_embeddings;
CREATE TRIGGER update_note_embeddings_updated_at 
  BEFORE UPDATE ON note_embeddings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_questions_updated_at ON user_questions;
CREATE TRIGGER update_user_questions_updated_at 
  BEFORE UPDATE ON user_questions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_knowledge_profiles_last_updated ON user_knowledge_profiles;
CREATE TRIGGER update_user_knowledge_profiles_last_updated 
  BEFORE UPDATE ON user_knowledge_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

/**
 * Check if pgvector extension is available
 */
async function checkVectorExtension(pool: Pool): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT EXISTS(
        SELECT 1 FROM pg_available_extensions WHERE name = 'vector'
      ) as extension_available
    `);
    return result.rows[0]?.extension_available === true;
  } catch (error) {
    console.log('⚠️  Could not check for vector extension:', error);
    return false;
  }
}

/**
 * Try to enable vector extension
 */
async function tryEnableVectorExtension(pool: Pool): Promise<boolean> {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
    return true;
  } catch (error: any) {
    console.log('⚠️  pgvector extension not available:', error.message);
    return false;
  }
}

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
    
    // First, create tables that don't require vector extension
    console.log('📝 Creating user_questions and user_knowledge_profiles tables...');
    await pool.query(TABLES_WITHOUT_VECTOR);
    
    // Check if vector extension is available
    const hasVectorExtension = await checkVectorExtension(pool);
    let vectorEnabled = false;
    
    if (hasVectorExtension) {
      console.log('🔍 pgvector extension is available - attempting to enable...');
      vectorEnabled = await tryEnableVectorExtension(pool);
    }
    
    // Create note_embeddings table with or without vector support
    if (vectorEnabled) {
      console.log('✅ Creating note_embeddings table with vector support...');
      await pool.query(NOTE_EMBEDDINGS_WITH_VECTOR);
    } else {
      console.log('⚠️  Creating note_embeddings table without vector support (pgvector not available)');
      console.log('   Note: Vector similarity search will not be available');
      await pool.query(NOTE_EMBEDDINGS_WITHOUT_VECTOR);
    }
    
    // Create triggers and functions
    console.log('🔧 Setting up triggers and functions...');
    await pool.query(COMMON_SQL);
    
    console.log('✅ AI Learning tables migration completed!');
    
    // Verify tables
    const verifyResult = await pool.query(checkQuery);
    const createdTables = verifyResult.rows.map(row => row.table_name);
    console.log(`📊 Created tables: ${createdTables.join(', ')}`);
    
  } catch (error: any) {
    // Don't fail startup if migration fails - just log it
    console.error('⚠️  AI migration check failed (non-fatal):', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await pool.end();
  }
}
