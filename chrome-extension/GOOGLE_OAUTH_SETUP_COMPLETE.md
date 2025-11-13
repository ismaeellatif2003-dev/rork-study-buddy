# Google OAuth Setup - COMPLETE ✅

## Configuration Applied:
- **Client ID**: `<YOUR_GOOGLE_OAUTH_CLIENT_ID>`
- **Extension ID**: `mglmcjpdlidjlhggghahacccjkfhpjmg`

## Final Step Required - Google Cloud Console:

You need to add the Chrome Extension redirect URI to your Google OAuth Client:

### Important: Use "Web application" Type

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to**: APIs & Services → Credentials
3. **Find your OAuth 2.0 Client ID**: copy the value shown in Google Cloud Console and update `manifest.json`.
4. **Click Edit** (pencil icon)
5. **Verify Application type is "Web application"** (not "Chrome app" or "Desktop app")
6. **In "Authorized redirect URIs" section, click "ADD URI"** and add:
   ```
   https://mglmcjpdlidjlhggghahacccjkfhpjmg.chromiumapp.org/
   ```
7. **In "Authorized JavaScript origins" section, click "ADD URI"** and add:
   ```
   https://mglmcjpdlidjlhggghahacccjkfhpjmg.chromiumapp.org
   ```
   (Note: No trailing slash for JavaScript origins)
8. **Click Save**

### If "Authorized redirect URIs" Field is Missing:

- Make sure the **Application type** is set to **"Web application"**
- If you created it as a different type, you may need to:
  - Create a NEW OAuth client with type "Web application"
  - OR edit the existing one and change the application type
  - The redirect URI field only appears for "Web application" type

## How It Works:

1. User clicks "Sign in with Google" in the extension popup
2. Chrome opens Google OAuth consent screen
3. User authorizes the extension
4. Extension receives access token from Google
5. Extension sends token to backend API: `/auth/google` with `platform: 'chrome-extension'`
6. Backend verifies token and returns JWT token
7. Extension stores JWT token and user info
8. All API calls now use the JWT token for authentication

## Testing:

1. Load the extension in Chrome
2. Open the extension popup
3. Click "Sign in with Google"
4. Complete Google sign-in flow
5. You should see your user info displayed
6. Notes will now sync to your Study Buddy account!

## Troubleshooting:

- **"OAuth error"**: Check that redirect URI is added to Google Console
- **"Backend authentication failed"**: Check backend logs
- **Token not stored**: Check browser console for errors

