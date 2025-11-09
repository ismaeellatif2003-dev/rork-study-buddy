# Fix DATABASE_URL Mismatch Between Services

## Problem
Both database and backend services have `DATABASE_URL`, but they're different values. The backend needs to use the **exact same connection string** as the PostgreSQL service.

## Solution

### Step 1: Get the Correct DATABASE_URL from PostgreSQL Service

1. Go to Railway Dashboard
2. Click on your **PostgreSQL service**
3. Go to the **"Variables"** tab
4. Find `DATABASE_URL` or `POSTGRES_URL` or `PGDATABASE`
5. **Copy the entire connection string** (it should look like: `postgresql://postgres:password@host:port/railway`)

### Step 2: Update Backend Service DATABASE_URL

1. Go to Railway Dashboard
2. Click on your **backend service** (Node.js app)
3. Go to the **"Variables"** tab
4. Find `DATABASE_URL`
5. Click the **pencil/edit icon** next to it
6. **Paste the exact connection string** from the PostgreSQL service
7. Click **"Save"**

### Step 3: Verify the Connection

After Railway redeploys (automatic), check the connection:

```bash
# Check database status
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/status
```

You should see:
```json
{
  "connected": true,
  "hasPool": true,
  "hasDatabaseUrl": true,
  "details": {
    "databaseName": "railway",
    ...
  }
}
```

## Alternative: Use Railway's Service Linking

Instead of manually copying, you can use Railway's automatic linking:

1. Go to your **backend service**
2. Go to **"Variables"** tab
3. Click **"New Variable"**
4. Railway should show a dropdown with available services
5. Select your **PostgreSQL service**
6. Railway will automatically create `DATABASE_URL` with the correct connection string

## Why This Happens

- **PostgreSQL service**: Has its own `DATABASE_URL` (internal connection info)
- **Backend service**: Needs the **same** `DATABASE_URL` to connect to that database
- If they're different, the backend is trying to connect to a different database (or wrong credentials)

## Quick Test

After updating, check backend logs for:
- ✅ `🔗 Initializing database connection with DATABASE_URL`
- ✅ `✅ Database connection pool initialized and tested successfully`

If you see:
- ❌ `🔧 Running in development mode with mock database - no DATABASE_URL found`
- Then `DATABASE_URL` is still not set correctly

## Troubleshooting

### If DATABASE_URL still doesn't work:

1. **Check the format**: Should be `postgresql://user:password@host:port/database`
2. **Check for typos**: Copy-paste exactly from PostgreSQL service
3. **Check service names**: Make sure you're copying from the correct PostgreSQL service
4. **Wait for redeploy**: Railway redeploys automatically after variable changes (usually 1-2 minutes)

