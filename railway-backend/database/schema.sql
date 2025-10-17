-- Study Buddy Database Schema
-- PostgreSQL database for cross-platform Google SSO and data sync

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with Google SSO
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  picture TEXT,
  mobile_device_id VARCHAR(255), -- For mobile app linking
  web_session_id VARCHAR(255),   -- For web session tracking
  age INTEGER,                   -- User's age
  education_level VARCHAR(50),   -- User's education level
  is_onboarding_complete BOOLEAN DEFAULT false, -- Whether user completed onboarding
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP DEFAULT NOW()
);

-- Subscription plans table
CREATE TABLE subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  yearly_price DECIMAL(10,2),
  billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
  limits JSONB NOT NULL,
  features JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) REFERENCES subscription_plans(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User sessions for cross-platform sync
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  platform VARCHAR(20) NOT NULL, -- 'mobile' or 'web'
  device_info JSONB,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User usage tracking
CREATE TABLE user_usage (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notes INTEGER DEFAULT 0,
  flashcards INTEGER DEFAULT 0,
  messages INTEGER DEFAULT 0,
  essays INTEGER DEFAULT 0,
  ocr_scans INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User notes
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Video analyses
CREATE TABLE video_analyses (
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

CREATE INDEX idx_video_analyses_user_id ON video_analyses(user_id);
CREATE INDEX idx_video_analyses_status ON video_analyses(status);
CREATE INDEX idx_video_analyses_created_at ON video_analyses(created_at);

-- User flashcards
CREATE TABLE flashcards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  set_id VARCHAR(255) NOT NULL,
  set_name VARCHAR(255) NOT NULL,
  set_description TEXT,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User essays
CREATE TABLE essays (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  citations JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cross-platform data sync events
CREATE TABLE sync_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'subscription_change', 'usage_update', 'note_created', etc.
  data JSONB NOT NULL,
  platform VARCHAR(20) NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mobile app subscription links (for linking mobile purchases to web accounts)
CREATE TABLE mobile_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL, -- 'ios' or 'android'
  product_id VARCHAR(255) NOT NULL,
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  purchase_token TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_onboarding ON users(is_onboarding_complete);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_active ON subscriptions(is_active);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_set_id ON flashcards(set_id);
CREATE INDEX idx_essays_user_id ON essays(user_id);
CREATE INDEX idx_sync_events_user_id ON sync_events(user_id);
CREATE INDEX idx_sync_events_processed ON sync_events(processed);
CREATE INDEX idx_mobile_subscriptions_user_id ON mobile_subscriptions(user_id);
CREATE INDEX idx_mobile_subscriptions_transaction ON mobile_subscriptions(transaction_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, price, yearly_price, billing_period, limits, features) VALUES
('free', 'Free', 0, 0, 'monthly', 
 '{"notes": 5, "flashcards": 25, "messages": 10, "essays": 1, "ocrScans": 3}',
 '["5 notes", "25 flashcards", "10 AI questions", "1 essay", "OCR text extraction"]'),
 
('pro-monthly', 'Pro Monthly', 9.99, 0, 'monthly',
 '{"notes": -1, "flashcards": -1, "messages": -1, "essays": -1, "ocrScans": -1}',
 '["Unlimited notes", "Unlimited flashcards", "Unlimited AI questions", "Unlimited essays", "Unlimited OCR scans", "Priority support", "Advanced AI features"]'),
 
('pro-yearly', 'Pro Yearly', 9.99, 99.99, 'yearly',
 '{"notes": -1, "flashcards": -1, "messages": -1, "essays": -1, "ocrScans": -1}',
 '["Unlimited notes", "Unlimited flashcards", "Unlimited AI questions", "Unlimited essays", "Unlimited OCR scans", "Priority support", "Advanced AI features", "Save 17% with yearly billing"]');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_usage_updated_at BEFORE UPDATE ON user_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_essays_updated_at BEFORE UPDATE ON essays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mobile_subscriptions_updated_at BEFORE UPDATE ON mobile_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
