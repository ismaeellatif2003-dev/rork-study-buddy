# How to Set DATABASE_URL in Backend Service

## Your PostgreSQL Variables

From your PostgreSQL service, the key variables are:
- `POSTGRES_USER="postgres"`
- `POSTGRES_PASSWORD="ExwgapXJprGmzFNKidItCFtfivCgpsjv"`
- `POSTGRES_DB="railway"`
- `DATABASE_URL` uses template variables that Railway resolves automatically

## ✅ Method 1: Railway Service Linking (RECOMMENDED - Easiest!)

**This is the best way - Railway handles everything automatically:**

1. Go to Railway Dashboard
2. Click on your **Backend Service** (Node.js app)
3. Go to **"Variables"** tab
4. **Delete** any existing `DATABASE_URL` variable (if it's malformed)
5. Click **"New Variable"** or **"Add Variable"**
6. Railway will show a dropdown with available services
7. Select your **PostgreSQL service** from the dropdown
8. Railway automatically creates `DATABASE_URL` that references the PostgreSQL service

**Result:** Railway automatically creates a `DATABASE_URL` that resolves to:
```
postgresql://postgres:ExwgapXJprGmzFNKidItCFtfivCgpsjv@[private-domain]:5432/railway
```

## Method 2: Manual Copy (If service linking doesn't work)

If you need to manually set it:

1. Go to Railway Dashboard → **PostgreSQL Service** → **Variables** tab
2. Find `DATABASE_URL` - Railway should show the **resolved value** (not the template)
3. If you see the template `postgresql://${{PGUSER}}:...`, click on it to see the resolved value
4. Copy the **entire resolved connection string**
5. Go to **Backend Service** → **Variables** tab
6. Create/edit `DATABASE_URL` and paste the value

**The resolved DATABASE_URL should look like:**
```
postgresql://postgres:ExwgapXJprGmzFNKidItCFtfivCgpsjv@[railway-private-domain]:5432/railway
```

## What You Need in Backend Variables

### ✅ Required:
- `DATABASE_URL` - The connection string to your PostgreSQL database

### ❌ NOT Needed (Railway handles these automatically):
- `POSTGRES_USER` - Not needed (included in DATABASE_URL)
- `POSTGRES_PASSWORD` - Not needed (included in DATABASE_URL)
- `POSTGRES_DB` - Not needed (included in DATABASE_URL)
- `PGHOST`, `PGPORT`, etc. - Not needed

## Important Notes

1. **Use `DATABASE_URL` from PostgreSQL service** - It uses `RAILWAY_PRIVATE_DOMAIN` which is the internal network address
2. **Don't use `DATABASE_PUBLIC_URL`** - That's for external connections, not service-to-service
3. **The password is already in the connection string** - You don't need to set it separately
4. **Railway resolves template variables automatically** - When you link services, Railway resolves `${{PGUSER}}`, `${{POSTGRES_PASSWORD}}`, etc.

## Verify It's Working

After setting `DATABASE_URL` in your backend service:

1. Railway will automatically redeploy
2. Check backend logs - you should see:
   ```
   ✅ DATABASE_URL format validated
   ✅ Database connection pool initialized and tested successfully
   ```

3. Test the connection:
   ```bash
   curl https://rork-study-buddy-production-eeeb.up.railway.app/db/status
   ```
   
   Should return: `"connected": true`

## Troubleshooting

### If you see template variables in DATABASE_URL:
- Railway should resolve these automatically when you use service linking
- If you see `${{PGUSER}}` in the backend, the service linking didn't work properly
- Try deleting and re-adding the variable using service linking

### If connection still fails:
- Make sure both services are in the same Railway project
- Verify the PostgreSQL service is running
- Check that `DATABASE_URL` doesn't contain template variables (should be resolved)

