# Study Buddy Web - Railway Deployment Guide

## 🚂 Deploying to Railway

### Step 1: Add Web Service to Existing Project

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Open your existing project** (the one with your backend)
3. **Click "New Service"** or the "+" button
4. **Select "GitHub Repo"**
5. **Choose your repository**: `rork-study-buddy`
6. **Set Root Directory**: `study-buddy-web`
7. **Click "Deploy"**

### Step 2: Configure Environment Variables

In your Railway web service, go to **Settings** → **Variables** and add:

```bash
# Google OAuth Configuration
NEXTAUTH_URL=https://your-railway-domain.up.railway.app
NEXTAUTH_SECRET=your_secure_random_string_here

# Google OAuth Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Backend API Configuration
NEXT_PUBLIC_API_URL=https://rork-study-buddy-production-eeeb.up.railway.app
API_SECRET=your_api_secret_here

# Environment
NODE_ENV=production
```

### Step 3: Get Your Railway URL

After deployment, Railway will provide a URL like:
`https://study-buddy-web-production-xxxx.up.railway.app`

### Step 4: Update Google OAuth Settings

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to APIs & Services** → **Credentials**
3. **Edit your OAuth 2.0 Client ID**
4. **Add Authorized Redirect URIs**:
   ```
   https://your-railway-domain.up.railway.app/api/auth/callback/google
   ```
5. **Save changes**

### Step 5: Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET`.

### Step 6: Test Deployment

1. **Visit your Railway URL**
2. **Test Google Sign-In**
3. **Verify subscription sync** with your mobile app
4. **Check all features** work correctly

## 🔧 Railway Configuration

The `railway.json` file configures:
- **Builder**: NIXPACKS (auto-detects Next.js)
- **Start Command**: `npm start`
- **Health Check**: Root path `/`
- **Restart Policy**: Automatic restart on failure

## 🌐 Custom Domain (Optional)

To add a custom domain later:

1. **Go to your Railway service**
2. **Settings** → **Domains**
3. **Add custom domain**
4. **Follow DNS instructions**
5. **Update NEXTAUTH_URL** environment variable
6. **Update Google OAuth** redirect URIs

## 📊 Project Structure

Your Railway project will have:
```
Railway Project: "rork-study-buddy"
├── Service 1: Backend
│   └── URL: https://rork-study-buddy-production-eeeb.up.railway.app
└── Service 2: Web App
    └── URL: https://study-buddy-web-production-xxxx.up.railway.app
```

## 🚀 Deployment Features

- ✅ **Automatic deployments** from GitHub
- ✅ **SSL certificates** included
- ✅ **Environment variable management**
- ✅ **Built-in monitoring** and logs
- ✅ **Easy scaling** if needed

## 🔍 Troubleshooting

### Build Issues:
- Check Railway logs for build errors
- Verify all environment variables are set
- Ensure `package.json` scripts are correct

### OAuth Issues:
- Verify redirect URIs match exactly
- Check `NEXTAUTH_URL` matches your Railway domain
- Ensure `NEXTAUTH_SECRET` is set

### API Connection Issues:
- Verify `NEXT_PUBLIC_API_URL` points to your backend
- Check backend is running and accessible
- Test API endpoints manually

## 📱 Mobile App Integration

After deployment:
1. **Update mobile app** with new web URL (if needed)
2. **Test cross-platform sync**
3. **Verify subscription management** works
4. **Test platform-specific cancellation**

## 🎯 Next Steps

1. Deploy to Railway
2. Test all functionality
3. Set up custom domain (optional)
4. Configure monitoring
5. Set up backups (if needed)
