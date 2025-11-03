# Running AI Learning Tables Migration

The `note_embeddings`, `user_questions`, and `user_knowledge_profiles` tables are required for the personalized AI chat feature to work properly.

## Error
If you see this error:
```
relation "note_embeddings" does not exist
```

This means the migration hasn't been run yet.

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
3. Copy and paste the contents of `database/migrations/001_add_ai_learning_tables.sql`
4. Execute the SQL

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

## Note

The backend will now work without the tables (it will skip RAG context), but the personalized AI chat feature will work better once the migration is run.
