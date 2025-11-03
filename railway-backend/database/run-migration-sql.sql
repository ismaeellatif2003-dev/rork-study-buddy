-- Run this SQL directly in Railway's database query editor
-- Or execute via: psql $DATABASE_URL < run-migration-sql.sql

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
CREATE INDEX IF NOT EXISTS idx_note_embeddings_user_id ON note_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_note_embeddings_note_id ON note_embeddings(note_id);
CREATE INDEX IF NOT EXISTS idx_note_embeddings_content_type ON note_embeddings(content_type);
-- Vector similarity index (using HNSW for fast approximate nearest neighbor search)
CREATE INDEX IF NOT EXISTS idx_note_embeddings_vector ON note_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_user_questions_user_id ON user_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_created_at ON user_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_questions_topic_tags ON user_questions USING GIN(topic_tags);

CREATE INDEX IF NOT EXISTS idx_user_knowledge_profiles_user_id ON user_knowledge_profiles(user_id);

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

-- Verify tables were created
SELECT 
  '✅ Migration completed!' as status,
  COUNT(*) FILTER (WHERE table_name = 'note_embeddings') as note_embeddings_exists,
  COUNT(*) FILTER (WHERE table_name = 'user_questions') as user_questions_exists,
  COUNT(*) FILTER (WHERE table_name = 'user_knowledge_profiles') as user_knowledge_profiles_exists
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('note_embeddings', 'user_questions', 'user_knowledge_profiles');
