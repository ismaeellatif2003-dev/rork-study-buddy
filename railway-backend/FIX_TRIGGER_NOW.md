# Fix Database Trigger Error - Quick Guide

## 🚨 Problem
The error `record "new" has no field "updated_at"` occurs because a trigger is trying to update a column that doesn't exist on `user_knowledge_profiles` table.

## ✅ Solution Options

### Option 1: Use Backend API (Easiest)

**Step 1:** Set an admin secret in Railway environment variables:
- Go to Railway → Backend Service → Variables
- Add: `ADMIN_SECRET=your-random-secret-here` (use a strong random string)

**Step 2:** Call the fix endpoint:
```bash
curl -X POST "https://rork-study-buddy-production-eeeb.up.railway.app/db/fix-trigger?secret=your-random-secret-here"
```

Or open in browser:
```
https://rork-study-buddy-production-eeeb.up.railway.app/db/fix-trigger?secret=your-random-secret-here
```

**Step 3:** Verify it worked - you should see:
```json
{
  "success": true,
  "message": "Trigger dropped successfully",
  "remainingTriggers": []
}
```

**Step 4:** Remove the `ADMIN_SECRET` from Railway variables after fixing (for security)

### Option 2: Use Railway Query Interface

1. Go to Railway Dashboard → PostgreSQL Service
2. Click "Query" or "Data" tab
3. Run this SQL:
```sql
DROP TRIGGER IF EXISTS update_user_knowledge_profiles_last_updated ON user_knowledge_profiles;
```

4. Verify it's gone:
```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'user_knowledge_profiles';
```

### Option 3: Use DBeaver (If Railway Query Tab Not Available)

1. Connect to your Railway database using `DATABASE_PUBLIC_URL`
2. Open SQL Editor
3. Run the same SQL as Option 2

## ✅ After Fixing

The error should stop appearing in your logs. The `user_knowledge_profiles` table will continue to work correctly because the UPDATE queries manually set `last_updated = NOW()`.

