# Fix Malformed DATABASE_URL Error

## Problem
Your backend logs show:
```
📝 DATABASE_URL present: postgresql://:@rork-...
❌ Database connection test failed: connect ECONNREFUSED
```

This means your `DATABASE_URL` is **missing the username and password**.

## Solution: Get the Correct DATABASE_URL

### Step 1: Get DATABASE_URL from PostgreSQL Service

1. Go to [Railway Dashboard](https://railway.app)
2. Click on your **PostgreSQL service** (the database service)
3. Go to the **"Variables"** tab
4. Find `DATABASE_URL` - it should look like:
   ```
   postgresql://postgres:YOUR_PASSWORD@HOST:5432/railway
   ```
5. **Copy the ENTIRE connection string**

### Step 2: Update Backend Service DATABASE_URL

1. Still in Railway Dashboard
2. Click on your **backend service** (Node.js app)
3. Go to the **"Variables"** tab
4. Find `DATABASE_URL`
5. Click the **pencil/edit icon** ✏️
6. **Delete the old value** (the malformed one)
7. **Paste the correct connection string** from Step 1
8. Click **"Save"**

### Step 3: Wait for Redeploy

Railway will automatically redeploy your backend. Check the logs - you should now see:
```
📝 DATABASE_URL format validated
📝 DATABASE_URL host: [hostname]
✅ Database connection pool initialized and tested successfully
```

## Alternative: Use Railway Service Linking

If the manual copy doesn't work, use Railway's automatic linking:

1. Go to your **backend service**
2. Go to **"Variables"** tab
3. **Delete** the existing `DATABASE_URL` variable
4. Click **"New Variable"**
5. Railway should show a dropdown with available services
6. Select your **PostgreSQL service**
7. Railway will automatically create `DATABASE_URL` with the correct format

## What a Correct DATABASE_URL Looks Like

✅ **Correct format:**
```
postgresql://postgres:password123@containers-us-west-123.railway.app:5432/railway
```

❌ **Wrong format (what you have now):**
```
postgresql://:@rork-...
```

The correct format must include:
- `postgresql://` - protocol
- `postgres` - username
- `password123` - password (after the `:`)
- `@` - separator
- `host:port` - database host and port
- `/railway` - database name

## Verify It's Fixed

After updating, check your backend logs. You should see:
- ✅ `DATABASE_URL format validated`
- ✅ `Database connection pool initialized and tested successfully`
- ✅ No more `ECONNREFUSED` errors

Test the connection:
```bash
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/status
```

You should see `"connected": true` in the response.

