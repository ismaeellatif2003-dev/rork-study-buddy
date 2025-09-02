# 🔧 Railway Backend Deployment Fix

## ❌ Current Issue
Your Railway backend is returning 502 errors because Railway is trying to run your Expo app instead of your backend.

## ✅ Solution

### **Option 1: Use Railway Dashboard (Recommended)**

1. **Go to your Railway dashboard** at [railway.app](https://railway.app)
2. **Find your existing service** (rork-study-buddy-production)
3. **Click on Settings** → **General**
4. **Change the Root Directory** to: `railway-backend`
5. **Set the Start Command** to: `npm start`
6. **Save and redeploy**

### **Option 2: Use Railway CLI**

```bash
# Login to Railway
npx @railway/cli login

# Deploy from the backend directory
cd railway-backend
npx @railway/cli up
```

### **Option 3: Create New Service**

1. **Create a new service** in Railway
2. **Connect your GitHub repository**
3. **Set Root Directory** to: `railway-backend`
4. **Set Start Command** to: `npm start`

## 🧪 Testing

After deployment, test your backend:

```bash
# Test health endpoint
curl https://rork-study-buddy-production.up.railway.app/health

# Test subscription endpoint
curl -X POST https://rork-study-buddy-production.up.railway.app/trpc/subscription.verifyPurchase \
  -H "Content-Type: application/json" \
  -d '{"platform":"ios","productId":"pro_monthly","transactionId":"test123"}'
```

## 📁 Files Created

The `fix-railway-deployment.sh` script created:
- `railway-backend/` directory
- `railway-backend/index.js` - Backend server
- `railway-backend/hono.js` - Hono app
- `railway-backend/package.json` - Backend dependencies
- `railway-backend/railway.json` - Railway config

## 🎯 Expected Result

After fixing the deployment:
- ✅ Railway backend responds to health checks
- ✅ No more 502 errors
- ✅ Your app can connect to the backend
- ✅ Real subscription verification works

## 🔍 Quick Test

The backend is already working locally:
```bash
cd railway-backend
node index.js
# Then test: curl http://localhost:3000/health
```

Just need to deploy it to Railway with the correct configuration!
