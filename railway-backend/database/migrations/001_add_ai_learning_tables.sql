-- Migration: Add AI Learning and Personalization Tables
-- This migration adds support for RAG (Retrieval-Augmented Generation)
-- and personalized AI learning based on user notes and questions
--
-- IMPORTANT: This migration requires pgvector extension
-- If pgvector is not available (e.g., Railway PostgreSQL), this migration will fail
-- 
-- Recommended: Use the auto-migration in auto-migrate-on-startup.ts which handles
-- missing pgvector gracefully, or run run-migration-sql.sql which has error handling
--
-- Enable pgvector extension for vector similarity search
-- Note: This will fail if pgvector is not installed on PostgreSQL
-- Railway PostgreSQL does not include pgvector by default
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store embeddings for notes and questions
-- Embeddings are vector representations used for semantic search
CREATE TABLE note_embeddings (
  id SERIAL PRIMARY KEY,
  note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) DEFAULT 'note', -- 'note', 'question', 'summary'
  content_text TEXT NOT NULL, -- Original text that was embedded
  embedding vector(1536), -- OpenAI text-embedding-3-small produces 1536-dimensional vectors
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(note_id, content_type)
);

-- Table to track user questions and AI responses for learning
CREATE TABLE user_questions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  context_note_ids INTEGER[], -- Array of note IDs that were used as context
  topic_tags TEXT[], -- Extracted topics/keywords from the question
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  feedback_score INTEGER, -- User feedback 1-5 (if provided)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table to store user knowledge profiles and learning patterns
CREATE TABLE user_knowledge_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  topics_studied JSONB DEFAULT '[]'::jsonb, -- Array of topics the user has studied
  weak_areas JSONB DEFAULT '[]'::jsonb, -- Topics user struggles with
  strong_areas JSONB DEFAULT '[]'::jsonb, -- Topics user excels at
  study_preferences JSONB DEFAULT '{}'::jsonb, -- Learning style, preferred format, etc.
  question_patterns JSONB DEFAULT '{}'::jsonb, -- Common question types, frequency
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_note_embeddings_user_id ON note_embeddings(user_id);
CREATE INDEX idx_note_embeddings_note_id ON note_embeddings(note_id);
CREATE INDEX idx_note_embeddings_content_type ON note_embeddings(content_type);
-- Vector similarity index (using HNSW for fast approximate nearest neighbor search)
CREATE INDEX idx_note_embeddings_vector ON note_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_user_questions_user_id ON user_questions(user_id);
CREATE INDEX idx_user_questions_created_at ON user_questions(created_at DESC);
CREATE INDEX idx_user_questions_topic_tags ON user_questions USING GIN(topic_tags);

CREATE INDEX idx_user_knowledge_profiles_user_id ON user_knowledge_profiles(user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_note_embeddings_updated_at 
  BEFORE UPDATE ON note_embeddings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_questions_updated_at 
  BEFORE UPDATE ON user_questions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: user_knowledge_profiles uses 'last_updated' not 'updated_at'
-- The trigger is not needed since we manually set last_updated = NOW() in UPDATE queries
-- No trigger needed for user_knowledge_profiles

-- Function to automatically create embeddings when notes are created/updated
-- This will be called from the backend service
COMMENT ON TABLE note_embeddings IS 'Stores vector embeddings for semantic search across user notes';
COMMENT ON TABLE user_questions IS 'Tracks user questions and AI responses for learning patterns';
COMMENT ON TABLE user_knowledge_profiles IS 'Stores personalized learning profiles and study patterns';

