# 🚂 Railway Backend Setup Guide

## 📋 **Your Railway Backend is Deployed!**

Now let's connect your app to use the real backend instead of the mock verification.

## 🔍 **Step 1: Find Your Railway URL**

1. **Go to [Railway Dashboard](https://railway.app)**
2. **Click on your deployed service**
3. **Look for the "Domains" section**
4. **Copy your URL** (e.g., `https://your-app-name-production.up.railway.app`)

## 🧪 **Step 2: Test Your Backend**

Replace `YOUR_RAILWAY_URL` with your actual URL and run these commands:

```bash
# Test health endpoint
curl https://YOUR_RAILWAY_URL/health

# Test root endpoint  
curl https://YOUR_RAILWAY_URL/

# Test tRPC endpoint
curl -X POST https://YOUR_RAILWAY_URL/trpc/subscription.verifyPurchase \
  -H "Content-Type: application/json" \
  -d '{"platform":"ios","productId":"test","transactionId":"test"}'
```

## 🔧 **Step 3: Update Your App**

### **Option A: Environment Variable (Recommended)**

1. **Create `.env` file** in your project root:
   ```env
   EXPO_PUBLIC_RORK_API_BASE_URL=https://YOUR_RAILWAY_URL
   ```

2. **Restart your development server:**
   ```bash
   npx expo start --clear
   ```

### **Option B: Direct Code Update**

Update `lib/trpc.ts`:
```typescript
const getBaseUrl = () => {
  // Development
  if (__DEV__) {
    return 'http://localhost:3000';
  }
  
  // Production - replace with your Railway URL
  return 'https://YOUR_RAILWAY_URL';
};
```

## 🔄 **Step 4: Re-enable Backend Verification**

Update `utils/payment-service.ts` to use real backend verification:

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

## 🧪 **Step 5: Test the Connection**

1. **Open your app** in Xcode or simulator
2. **Go to Subscription tab**
3. **Try to subscribe** - it should now use your Railway backend
4. **Check console logs** for any connection errors

## 🔍 **Step 6: Debug Connection Issues**

### **Common Issues & Solutions:**

**1. CORS Errors:**
- Make sure your Railway backend has CORS enabled
- Check that your app's domain is allowed

**2. Network Errors:**
- Verify your Railway URL is correct
- Check if Railway service is running

**3. tRPC Connection Issues:**
- Ensure the tRPC endpoint is mounted at `/trpc`
- Check that the URL format is correct

### **Debug Commands:**

```bash
# Test if your backend is reachable
curl -I https://YOUR_RAILWAY_URL/health

# Test tRPC endpoint specifically
curl -X POST https://YOUR_RAILWAY_URL/trpc/subscription.verifyPurchase \
  -H "Content-Type: application/json" \
  -d '{"platform":"ios","productId":"test","transactionId":"test"}' \
  -v
```

## 📊 **Step 7: Monitor Your Backend**

### **Railway Dashboard:**
- **Logs:** Check for any errors in your Railway dashboard
- **Metrics:** Monitor CPU, memory usage
- **Deployments:** See deployment status

### **Health Check:**
Visit `https://YOUR_RAILWAY_URL/health` to see:
- Server status
- Uptime
- Version info

## 🎯 **Expected Results:**

✅ **Backend responds** to health checks  
✅ **tRPC calls work** without errors  
✅ **Subscription verification** uses real backend  
✅ **No more mock data** - real subscription creation  
✅ **Proper error handling** for network issues  

## 🚀 **Next Steps:**

1. **Test subscription flow** with real backend
2. **Set up environment variables** in Railway
3. **Add Apple Pay verification** secrets
4. **Monitor performance** and logs
5. **Set up alerts** for any issues

---

## 🎉 **You're Live!**

Your Study Buddy app is now connected to your Railway backend! Users can subscribe with real backend verification instead of mock data.
