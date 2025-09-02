#!/bin/bash

echo "🔧 Fixing Railway Backend Deployment..."

# Create a temporary directory for backend deployment
echo "📁 Creating backend deployment directory..."
mkdir -p railway-backend
cp -r backend/* railway-backend/
cp railway.json railway-backend/
cp package.json railway-backend/

# Create a simple package.json for Railway
cat > railway-backend/package.json << 'EOF'
{
  "name": "study-buddy-backend",
  "version": "1.0.0",
  "description": "Study Buddy Backend API",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/node-server": "^1.8.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

echo "✅ Backend deployment files created in railway-backend/"
echo ""
echo "🚀 To deploy to Railway:"
echo "1. Go to your Railway dashboard"
echo "2. Create a new service or update existing one"
echo "3. Connect your GitHub repository"
echo "4. Set the root directory to: railway-backend"
echo "5. Set the start command to: npm start"
echo ""
echo "🌐 Or use Railway CLI:"
echo "cd railway-backend"
echo "npx @railway/cli login"
echo "npx @railway/cli up"
