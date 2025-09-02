#!/bin/bash

echo "🚂 Testing Railway Backend Connection"
echo ""

# Get Railway URL from user
read -p "Enter your Railway URL (e.g., https://your-app.up.railway.app): " RAILWAY_URL

if [ -z "$RAILWAY_URL" ]; then
    echo "❌ No URL provided. Exiting."
    exit 1
fi

echo ""
echo "🔍 Testing Railway backend at: $RAILWAY_URL"
echo ""

# Test health endpoint
echo "1️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$RAILWAY_URL/health")
if [ $? -eq 0 ]; then
    echo "✅ Health check passed:"
    echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "❌ Health check failed"
fi

echo ""

# Test root endpoint
echo "2️⃣ Testing root endpoint..."
ROOT_RESPONSE=$(curl -s "$RAILWAY_URL/")
if [ $? -eq 0 ]; then
    echo "✅ Root endpoint working:"
    echo "$ROOT_RESPONSE" | jq . 2>/dev/null || echo "$ROOT_RESPONSE"
else
    echo "❌ Root endpoint failed"
fi

echo ""

# Test tRPC endpoint
echo "3️⃣ Testing tRPC endpoint..."
TRPC_RESPONSE=$(curl -s -X POST "$RAILWAY_URL/trpc/subscription.verifyPurchase" \
  -H "Content-Type: application/json" \
  -d '{"platform":"ios","productId":"test","transactionId":"test"}')
if [ $? -eq 0 ]; then
    echo "✅ tRPC endpoint working:"
    echo "$TRPC_RESPONSE" | jq . 2>/dev/null || echo "$TRPC_RESPONSE"
else
    echo "❌ tRPC endpoint failed"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. If all tests passed ✅, your backend is working!"
echo "2. Update your app with the Railway URL"
echo "3. Test subscription flow in your app"
echo ""
echo "📝 To update your app, create a .env file with:"
echo "EXPO_PUBLIC_RORK_API_BASE_URL=$RAILWAY_URL"
