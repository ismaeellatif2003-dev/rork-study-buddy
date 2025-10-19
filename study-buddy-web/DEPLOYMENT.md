# Study Buddy Web - Production Deployment Guide

## 🚀 Deployment Checklist

### 1. Environment Variables Setup

Create a `.env.local` file in the `study-buddy-web` directory with the following variables:

```bash
# Google OAuth Configuration
NEXTAUTH_URL=https://your-domain.com
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

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-domain.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for development)

### 3. Build and Test

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm start
```

### 4. Deployment Options

#### Option A: Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Option B: Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Set environment variables in Netlify dashboard

#### Option C: Railway
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically

### 5. Domain Configuration

1. Update `NEXTAUTH_URL` to your production domain
2. Update Google OAuth redirect URIs
3. Update any hardcoded URLs in the code

### 6. Security Checklist

- ✅ Environment variables are set securely
- ✅ Google OAuth is configured correctly
- ✅ HTTPS is enabled
- ✅ Security headers are configured
- ✅ API endpoints are protected
- ✅ CORS is configured properly

### 7. Performance Optimizations

- ✅ Images are optimized with Next.js Image component
- ✅ Bundle is optimized with Turbopack
- ✅ Static assets are cached
- ✅ API responses are cached where appropriate

## 🔧 Troubleshooting

### Common Issues:

1. **Build Errors**: Check TypeScript errors and fix unused imports
2. **OAuth Issues**: Verify redirect URIs and client credentials
3. **API Connection**: Ensure backend URL is correct and accessible
4. **Environment Variables**: Double-check all required variables are set

### Support:
- Check the console for detailed error messages
- Verify all environment variables are set correctly
- Test API endpoints manually
- Check Google OAuth configuration

## 📱 Mobile App Integration

The web app is designed to work seamlessly with the mobile app:
- Shared authentication via Google OAuth
- Synchronized subscription status
- Cross-platform data sync
- Platform-specific subscription management
