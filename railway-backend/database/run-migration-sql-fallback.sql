-- Fallback migration for when pgvector extension is not available
-- Run this if the main migration fails due to missing pgvector extension
-- This creates note_embeddings table with JSONB storage instead of vector type

-- Note: This version stores embeddings as JSONB arrays instead of vector type
-- Vector similarity search will not be available, but embeddings can still be stored

-- Drop note_embeddings table if it exists (in case partial migration occurred)
DROP TABLE IF EXISTS note_embeddings CASCADE;

-- Create note_embeddings table without vector support
CREATE TABLE note_embeddings (
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
CREATE INDEX idx_note_embeddings_user_id ON note_embeddings(user_id);
CREATE INDEX idx_note_embeddings_note_id ON note_embeddings(note_id);
CREATE INDEX idx_note_embeddings_content_type ON note_embeddings(content_type);
-- GIN index for JSONB embedding searches (less efficient than vector similarity)
CREATE INDEX idx_note_embeddings_embedding_gin ON note_embeddings USING GIN (embedding);

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_note_embeddings_updated_at ON note_embeddings;
CREATE TRIGGER update_note_embeddings_updated_at 
  BEFORE UPDATE ON note_embeddings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify table was created
SELECT 
  '✅ Fallback migration completed!' as status,
  COUNT(*) FILTER (WHERE table_name = 'note_embeddings') as note_embeddings_exists
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'note_embeddings';

