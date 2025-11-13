-- Fix for: record "new" has no field "updated_at"
-- This script drops the problematic trigger on user_knowledge_profiles
-- The table uses 'last_updated' not 'updated_at', and we set it manually in UPDATE queries

DROP TRIGGER IF EXISTS update_user_knowledge_profiles_last_updated ON user_knowledge_profiles;

-- Verify the trigger is gone
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'user_knowledge_profiles';

