# View Database When Query Tab is Missing

## Problem
Railway's PostgreSQL service doesn't always show a "Query" or "Data" tab. This depends on your Railway plan and service type.

## ✅ Solution: Use a Database GUI Tool (Easiest)

### Step 1: Get Connection Details

1. Go to Railway Dashboard → **PostgreSQL Service** → **Variables** tab
2. Find `DATABASE_PUBLIC_URL` - this is what you need!
3. It should look like:
   ```
   postgresql://postgres:PASSWORD@PUBLIC_HOST:PORT/railway
   ```
4. **Copy this entire connection string**

### Step 2: Install DBeaver (Free, Recommended)

1. Download DBeaver: https://dbeaver.io/download/
2. Install it (works on Mac, Windows, Linux)
3. Open DBeaver

### Step 3: Connect to Your Database

1. In DBeaver, click **"New Database Connection"** (plug icon)
2. Select **PostgreSQL**
3. Click **Next**
4. In the connection settings:
   - **Host:** Extract from `DATABASE_PUBLIC_URL` (the part after `@` and before `:5432`)
   - **Port:** Usually `5432` or check `RAILWAY_TCP_PROXY_PORT` in variables
   - **Database:** `railway`
   - **Username:** `postgres`
   - **Password:** `ExwgapXJprGmzFNKidItCFtfivCgpsjv` (from your variables)
5. Click **Test Connection** - should say "Connected"
6. Click **Finish**

### Step 4: View Your Tables

1. In DBeaver, expand your connection
2. Expand **Databases** → **railway** → **Schemas** → **public** → **Tables**
3. You'll see all 14 tables!
4. Right-click any table → **View Data** → **Top 1000 rows**
5. Or double-click a table to see its structure

## Alternative: Use TablePlus (Mac/Windows)

1. Download TablePlus: https://tableplus.com
2. Click **Create a new connection**
3. Select **PostgreSQL**
4. Enter connection details from `DATABASE_PUBLIC_URL`
5. Connect and browse tables visually

## Alternative: Use Command Line (psql)

### Step 1: Install PostgreSQL Client

**Mac:**
```bash
brew install postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql-client
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

### Step 2: Connect

1. Get `DATABASE_PUBLIC_URL` from Railway → PostgreSQL → Variables
2. Connect:
   ```bash
   psql "postgresql://postgres:ExwgapXJprGmzFNKidItCFtfivCgpsjv@[HOST]:[PORT]/railway"
   ```

### Step 3: View Tables

Once connected:
```sql
-- List all tables
\dt

-- View users table
SELECT * FROM users LIMIT 10;

-- View notes table
SELECT * FROM notes LIMIT 10;

-- Count rows in all tables
SELECT 'users' as table, COUNT(*) FROM users
UNION ALL SELECT 'notes', COUNT(*) FROM notes
UNION ALL SELECT 'flashcards', COUNT(*) FROM flashcards;

-- Quit
\q
```

## Alternative: Use Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Connect to PostgreSQL
railway connect postgres

# Once connected, you can run SQL:
\dt                    # List tables
SELECT * FROM users;    # Query data
\q                     # Quit
```

## Alternative: Use Backend API Endpoints

Your backend has endpoints to view data (once deployed):

```bash
# List all tables
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/tables

# View overview (all tables with data)
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/overview

# View specific table
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/table/users
```

## Quick Connection String Method

If you have `DATABASE_PUBLIC_URL`, you can use it directly:

**In DBeaver:**
1. New Connection → PostgreSQL
2. Click "Edit Driver Settings"
3. In "URL Template", paste your `DATABASE_PUBLIC_URL`
4. Test and connect

**In psql:**
```bash
psql "YOUR_DATABASE_PUBLIC_URL_HERE"
```

## Finding DATABASE_PUBLIC_URL

1. Railway Dashboard
2. PostgreSQL Service
3. **Variables** tab
4. Look for `DATABASE_PUBLIC_URL`
5. If you don't see it, check for:
   - `POSTGRES_URL`
   - `PGDATABASE`
   - Or construct it from individual variables

## Recommended: DBeaver

**Why DBeaver?**
- ✅ Free and open-source
- ✅ Works on all platforms
- ✅ Visual table browser
- ✅ Easy to use
- ✅ Can export data
- ✅ Can run SQL queries

**Steps:**
1. Download: https://dbeaver.io/download/
2. Install
3. New Connection → PostgreSQL
4. Use connection details from Railway
5. Browse your tables!

## Troubleshooting

### "Connection Refused"
- Make sure you're using `DATABASE_PUBLIC_URL` (not `DATABASE_URL`)
- Check that PostgreSQL service is running
- Verify the port number

### "Authentication Failed"
- Double-check the password from Railway variables
- Make sure username is `postgres`

### Can't Find DATABASE_PUBLIC_URL
- It might be named differently
- Check all variables in PostgreSQL service
- You can construct it manually from individual variables

## Summary

**Easiest Method:** Use DBeaver
1. Get `DATABASE_PUBLIC_URL` from Railway
2. Install DBeaver
3. Connect using the connection string
4. Browse tables visually

This is actually better than Railway's query interface because you get a full database GUI!

