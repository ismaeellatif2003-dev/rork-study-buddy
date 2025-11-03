# Run AI Learning Migration - Quick Guide

## Option 1: Via Railway Dashboard (Easiest) ⭐

1. Go to [Railway Dashboard](https://railway.app)
2. Select your **Study Buddy Backend** project
3. Click on your **PostgreSQL database** service
4. Go to the **"Data"** or **"Query"** tab
5. Click **"New Query"** or open the SQL editor
6. Copy the entire contents of `database/run-migration-sql.sql`
7. Paste and click **"Run"** or **"Execute"**
8. You should see: `✅ Migration completed!` with all tables showing as `1`

## Option 2: Via Railway CLI

If you have Railway CLI installed:

```bash
cd railway-backend
railway link
railway run npm run db:ai-migration
```

Or run the SQL file directly:

```bash
railway connect postgres
# Then in psql:
\i database/run-migration-sql.sql
```

## Option 3: One-Off Deployment

1. Go to Railway Dashboard → Your Backend Service
2. Go to **"Deployments"**
3. Click **"New Deployment"**
4. Set **"Command"** to: `npm run db:ai-migration`
5. Deploy

## Verify Migration

After running, verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('note_embeddings', 'user_questions', 'user_knowledge_profiles');
```

You should see all 3 tables.

## Files Created

- `database/run-migration-sql.sql` - Ready-to-run SQL file (use this in Railway dashboard)
- `database/run-ai-learning-migration.ts` - TypeScript migration runner
- `npm run db:ai-migration` - Script command to run migration

## What This Does

Creates three tables for personalized AI learning:
1. **note_embeddings** - Stores vector embeddings for semantic search
2. **user_questions** - Tracks user questions and AI responses
3. **user_knowledge_profiles** - Stores personalized learning profiles

Once migrated, the AI chat feature will use your notes as context for better, personalized responses!
