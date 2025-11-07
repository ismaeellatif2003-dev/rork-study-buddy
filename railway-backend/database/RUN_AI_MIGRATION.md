# Running AI Learning Tables Migration

The `note_embeddings`, `user_questions`, and `user_knowledge_profiles` tables are required for the personalized AI chat feature to work properly.

## Common Errors

### Error: "relation does not exist"
If you see this error:
```
relation "note_embeddings" does not exist
relation "user_questions" does not exist
relation "user_knowledge_profiles" does not exist
```

This means the migration hasn't been run yet.

### Error: "extension vector is not available"
If you see this error:
```
ERROR: extension "vector" is not available
DETAIL: Could not open extension control file "/usr/share/postgresql/17/extension/vector.control": No such file or directory
```

This means the pgvector extension is not installed on your PostgreSQL instance. **The migration will automatically handle this** by:
1. Creating `user_questions` and `user_knowledge_profiles` tables (these don't need pgvector)
2. Creating `note_embeddings` with JSONB storage instead of vector type (if pgvector is unavailable)

**Note:** Without pgvector, vector similarity search will not be available, but embeddings can still be stored and the rest of the AI features will work.

## Solution

### Option 1: Run Migration via Railway CLI (Recommended)

1. Install Railway CLI if you haven't:
   ```bash
   npm i -g @railway/cli
   ```

2. Connect to your Railway project:
   ```bash
   railway link
   ```

3. Run the migration:
   ```bash
   railway run npm run db:ai-migration
   ```

### Option 2: Run Migration via Railway Dashboard

1. Go to your Railway project dashboard
2. Select your backend service
3. Go to "Settings" → "Deployments"
4. Create a new deployment with a custom command:
   ```
   npm run db:ai-migration
   ```

### Option 3: Run Migration via SQL Editor

1. Go to Railway dashboard → Your project → Database
2. Click on "Connect" or "Query" to open the SQL editor
3. Copy and paste the contents of `database/run-migration-sql.sql`
4. Execute the SQL
5. If pgvector extension fails, the migration will still create `user_questions` and `user_knowledge_profiles`
6. If `note_embeddings` creation fails, run `database/run-migration-sql-fallback.sql` separately

### Option 4: Connect via psql

```bash
# Get connection string from Railway dashboard
railway connect postgres

# Then run:
psql < database/migrations/001_add_ai_learning_tables.sql
```

## Verify Migration

After running the migration, verify the tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('note_embeddings', 'user_questions', 'user_knowledge_profiles');
```

You should see all three tables listed.

## Automatic Migration

The backend automatically runs this migration on startup if the tables don't exist. The migration:
- ✅ Always creates `user_questions` and `user_knowledge_profiles` tables
- ✅ Attempts to create `note_embeddings` with vector support if pgvector is available
- ✅ Falls back to creating `note_embeddings` with JSONB storage if pgvector is unavailable
- ⚠️ Logs warnings but doesn't fail startup if migration encounters issues

## pgvector Extension

**Railway PostgreSQL:** Railway's default PostgreSQL doesn't include pgvector. The migration handles this gracefully by:
- Creating tables that don't require pgvector first
- Using JSONB storage for embeddings if vector extension is unavailable
- Logging clear messages about what's available

**To enable pgvector on Railway:**
1. Railway doesn't currently support installing custom PostgreSQL extensions
2. Consider using a managed PostgreSQL service that supports pgvector (e.g., Supabase, Neon, or self-hosted)
3. Or use the fallback migration which stores embeddings as JSONB (works but without vector similarity search)

## Note

The backend will work without these tables (it will skip RAG context), but the personalized AI chat feature will work better once the migration is run. Even without pgvector, the system will function with reduced vector similarity search capabilities.
