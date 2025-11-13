# How to Connect to Railway PostgreSQL Database

## ❌ SSH Connection Not Available

Railway PostgreSQL **does not support SSH connections**. This is a Railway limitation, not an error with your setup.

## ✅ Alternative Methods to Access Your Database

### Method 1: Railway's Built-in Query Interface (Easiest - RECOMMENDED)

1. Go to Railway Dashboard
2. Click on your **PostgreSQL service**
3. Click on the **"Data"** or **"Query"** tab
4. You can run SQL queries directly in the web interface

**This is the recommended way for quick queries and viewing data.**

**To view all tables, run this SQL:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**To view data in a table:**
```sql
SELECT * FROM users LIMIT 10;  -- Replace 'users' with any table name
```

See `VIEW_TABLES_IN_RAILWAY.md` for detailed instructions.

### Method 2: Connect via psql (Command Line)

Use the `DATABASE_URL` from your PostgreSQL service to connect:

```bash
# Get your DATABASE_URL from Railway PostgreSQL service → Variables tab
# Then connect:
psql "postgresql://postgres:YOUR_PASSWORD@HOST:5432/railway"
```

Or if you have the connection string:
```bash
psql $DATABASE_URL
```

### Method 3: Use a Database GUI Tool

You can use tools like:
- **pgAdmin** (free, open-source)
- **DBeaver** (free, open-source)
- **TablePlus** (paid, but has free trial)
- **Postico** (Mac only, paid)

**Connection details:**
- **Host:** Use `DATABASE_PUBLIC_URL` from PostgreSQL service (for external tools)
- **Port:** Usually `5432` or check `RAILWAY_TCP_PROXY_PORT`
- **Database:** `railway` (or `${{PGDATABASE}}`)
- **Username:** `postgres` (or `${{POSTGRES_USER}}`)
- **Password:** `ExwgapXJprGmzFNKidItCFtfivCgpsjv` (from your variables)

**Important:** For external tools, use `DATABASE_PUBLIC_URL` not `DATABASE_URL` (which is for internal Railway networking).

### Method 4: Use Railway CLI

If you have Railway CLI installed:

```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login
railway login

# Connect to your project
railway link

# Open database shell
railway connect postgres
```

### Method 5: Via Your Backend API

Your backend already has endpoints to query the database:

```bash
# List all tables
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/tables

# Check database status
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/status
```

## Why SSH Doesn't Work

Railway PostgreSQL runs in a containerized environment and doesn't expose SSH access. This is by design for security and simplicity. Railway provides:

- ✅ Web-based query interface
- ✅ Connection strings for applications
- ✅ Public URL for external tools
- ❌ No SSH access

## Recommended Approach

**For most use cases, use Railway's built-in query interface:**
1. Go to PostgreSQL service → **Data** tab
2. Run your SQL queries there
3. View results in the web UI

**For advanced database management:**
- Use a GUI tool like DBeaver or pgAdmin
- Connect using `DATABASE_PUBLIC_URL` from your PostgreSQL service variables

## Getting Connection Details

To get the connection details for external tools:

1. Go to Railway Dashboard → PostgreSQL Service → **Variables** tab
2. Find `DATABASE_PUBLIC_URL` - this is for external connections
3. It should look like: `postgresql://postgres:PASSWORD@PUBLIC_HOST:PORT/railway`

**Note:** `DATABASE_URL` uses `RAILWAY_PRIVATE_DOMAIN` (internal Railway networking)
**Note:** `DATABASE_PUBLIC_URL` uses `RAILWAY_TCP_PROXY_DOMAIN` (external access)

## Quick Test

Test your connection using psql:

```bash
# Replace with your actual DATABASE_PUBLIC_URL
psql "postgresql://postgres:ExwgapXJprGmzFNKidItCFtfivCgpsjv@[PUBLIC_HOST]:[PORT]/railway"

# Once connected, try:
\dt  # List all tables
SELECT * FROM users LIMIT 5;  # Query a table
\q   # Quit
```

## Troubleshooting

### "Connection refused" or "Connection closed"
- Make sure you're using `DATABASE_PUBLIC_URL` (not `DATABASE_URL`) for external tools
- Check that your PostgreSQL service is running
- Verify the port number is correct

### "Authentication failed"
- Double-check the password from PostgreSQL service variables
- Make sure you're using the correct username (`postgres`)

### Can't find DATABASE_PUBLIC_URL
- It should be in PostgreSQL service → Variables tab
- If missing, Railway might not have generated it yet
- You can construct it manually using the variables you have

