# Railway Database Connection Fix

## Problem
The backend service is not connecting to the PostgreSQL database because `DATABASE_URL` is not being provided.

## Solution: Link PostgreSQL Service to Backend Service

### Step 1: Verify PostgreSQL Service Exists
1. Go to [Railway Dashboard](https://railway.app)
2. Open your project
3. Verify you have a **PostgreSQL** service running (you should see it in the services list)

### Step 2: Link PostgreSQL to Backend Service
Railway should automatically link services, but if it's not working:

1. **Click on your backend service** (the one running your Node.js app)
2. Go to the **"Variables"** tab
3. Look for `DATABASE_URL` in the environment variables
4. If `DATABASE_URL` is **NOT present**:
   - Click **"New Variable"**
   - Railway should show a dropdown with available services
   - Select your PostgreSQL service
   - Railway will automatically create `DATABASE_URL` with the connection string

### Step 3: Alternative - Manual Connection String
If automatic linking doesn't work:

1. **Get PostgreSQL connection string:**
   - Click on your **PostgreSQL service**
   - Go to the **"Connect"** or **"Data"** tab
   - Copy the connection string (looks like: `postgresql://postgres:password@host:port/railway`)

2. **Add to backend service:**
   - Click on your **backend service**
   - Go to **"Variables"** tab
   - Click **"New Variable"**
   - Name: `DATABASE_URL`
   - Value: Paste the connection string you copied
   - Click **"Add"**

### Step 4: Verify Connection
After adding `DATABASE_URL`, Railway will automatically redeploy. Check the logs:

1. **Backend service logs** should show:
   ```
   🔗 Initializing database connection with DATABASE_URL
   📝 DATABASE_URL present: postgresql://...
   ✅ Database connection pool initialized and tested successfully
   ```

2. **Test the connection endpoint:**
   ```bash
   curl https://rork-study-buddy-production-eeeb.up.railway.app/db/status
   ```
   
   Should return:
   ```json
   {
     "connected": true,
     "hasPool": true,
     "hasDatabaseUrl": true,
     "details": {
       "databaseName": "railway",
       "databaseUser": "postgres",
       ...
     }
   }
   ```

### Step 5: Run Migration
Once connected, trigger the migration:

```bash
curl -X POST https://rork-study-buddy-production-eeeb.up.railway.app/db/migrate
```

## Troubleshooting

### If DATABASE_URL is still not available:
1. **Check service linking:**
   - Both services must be in the same Railway project
   - The backend service must be able to access the PostgreSQL service

2. **Check Railway project structure:**
   - PostgreSQL service should be a separate service
   - Not a plugin/addon (Railway's PostgreSQL is a service)

3. **Manual verification:**
   - Check backend service logs for: `🔧 Running in development mode with mock database - no DATABASE_URL found`
   - This confirms DATABASE_URL is missing

### If connection fails even with DATABASE_URL:
1. **Check connection string format:**
   - Should be: `postgresql://user:password@host:port/database`
   - Railway's format is usually correct

2. **Check SSL settings:**
   - Railway PostgreSQL requires SSL
   - The code already handles this with `ssl: { rejectUnauthorized: false }`

3. **Check network connectivity:**
   - Both services must be in the same Railway project
   - Railway handles networking automatically

## Quick Test Commands

```bash
# Check database status
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/status

# Check health (includes database status)
curl https://rork-study-buddy-production-eeeb.up.railway.app/health

# Trigger migration manually
curl -X POST https://rork-study-buddy-production-eeeb.up.railway.app/db/migrate
```

