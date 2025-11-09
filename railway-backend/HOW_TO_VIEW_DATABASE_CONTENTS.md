# How to View Database Contents

## 🎯 Quick Methods (Choose One)

### ⚠️ Note: Railway Query Tab May Not Be Available

If you don't see a "Query" or "Data" tab in Railway's PostgreSQL service, use **Method 2 (DBeaver)** instead - it's actually better!

### Method 1: Railway's Query Interface (If Available)

**This is the simplest way to see your data:**

1. **Go to Railway Dashboard**
   - Open https://railway.app
   - Select your project
   - Click on **PostgreSQL service**

2. **Open Query/Data Tab**
   - Click **"Query"** or **"Data"** tab
   - You'll see a SQL query editor

3. **Run These SQL Queries**

#### See All Tables with Row Counts:
```sql
SELECT 
  'users' as table_name, COUNT(*) as rows FROM users
UNION ALL SELECT 'notes', COUNT(*) FROM notes
UNION ALL SELECT 'flashcards', COUNT(*) FROM flashcards
UNION ALL SELECT 'essays', COUNT(*) FROM essays
UNION ALL SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL SELECT 'subscription_plans', COUNT(*) FROM subscription_plans
UNION ALL SELECT 'user_sessions', COUNT(*) FROM user_sessions
UNION ALL SELECT 'user_usage', COUNT(*) FROM user_usage
UNION ALL SELECT 'sync_events', COUNT(*) FROM sync_events
UNION ALL SELECT 'mobile_subscriptions', COUNT(*) FROM mobile_subscriptions
UNION ALL SELECT 'video_analyses', COUNT(*) FROM video_analyses
UNION ALL SELECT 'user_questions', COUNT(*) FROM user_questions
UNION ALL SELECT 'user_knowledge_profiles', COUNT(*) FROM user_knowledge_profiles
UNION ALL SELECT 'note_embeddings', COUNT(*) FROM note_embeddings
ORDER BY table_name;
```

#### View Data in Users Table:
```sql
SELECT * FROM users LIMIT 10;
```

#### View Data in Notes Table:
```sql
SELECT * FROM notes LIMIT 10;
```

#### View Data in Flashcards Table:
```sql
SELECT * FROM flashcards LIMIT 10;
```

#### View All Data (All Tables):
```sql
-- Users
SELECT 'users' as source_table, id, email, name, created_at FROM users LIMIT 5
UNION ALL
-- Notes  
SELECT 'notes', id::text, title, content, created_at FROM notes LIMIT 5
UNION ALL
-- Flashcards
SELECT 'flashcards', id::text, front, back, created_at FROM flashcards LIMIT 5;
```

### Method 2: Use Database GUI Tool (RECOMMENDED if Query Tab Missing)

Connect using `DATABASE_PUBLIC_URL` from your PostgreSQL service variables:

**Recommended Tools:**
- **DBeaver** (free) - https://dbeaver.io
- **pgAdmin** (free) - https://www.pgadmin.org
- **TablePlus** (paid, free trial) - https://tableplus.com

**Connection Details:**
- Get `DATABASE_PUBLIC_URL` from PostgreSQL service → Variables tab
- Use that connection string in your GUI tool
- Browse tables visually and see all data

### Method 3: Via Backend API (After Deployment)

Once the new endpoints are deployed, you can use:

```bash
# View overview of all tables with data
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/overview

# View specific table
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/table/users
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/table/notes?limit=20
```

### Method 4: Command Line (psql)

```bash
# Connect using DATABASE_PUBLIC_URL from Railway
psql "postgresql://postgres:YOUR_PASSWORD@HOST:PORT/railway"

# Once connected:
\dt                    # List all tables
SELECT * FROM users;    # View users table
SELECT * FROM notes;    # View notes table
\q                     # Quit
```

## 📊 Your Database Tables

Here are all the tables in your database:

1. **users** - User accounts
2. **notes** - Study notes
3. **flashcards** - Flashcards
4. **essays** - AI-generated essays
5. **subscriptions** - User subscriptions
6. **subscription_plans** - Available plans
7. **user_sessions** - Session tracking
8. **user_usage** - Usage tracking
9. **sync_events** - Sync events
10. **mobile_subscriptions** - Mobile subscriptions
11. **video_analyses** - Video analysis data
12. **user_questions** - AI learning questions
13. **user_knowledge_profiles** - Knowledge profiles
14. **note_embeddings** - Note embeddings

## 🔍 Useful SQL Queries

### Check if Tables Have Data:
```sql
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### View Table Structure:
```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'  -- Replace with any table name
ORDER BY ordinal_position;
```

### Find Tables with Data:
```sql
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

## 💡 Tips

- **Most tables are likely empty** (0 rows) since this is a new database
- **Use LIMIT** when querying to avoid loading too much data: `SELECT * FROM users LIMIT 10;`
- **Start with row counts** to see which tables have data
- **Railway's query interface** is the easiest - no setup required!

## 🚀 Quick Start

**Fastest way to see your data:**

1. Railway Dashboard → PostgreSQL Service → **Query** tab
2. Paste this:
   ```sql
   SELECT 'users' as table, COUNT(*) as rows FROM users
   UNION ALL SELECT 'notes', COUNT(*) FROM notes
   UNION ALL SELECT 'flashcards', COUNT(*) FROM flashcards;
   ```
3. Click **Run** or press Enter
4. You'll see which tables have data!

Then query the tables with data:
```sql
SELECT * FROM users LIMIT 10;  -- If users table has data
```

