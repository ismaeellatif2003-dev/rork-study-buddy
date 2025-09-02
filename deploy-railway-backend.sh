#!/bin/bash

echo "🚀 Deploying Study Buddy Backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway if not already logged in
echo "🔐 Checking Railway login status..."
if ! railway whoami &> /dev/null; then
    echo "📝 Please login to Railway..."
    railway login
fi

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your backend should be available at: https://rork-study-buddy-production.up.railway.app"
echo ""
echo "🧪 Testing the deployment..."
sleep 5

# Test the deployment
echo "📡 Testing health endpoint..."
curl -s https://rork-study-buddy-production.up.railway.app/health | jq .

echo "📡 Testing root endpoint..."
curl -s https://rork-study-buddy-production.up.railway.app/ | jq .

echo "✅ Backend deployment and testing complete!"
