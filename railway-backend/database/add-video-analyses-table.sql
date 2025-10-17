-- Add video_analyses table for video analysis feature
CREATE TABLE IF NOT EXISTS video_analyses (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'youtube' or 'upload'
  source_url TEXT,
  status VARCHAR(50) DEFAULT 'processing' NOT NULL, -- 'processing', 'completed', 'failed'
  progress INTEGER DEFAULT 0,
  transcript TEXT,
  duration INTEGER, -- in seconds
  topics JSONB,
  notes JSONB,
  flashcards JSONB,
  overall_summary TEXT,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_analyses_user_id ON video_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_video_analyses_status ON video_analyses(status);
CREATE INDEX IF NOT EXISTS idx_video_analyses_created_at ON video_analyses(created_at);
