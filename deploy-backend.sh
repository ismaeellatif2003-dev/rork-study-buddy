#!/bin/bash

echo "🚀 Deploying Study Buddy Backend..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Backend deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the production URL from above"
echo "2. Update your app's tRPC client with the production URL"
echo "3. Test the subscription flow with real backend verification"
echo ""
echo "🔗 Your backend will be available at: https://your-app.vercel.app/api"
echo "🏥 Health check: https://your-app.vercel.app/api/health"
echo "📊 Metrics: https://your-app.vercel.app/api/metrics"
