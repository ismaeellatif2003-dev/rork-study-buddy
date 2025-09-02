# 🚀 Backend Deployment Guide

## 📋 **Overview**

Your backend is built with:
- **Hono** - Fast web framework
- **tRPC** - Type-safe API layer
- **Node.js** - JavaScript runtime (deployed)

## 🎯 **Deployment Options**

### **Option 1: Vercel (Recommended) ⭐**

**Best for:** Easy deployment, great performance, free tier

#### **Setup Steps:**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Create deployment config:**
   ```bash
   # Create vercel.json in your project root
   {
     "functions": {
       "backend/hono.ts": {
         "runtime": "nodejs18.x"
       }
     },
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/backend/hono.ts"
       }
     ]
   }
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Get your API URL** (e.g., `https://your-app.vercel.app/api`)

### **Option 2: Railway**

**Best for:** Simple deployment, good for full-stack apps

#### **Setup Steps:**

1. **Create Railway account** at [railway.app](https://railway.app)

2. **Connect your GitHub repo**

3. **Add environment variables:**
   ```
   NODE_ENV=production
   PORT=3000
   ```

4. **Deploy automatically** from GitHub

### **Option 3: Render**

**Best for:** Free tier, easy setup

#### **Setup Steps:**

1. **Create account** at [render.com](https://render.com)

2. **Create new Web Service**

3. **Connect your GitHub repo**

4. **Configure:**
   - **Build Command:** `bun install`
   - **Start Command:** `bun run backend/hono.ts`
   - **Environment:** Node.js

### **Option 4: Fly.io**

**Best for:** Global deployment, Docker support

#### **Setup Steps:**

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create fly.toml:**
   ```toml
   app = "your-app-name"
   
   [build]
   
   [env]
   PORT = "8080"
   
   [[services]]
   internal_port = 8080
   protocol = "tcp"
   
   [[services.ports]]
   port = 80
   handlers = ["http"]
   
   [[services.ports]]
   port = 443
   handlers = ["tls", "http"]
   ```

3. **Deploy:**
   ```bash
   fly deploy
   ```

## 🛠️ **Backend Preparation**

### **1. Create Production Entry Point**

Create `backend/index.js`:
```javascript
const { serve } = require('@hono/node-server');
const app = require('./hono');

const port = process.env.PORT || 3000;

serve({
  fetch: app.fetch,
  port
});

console.log(`🚀 Server running on http://localhost:${port}`);
```

### **2. Add Environment Variables**

Create `.env` file:
```env
# Production
NODE_ENV=production
PORT=3000

# Apple Pay (for subscription verification)
APPLE_SHARED_SECRET=your_apple_shared_secret_here

# Database (if you add one later)
DATABASE_URL=your_database_url_here
```

### **3. Update Package.json Scripts**

Add these scripts to your `package.json`:
```json
{
  "scripts": {
    "backend:dev": "node backend/index.js",
    "backend:build": "echo 'No build step needed for Node.js'",
    "backend:start": "node backend/index.js"
  }
}
```

## 🔧 **Update Your App for Production**

### **1. Update tRPC Client**

Update `lib/trpc.ts`:
```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/backend/trpc/app-router';

// Production URL - replace with your deployed backend
const PRODUCTION_URL = 'https://your-app.vercel.app/api';

export const trpcClient = createTRPCReact<AppRouter>();

export const trpcClientConfig = {
  links: [
    httpBatchLink({
      url: __DEV__ 
        ? 'http://localhost:3000/api/trpc' 
        : `${PRODUCTION_URL}/trpc`,
    }),
  ],
};
```

### **2. Re-enable Backend Verification**

Update `utils/payment-service.ts`:
```typescript
// Replace the mock verification with real backend calls
private async verifyPurchaseWithBackend(purchase: SubscriptionPurchase): Promise<{
  success: boolean;
  subscription?: UserSubscription;
  error?: string;
}> {
  try {
    const { trpcClient } = await import('@/lib/trpc');
    
    const verificationResult = await trpcClient.subscription.verifyPurchase.mutate({
      platform: Platform.OS as 'ios' | 'android' | 'web',
      purchaseToken: purchase.purchaseToken,
      productId: purchase.productId,
      transactionId: purchase.transactionId,
      originalTransactionId: (purchase as any).originalTransactionId || purchase.transactionId,
      receiptData: purchase.transactionReceipt,
    });

    if (verificationResult.success && verificationResult.subscription) {
      return {
        success: true,
        subscription: {
          ...verificationResult.subscription,
          startDate: new Date(verificationResult.subscription.startDate),
          endDate: new Date(verificationResult.subscription.endDate),
        },
      };
    } else {
      return {
        success: false,
        error: verificationResult.error || 'Verification failed',
      };
    }
  } catch (error) {
    console.error('Backend verification error:', error);
    return {
      success: false,
      error: 'Verification failed',
    };
  }
}
```

## 🚀 **Quick Deploy with Vercel**

### **Step-by-Step:**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Get your URL** and update your app

## 🔒 **Security & Environment Variables**

### **Required Environment Variables:**

```env
# Apple Pay Verification
APPLE_SHARED_SECRET=your_apple_shared_secret_from_app_store_connect

# Google Play Verification (for Android)
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=your_service_account_key.json

# Database (if you add one)
DATABASE_URL=your_database_connection_string

# JWT Secret (for user authentication)
JWT_SECRET=your_jwt_secret_key
```

### **How to Get Apple Shared Secret:**

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Apps** → **Your App** → **App Information**
3. Scroll to **App-Specific Shared Secret**
4. Generate and copy the secret

## 📊 **Monitoring & Analytics**

### **Add Health Check Endpoint:**

Update `backend/hono.ts`:
```typescript
// Health check
app.get("/health", (c) => {
  return c.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Metrics endpoint
app.get("/metrics", (c) => {
  return c.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});
```

## 🧪 **Testing Your Deployed Backend**

### **Test Endpoints:**

```bash
# Health check
curl https://your-app.vercel.app/api/health

# tRPC endpoint
curl -X POST https://your-app.vercel.app/api/trpc/subscription.verifyPurchase \
  -H "Content-Type: application/json" \
  -d '{"platform":"ios","productId":"test","transactionId":"test"}'
```

## 🎯 **Next Steps After Deployment:**

1. **Update your app** with the production backend URL
2. **Test subscription flow** with real backend verification
3. **Set up monitoring** (Vercel Analytics, etc.)
4. **Add database** for user management (if needed)
5. **Set up CI/CD** for automatic deployments

## 🆘 **Troubleshooting**

### **Common Issues:**

**CORS Errors:**
- Ensure CORS is properly configured in your backend
- Check that your frontend URL is allowed

**tRPC Connection Issues:**
- Verify the API URL is correct
- Check that the tRPC endpoint is mounted at `/trpc`

**Environment Variables:**
- Make sure all required env vars are set in your deployment platform
- Check that the variable names match exactly

---

## 🎉 **Ready to Deploy!**

Choose your preferred platform and follow the steps above. **Vercel is recommended** for the easiest deployment experience.

Once deployed, update your app's tRPC client with the production URL and test the subscription flow with real backend verification!
