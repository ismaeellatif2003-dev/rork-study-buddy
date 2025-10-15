# Google OAuth Setup Guide for Study Buddy

This guide explains how to set up Google OAuth for both the website and mobile app with separate client IDs.

## 🔧 Google Cloud Console Setup

### 1. Create OAuth 2.0 Client IDs

**Step 1: Go to Google Cloud Console**
- Visit [Google Cloud Console](https://console.cloud.google.com/)
- Select your project or create a new one
- Go to "APIs & Services" > "Credentials"

**Step 2: Create Web Client (for Website)**
- Click "Create Credentials" > "OAuth 2.0 Client ID"
- Application type: **Web application**
- Name: `Study Buddy Web`
- Authorized JavaScript origins:
  ```
  http://localhost:3000
  https://yourdomain.com
  ```
- Authorized redirect URIs:
  ```
  http://localhost:3000/api/auth/callback/google
  https://yourdomain.com/api/auth/callback/google
  ```
- **Save the Client ID and Client Secret**

**Step 3: Create iOS Client (for Mobile App)**
- Click "Create Credentials" > "OAuth 2.0 Client ID"
- Application type: **iOS**
- Name: `Study Buddy iOS`
- Bundle ID: `app.rork.study_buddy_4fpqfs7`
- **Save the Client ID** (no secret needed for iOS)

## 📱 Environment Variables Setup

### Website (.env.local)
```bash
# Web OAuth Client
GOOGLE_CLIENT_ID=your-web-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-web-client-secret

# API Configuration
NEXT_PUBLIC_API_URL=https://rork-study-buddy-production-eeeb.up.railway.app
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### Mobile App (.env or app.config.js)
```bash
# iOS OAuth Client
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.googleusercontent.com

# Backend API
EXPO_PUBLIC_API_URL=https://rork-study-buddy-production-eeeb.up.railway.app
```

### Railway Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Google OAuth - Web Client
GOOGLE_WEB_CLIENT_ID=your-web-client-id.googleusercontent.com
GOOGLE_WEB_CLIENT_SECRET=your-web-client-secret

# Google OAuth - iOS Client
GOOGLE_IOS_CLIENT_ID=your-ios-client-id.googleusercontent.com

# Fallback (for backward compatibility)
GOOGLE_CLIENT_ID=your-web-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-web-client-secret

# JWT
JWT_SECRET=your-jwt-secret-key

# Environment
NODE_ENV=production
```

## 🔄 How It Works

### Authentication Flow:

1. **Website Authentication:**
   - Uses `GOOGLE_WEB_CLIENT_ID` for OAuth
   - Redirects to `/api/auth/callback/google`
   - Backend verifies with `GOOGLE_WEB_CLIENT_ID`

2. **Mobile App Authentication:**
   - Uses `GOOGLE_IOS_CLIENT_ID` for OAuth
   - Sends ID token directly to backend
   - Backend verifies with `GOOGLE_IOS_CLIENT_ID`

3. **Cross-Platform Sync:**
   - Both platforms use the same Google account
   - Backend creates unified user profile
   - Data syncs automatically between platforms

## 🧪 Testing

### Test Website:
1. Go to `http://localhost:3000`
2. Click "Continue with Google"
3. Sign in with your Google account
4. Check settings page for profile info

### Test Mobile App:
1. Open mobile app
2. Go to Settings
3. Click "Continue with Google"
4. Sign in with same Google account
5. Verify sync status shows "Signed in"

### Test Cross-Platform Sync:
1. Create a note on website
2. Check mobile app - note should appear
3. Create flashcards on mobile app
4. Check website - flashcards should appear
5. Upgrade to Pro on website
6. Check mobile app - should show Pro status

## 🚨 Important Notes

- **Different Client IDs**: Web and iOS must use separate OAuth clients
- **Same Google Account**: Users must sign in with the same Google account on both platforms
- **Bundle ID**: iOS client must match your app's bundle ID exactly
- **Redirect URIs**: Web client must include all your domains
- **Environment Variables**: Make sure all platforms have correct environment variables

## 🔧 Troubleshooting

### Common Issues:

1. **"Invalid client" error:**
   - Check that client IDs match exactly
   - Verify bundle ID for iOS client
   - Check redirect URIs for web client

2. **"Access denied" error:**
   - Check Google Cloud Console OAuth consent screen
   - Make sure app is in testing mode or published
   - Add test users if in testing mode

3. **Sync not working:**
   - Check backend environment variables
   - Verify database connection
   - Check network connectivity

4. **Mobile app sign-in fails:**
   - Check `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - Verify Google Play Services is available
   - Check device internet connection

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Test with a fresh Google account
4. Check Google Cloud Console for any restrictions
