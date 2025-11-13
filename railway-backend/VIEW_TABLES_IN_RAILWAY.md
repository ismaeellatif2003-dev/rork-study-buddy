# How to View All Tables in Railway

## Step-by-Step Instructions

### Step 1: Access Railway Dashboard
1. Go to [Railway Dashboard](https://railway.app)
2. Log in to your account
3. Select your project (e.g., "rork-study-buddy-production")

### Step 2: Open PostgreSQL Service
1. In your project, find and click on the **PostgreSQL service** (the database service)
2. You should see tabs like: **Deployments**, **Metrics**, **Variables**, **Data**, **Query**, etc.

### Step 3: Use the Query Tab (Recommended)
1. Click on the **"Query"** tab (or **"Data"** tab - depends on Railway version)
2. You'll see a SQL query editor

### Step 4: Run SQL Queries to View Tables

#### View All Tables with Row Counts
Copy and paste this SQL query:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

#### View All Tables with Actual Row Counts
This shows how many rows are in each table:

```sql
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'notes', COUNT(*) FROM notes
UNION ALL
SELECT 'flashcards', COUNT(*) FROM flashcards
UNION ALL
SELECT 'essays', COUNT(*) FROM essays
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'subscription_plans', COUNT(*) FROM subscription_plans
UNION ALL
SELECT 'user_sessions', COUNT(*) FROM user_sessions
UNION ALL
SELECT 'user_usage', COUNT(*) FROM user_usage
UNION ALL
SELECT 'sync_events', COUNT(*) FROM sync_events
UNION ALL
SELECT 'mobile_subscriptions', COUNT(*) FROM mobile_subscriptions
UNION ALL
SELECT 'video_analyses', COUNT(*) FROM video_analyses
UNION ALL
SELECT 'user_questions', COUNT(*) FROM user_questions
UNION ALL
SELECT 'user_knowledge_profiles', COUNT(*) FROM user_knowledge_profiles
UNION ALL
SELECT 'note_embeddings', COUNT(*) FROM note_embeddings
ORDER BY table_name;
```

#### View Data in a Specific Table
Replace `users` with any table name:

```sql
-- View users table
SELECT * FROM users LIMIT 10;

-- View notes table
SELECT * FROM notes LIMIT 10;

-- View flashcards table
SELECT * FROM flashcards LIMIT 10;
```

#### View Table Structure (Columns)
See what columns a table has:

```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'  -- Replace 'users' with any table name
ORDER BY ordinal_position;
```

## Quick Reference: Your 14 Tables

1. **users** - User accounts with Google SSO
2. **notes** - Study notes created by users
3. **flashcards** - Flashcards created by users
4. **essays** - AI-generated essays
5. **subscriptions** - User subscription records
6. **subscription_plans** - Available subscription plans
7. **user_sessions** - Cross-platform session management
8. **user_usage** - Usage tracking for limits
9. **sync_events** - Data synchronization events
10. **mobile_subscriptions** - Mobile app subscription linking
11. **video_analyses** - Video analysis data
12. **user_questions** - AI learning questions
13. **user_knowledge_profiles** - User knowledge profiles
14. **note_embeddings** - Note embeddings for AI search

## Alternative: Use Railway CLI

If you prefer command line:

```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Connect to PostgreSQL
railway connect postgres

# Once connected, run:
\dt  # List all tables
SELECT * FROM users LIMIT 10;  # Query a table
\q   # Quit
```

## Troubleshooting

### Can't Find "Query" or "Data" Tab
- Make sure you're in the **PostgreSQL service**, not the backend service
- Some Railway versions have it under **"Data"** tab
- If you don't see it, try using Railway CLI or a database GUI tool

### Query Editor Not Loading
- Refresh the page
- Make sure your PostgreSQL service is running (check the "Metrics" tab)
- Try using Railway CLI as an alternative

### "Permission Denied" Errors
- Make sure you're using the correct database user (`postgres`)
- Check that your PostgreSQL service is running
- Verify you're in the right project

## Tips

- **Limit results**: Always use `LIMIT` when querying large tables (e.g., `SELECT * FROM users LIMIT 10`)
- **View structure first**: Check table structure before querying to see what columns exist
- **Use WHERE clauses**: Filter data with `WHERE` to find specific records
- **Export data**: Railway's query interface may have an export option for results

## Example Workflow

1. **List all tables**: Run the first query above to see all table names
2. **Check row counts**: Run the second query to see how much data is in each table
3. **View a table**: Pick a table and run `SELECT * FROM table_name LIMIT 10`
4. **Check structure**: Run the column query to understand the table schema

