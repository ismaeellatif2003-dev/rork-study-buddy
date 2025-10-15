# Railway Environment Variables

## Required Environment Variables for Google SSO

Add these to your Railway project:

```env
# Google OAuth - Web Client
GOOGLE_WEB_CLIENT_ID=170755360925-0ss8a1kc057217iibpthh7c32jhkjheq.apps.googleusercontent.com

# Google OAuth - iOS Client  
GOOGLE_IOS_CLIENT_ID=170755360925-eltu0vj4gskp57sn1d5gr0emdu2qf8uq.apps.googleusercontent.com

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-here-change-this

# Database (should already be set by Railway PostgreSQL plugin)
DATABASE_URL=postgresql://...

# OpenRouter API Key (for AI features)
OPENROUTER_API_KEY=your-openrouter-api-key

# CORS Origin (for website)
CORS_ORIGIN=https://study-buddy-web.vercel.app

# Port (Railway sets this automatically)
PORT=3000

# Node Environment
NODE_ENV=production
```

## How to Add These Variables:

1. Go to https://railway.app
2. Open your "rork-study-buddy-production" project
3. Click on the backend service
4. Go to the "Variables" tab
5. Add each variable above
6. Railway will automatically redeploy

## Testing:

After adding the variables, test the auth endpoint:

```bash
curl https://rork-study-buddy-production-eeeb.up.railway.app/
```

You should see the API status response.

