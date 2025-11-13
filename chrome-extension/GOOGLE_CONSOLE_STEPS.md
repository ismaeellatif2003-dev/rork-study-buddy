# Google Cloud Console - Step by Step Guide

## ⚠️ Important: Application Type Issue

**You selected "Chrome extension" as the application type, but this is incorrect!**

For Chrome extensions using Manifest V3 with `chrome.identity.launchWebAuthFlow()`, you **MUST use "Web application"** type, not "Chrome extension".

- ❌ **"Chrome extension" type**: For deprecated Chrome Apps (doesn't work with modern extensions)
- ✅ **"Web application" type**: Required for Manifest V3 Chrome extensions

## Solution: Create New Client with "Web application" Type

**⚠️ Important**: You cannot change the application type after creation. Since you selected "Chrome extension", you need to create a **NEW** OAuth client with type "Web application".

### Step-by-Step Instructions:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials

2. **Click "+ CREATE CREDENTIALS"** button (top of the page)

3. **Select "OAuth client ID"**

4. **If you see OAuth consent screen warning**:
   - Click "CONFIGURE CONSENT SCREEN"
   - **User Type**: Select "External" (unless you have Google Workspace)
   - **App name**: "Study Buddy"
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - Click "SAVE AND CONTINUE" through all steps
   - Return to "Credentials" page

5. **Create the OAuth client**:
   - **Application type**: **Select "Web application"** ⚠️ 
     - ⚠️ **DO NOT select "Chrome extension"** - that's for deprecated Chrome Apps
   - **Name**: "Study Buddy Chrome Extension" (or any name you prefer)

6. **Add Authorized JavaScript origins**:
   - You should see a text field with "+ ADD URI" button
   - Click **"+ ADD URI"**
   - Paste: `https://mglmcjpdlidjlhggghahacccjkfhpjmg.chromiumapp.org`
   - (No trailing slash for JavaScript origins)

7. **Add Authorized redirect URIs**:
   - You should see a text field with "+ ADD URI" button  
   - Click **"+ ADD URI"**
   - Paste: `https://mglmcjpdlidjlhggghahacccjkfhpjmg.chromiumapp.org/`
   - (With trailing slash `/` for redirect URIs)

8. **Click "CREATE"** button

9. **Copy the Client ID** that appears (format: `xxxxx-xxxxx.apps.googleusercontent.com`)

10. **Share the new Client ID with me** and I'll update `manifest.json`

11. **(Optional)**: You can delete the old "Chrome extension" type client since it won't work

## Visual Guide:

When you see this screen, you should have:
```
┌─────────────────────────────────────────┐
│ Application type: [Web application ▼]  │
│                                         │
│ Name: Study Buddy Chrome Extension      │
│                                         │
│ Authorized JavaScript origins           │
│ ┌─────────────────────────────────────┐ │
│ │ https://...chromiumapp.org          │ │
│ └─────────────────────────────────────┘ │
│ [+ ADD URI]                              │
│                                         │
│ Authorized redirect URIs                 │
│ ┌─────────────────────────────────────┐ │
│ │ https://...chromiumapp.org/         │ │
│ └─────────────────────────────────────┘ │
│ [+ ADD URI]                              │
│                                         │
│ [SAVE] [CANCEL]                          │
└─────────────────────────────────────────┘
```

## Still Not Working?

If you still don't see the redirect URI field:
1. Make sure you're editing the OAuth 2.0 Client ID (not API key)
2. Try a different browser or incognito mode
3. Check that you have "Editor" or "Owner" permissions on the project
4. Try creating a new client with type "Web application"

