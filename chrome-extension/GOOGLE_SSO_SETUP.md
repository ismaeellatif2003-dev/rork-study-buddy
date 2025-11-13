# Google SSO Setup for Chrome Extension

## What I Need From You:

### Option 1: Use Existing Google OAuth Client (Recommended)
If you already have Google OAuth credentials for the web app:
- **Your existing `GOOGLE_CLIENT_ID`** (from your web app environment variables)
- I'll create a separate Chrome extension OAuth client that uses the same Google project

### Option 2: Create New Chrome Extension OAuth Client
If you prefer a separate client:
- Access to Google Cloud Console
- I'll guide you through creating a new OAuth 2.0 Client ID specifically for Chrome extensions

## What Needs to Be Configured:

### 1. Google Cloud Console Setup
In your Google Cloud Console project:

1. **Create a new OAuth 2.0 Client ID** (or modify existing one):
   - Application type: **Web application** (for Chrome extensions)
   - Name: "Study Buddy Chrome Extension"
   
2. **Authorized JavaScript origins:**
   ```
   chrome-extension://<your-extension-id>
   ```
   (The extension ID will be generated when you publish or load unpacked)

3. **Authorized redirect URIs:**
   ```
   https://<your-extension-id>.chromiumapp.org/
   ```
   (Chrome automatically generates this format)

### 2. Chrome Extension ID
The extension ID is needed for the redirect URI. It will be:
- **Development**: Generated automatically when you load the unpacked extension (found in `chrome://extensions/`)
- **Production**: Generated when you publish to Chrome Web Store

### 3. Backend API Endpoint
The extension will call:
```
POST https://rork-study-buddy-production-eeeb.up.railway.app/auth/google
```
With `platform: 'chrome-extension'` in the request body.

## Implementation Steps:

1. **Add `identity` permission** to `manifest.json`
2. **Add OAuth2 configuration** to `manifest.json` 
3. **Implement authentication flow** using `chrome.identity.launchWebAuthFlow()`
4. **Store auth token** in Chrome storage
5. **Update API client** to use stored token
6. **Add sign-in UI** to the extension popup

## Questions:

1. **Do you want to use your existing Google OAuth Client ID, or create a new one?**
   - Existing: More convenient, same Google project
   - New: More separation, cleaner setup

2. **Do you have access to Google Cloud Console?**
   - If yes: I can guide you through the setup
   - If no: You'll need to provide the Client ID after setup

3. **What's your current Google OAuth Client ID?** (if you want to reuse it)
   - Format: `xxxxx.apps.googleusercontent.com`

Once you provide the Client ID, I'll implement the full SSO flow!

